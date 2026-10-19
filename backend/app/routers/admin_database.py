import logging
import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import inspect, text, Table, MetaData
from sqlalchemy.orm import Session
from app.db.session import get_db, engine
from app.dependencies.auth import require_admin
from app.models.user import User
from app.core.security import get_password_hash

logger = logging.getLogger("taskflow.database")

router = APIRouter(prefix="/admin/database", tags=["Admin Database Management"])

def serialize_val(val: Any) -> Any:
    """Helper to ensure all DB values serialize nicely to JSON."""
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.isoformat()
    if isinstance(val, bytes):
        try:
            return val.decode("utf-8")
        except Exception:
            return str(val)
    return val

def serialize_row(row_dict: Dict[str, Any]) -> Dict[str, Any]:
    return {k: serialize_val(v) for k, v in row_dict.items()}

def get_table_or_404(table_name: str) -> str:
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    if table_name not in existing_tables:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Table '{table_name}' does not exist in database.",
        )
    return table_name

class SqlQueryRequest(BaseModel):
    query: str

@router.get("/tables")
def list_database_tables(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List all database tables with structural metadata, columns, PKs, and row counts."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    tables_meta = []
    for tbl in sorted(table_names):
        try:
            count_res = db.execute(text(f'SELECT COUNT(*) FROM "{tbl}"')).scalar()
        except Exception:
            count_res = 0

        columns_info = []
        for col in inspector.get_columns(tbl):
            columns_info.append({
                "name": col["name"],
                "type": str(col["type"]),
                "nullable": bool(col.get("nullable", True)),
                "primary_key": bool(col.get("primary_key", False)),
                "default": str(col.get("default", "")) if col.get("default") is not None else None,
                "autoincrement": bool(col.get("autoincrement", False)),
            })

        pk_constraint = inspector.get_pk_constraint(tbl)
        pk_cols = pk_constraint.get("constrained_columns", []) if pk_constraint else []

        fk_info = []
        for fk in inspector.get_foreign_keys(tbl):
            fk_info.append({
                "constrained_columns": fk.get("constrained_columns", []),
                "referred_table": fk.get("referred_table", ""),
                "referred_columns": fk.get("referred_columns", []),
            })

        tables_meta.append({
            "name": tbl,
            "row_count": count_res,
            "columns": columns_info,
            "primary_keys": pk_cols,
            "foreign_keys": fk_info,
        })

    return {
        "tables": tables_meta,
        "database_type": engine.dialect.name,
        "total_tables": len(tables_meta),
    }

@router.get("/tables/{table_name}/rows")
def get_table_rows(
    table_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Retrieve paginated rows for a specific database table with search and sorting."""
    validated_tbl = get_table_or_404(table_name)
    inspector = inspect(engine)
    cols = inspector.get_columns(validated_tbl)
    col_names = [c["name"] for c in cols]
    pk_constraint = inspector.get_pk_constraint(validated_tbl)
    pk_cols = pk_constraint.get("constrained_columns", []) if pk_constraint else []

    # Build base queries
    where_clauses = []
    params: Dict[str, Any] = {}

    if search:
        # Search text/varchar columns
        search_subclauses = []
        for idx, c in enumerate(cols):
            c_type = str(c["type"]).lower()
            if any(t in c_type for t in ["varchar", "text", "string", "char"]):
                pname = f"search_{idx}"
                search_subclauses.append(f'CAST("{c["name"]}" AS TEXT) LIKE :{pname}')
                params[pname] = f"%{search.strip()}%"
        if search_subclauses:
            where_clauses.append(f"({' OR '.join(search_subclauses)})")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Count total
    count_sql = text(f'SELECT COUNT(*) FROM "{validated_tbl}" {where_sql}')
    total_rows = db.execute(count_sql, params).scalar() or 0

    # Sorting
    if sort_by and sort_by in col_names:
        order_direction = "DESC" if sort_order.lower() == "desc" else "ASC"
        order_sql = f'ORDER BY "{sort_by}" {order_direction}'
    elif pk_cols:
        order_sql = f'ORDER BY "{pk_cols[0]}" DESC'
    else:
        order_sql = ""

    # Pagination
    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_sql = text(f'SELECT * FROM "{validated_tbl}" {where_sql} {order_sql} LIMIT :limit OFFSET :offset')
    result = db.execute(data_sql, params)
    
    rows = []
    for r in result.mappings():
        rows.append(serialize_row(dict(r)))

    total_pages = max(1, (total_rows + page_size - 1) // page_size)

    return {
        "table_name": validated_tbl,
        "primary_keys": pk_cols,
        "columns": [
            {
                "name": c["name"],
                "type": str(c["type"]),
                "nullable": bool(c.get("nullable", True)),
                "primary_key": bool(c.get("primary_key", False)),
                "default": str(c.get("default", "")) if c.get("default") is not None else None,
                "autoincrement": bool(c.get("autoincrement", False)),
            }
            for c in cols
        ],
        "rows": rows,
        "page": page,
        "page_size": page_size,
        "total_rows": total_rows,
        "total_pages": total_pages,
    }

@router.post("/tables/{table_name}/rows", status_code=status.HTTP_201_CREATED)
def create_table_row(
    table_name: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Insert a new record into any table, securely hashing passwords for user tables."""
    validated_tbl = get_table_or_404(table_name)
    inspector = inspect(engine)
    col_names = {c["name"]: c for c in inspector.get_columns(validated_tbl)}

    # Filter payload to only existing columns
    insert_data = {}
    for k, v in payload.items():
        if k in col_names:
            # Special handling for user passwords if inserted via DB Manager
            if validated_tbl == "users" and k in ["hashed_password", "password"] and v:
                val_str = str(v)
                if not val_str.startswith("$2b$") and not val_str.startswith("$2a$"):
                    insert_data["hashed_password"] = get_password_hash(val_str)
                    continue
            insert_data[k] = v

    if not insert_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid columns provided for insertion.",
        )

    cols_quoted = [f'"{k}"' for k in insert_data.keys()]
    placeholders = [f":{k}" for k in insert_data.keys()]

    sql = text(f'INSERT INTO "{validated_tbl}" ({", ".join(cols_quoted)}) VALUES ({", ".join(placeholders)})')
    try:
        db.execute(sql, insert_data)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to insert into {validated_tbl}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database insert error: {str(e)}",
        )

    return {"success": True, "message": f"Successfully created record in {validated_tbl}"}

@router.put("/tables/{table_name}/rows/{row_id}")
def update_table_row(
    table_name: str,
    row_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update an existing table record by primary key."""
    validated_tbl = get_table_or_404(table_name)
    inspector = inspect(engine)
    cols = inspector.get_columns(validated_tbl)
    col_names = {c["name"]: c for c in cols}
    pk_constraint = inspector.get_pk_constraint(validated_tbl)
    pk_cols = pk_constraint.get("constrained_columns", []) if pk_constraint else []

    pk_name = pk_cols[0] if pk_cols else "id"
    if pk_name not in col_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update table '{validated_tbl}' without an identifiable primary key.",
        )

    # Cast row_id if integer
    pk_col_type = str(col_names[pk_name]["type"]).lower()
    typed_pk: Any = row_id
    if "int" in pk_col_type:
        try:
            typed_pk = int(row_id)
        except ValueError:
            pass

    set_clauses = []
    params: Dict[str, Any] = {"_pk_val": typed_pk}

    for k, v in payload.items():
        if k in col_names and k != pk_name:
            if validated_tbl == "users" and k in ["hashed_password", "password"] and v:
                val_str = str(v)
                if not val_str.startswith("$2b$") and not val_str.startswith("$2a$"):
                    v = get_password_hash(val_str)
                    k = "hashed_password"
            set_clauses.append(f'"{k}" = :{k}')
            params[k] = v

    if not set_clauses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for update.",
        )

    sql = text(f'UPDATE "{validated_tbl}" SET {", ".join(set_clauses)} WHERE "{pk_name}" = :_pk_val')
    try:
        res = db.execute(sql, params)
        db.commit()
        if res.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Record with {pk_name}={row_id} not found in {validated_tbl}.",
            )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update {validated_tbl}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database update error: {str(e)}",
        )

    return {"success": True, "message": f"Successfully updated record {row_id} in {validated_tbl}"}

@router.delete("/tables/{table_name}/rows/{row_id}")
def delete_table_row(
    table_name: str,
    row_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete a record from any table by primary key."""
    validated_tbl = get_table_or_404(table_name)
    inspector = inspect(engine)
    pk_constraint = inspector.get_pk_constraint(validated_tbl)
    pk_cols = pk_constraint.get("constrained_columns", []) if pk_constraint else []

    pk_name = pk_cols[0] if pk_cols else "id"
    col_names = {c["name"]: c for c in inspector.get_columns(validated_tbl)}

    if pk_name not in col_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete from table '{validated_tbl}' without a primary key.",
        )

    pk_col_type = str(col_names[pk_name]["type"]).lower()
    typed_pk: Any = row_id
    if "int" in pk_col_type:
        try:
            typed_pk = int(row_id)
        except ValueError:
            pass

    sql = text(f'DELETE FROM "{validated_tbl}" WHERE "{pk_name}" = :pk_val')
    try:
        res = db.execute(sql, {"pk_val": typed_pk})
        db.commit()
        if res.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Record with {pk_name}={row_id} not found in {validated_tbl}.",
            )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete from {validated_tbl}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database delete error: {str(e)}",
        )

    return {"success": True, "message": f"Successfully deleted record from {validated_tbl}"}

@router.post("/query")
def execute_sql_query(
    body: SqlQueryRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Execute raw SQL statements with safety execution limits for administrative database inspection."""
    raw_query = body.query.strip()
    if not raw_query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query cannot be empty.")

    is_select = raw_query.upper().startswith("SELECT") or raw_query.upper().startswith("PRAGMA") or raw_query.upper().startswith("EXPLAIN")

    try:
        start_time = datetime.datetime.now()
        stmt = text(raw_query)
        result = db.execute(stmt)

        execution_ms = round((datetime.datetime.now() - start_time).total_seconds() * 1000, 2)

        if is_select and result.returns_rows:
            columns = list(result.keys())
            rows = [serialize_row(dict(r)) for r in result.mappings()]
            return {
                "success": True,
                "is_select": True,
                "columns": columns,
                "rows": rows[:200],  # cap at 200 rows for response safety
                "total_returned": len(rows),
                "execution_ms": execution_ms,
            }
        else:
            db.commit()
            return {
                "success": True,
                "is_select": False,
                "rows_affected": result.rowcount,
                "execution_ms": execution_ms,
                "message": f"Executed query successfully. {result.rowcount} row(s) affected.",
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query error: {str(e)}",
        )
