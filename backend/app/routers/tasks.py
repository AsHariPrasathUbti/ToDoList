from fastapi import APIRouter, Depends, Query, status, Response, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import math
import csv
import io
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskAssignmentsUpdate,
    TaskAssignmentStatusUpdate,
    TaskResponse,
    TaskListResponse,
    PaginationMetadata,
)
from app.services.task_service import TaskService
from app.dependencies.auth import get_current_user, require_admin

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new task and assign it to users (Admin only)."""
    return TaskService.create_task(db=db, admin_user=admin, task_in=task_in)

@router.get("/", response_model=TaskListResponse)
def list_tasks(
    search: Optional[str] = Query(None, description="Search across title and description"),
    status: Optional[str] = Query(None, description="Filter by status (Pending, In Progress, Completed)"),
    priority: Optional[str] = Query(None, description="Filter by priority (Low, Medium, High, Urgent)"),
    assigned_user_id: Optional[int] = Query(None, description="Filter by assigned user ID (Admin only)"),
    due_date: Optional[str] = Query(None, description="Filter by due date category (today, upcoming, overdue)"),
    overdue: Optional[bool] = Query(None, description="Filter overdue tasks"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve tasks. Admin views all; regular users only view their assigned tasks."""
    # Prevent non-admin from using assigned_user_id filter
    if assigned_user_id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Filtering by other assigned users is restricted to Admins",
        )

    items, total = TaskService.list_tasks(
        db=db,
        user=current_user,
        search=search,
        task_status=status,
        priority=priority,
        assigned_user_id=assigned_user_id,
        due_date=due_date,
        overdue=overdue,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return TaskListResponse(
        items=[TaskResponse.model_validate(item) for item in items],
        pagination=PaginationMetadata(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        ),
    )

@router.get("/export/csv")
def export_tasks_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export tasks to CSV format (Admin gets all tasks; User gets assigned tasks)."""
    tasks, _ = TaskService.list_tasks(
        db=db,
        user=current_user,
        page=1,
        page_size=10000,
        sort_by="created_at",
        sort_order="desc",
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Description", "Status", "Priority", "Due Date", "Assigned Users", "Created At"])
    for t in tasks:
        assigned_names = ", ".join([a.user.name for a in t.assignments if a.user]) if t.assignments else "Unassigned"
        writer.writerow([
            t.id,
            t.title,
            t.description or "",
            t.status,
            t.priority,
            t.due_date.isoformat() if t.due_date else "",
            assigned_names,
            t.created_at.isoformat() if t.created_at else "",
        ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tasks_export.csv"},
    )

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single task details. Admin can view any task; User can only view if assigned."""
    return TaskService.get_task_by_id(db=db, user=current_user, task_id=task_id)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update task details and/or assignments (Admin only)."""
    return TaskService.update_task(db=db, admin_user=admin, task_id=task_id, task_in=task_in)

@router.patch("/{task_id}/assignments", response_model=TaskResponse)
def update_task_assignments(
    task_id: int,
    payload: TaskAssignmentsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Manage and update users assigned to a task (Admin only)."""
    return TaskService.reassign_task(db=db, admin_user=admin, task_id=task_id, new_user_ids=payload.assigned_user_ids)

@router.patch("/{task_id}/assignments/{user_id}/status", response_model=TaskResponse)
def update_assignment_status(
    task_id: int,
    user_id: int,
    status_in: TaskAssignmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update individual assignment status. Regular users can only update their own assignment."""
    return TaskService.update_assignment_status(
        db=db,
        current_user=current_user,
        task_id=task_id,
        target_user_id=user_id,
        status_in=status_in,
    )

@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete a task and its assignments (Admin only)."""
    TaskService.delete_task(db=db, admin_user=admin, task_id=task_id)
    return {"message": "Task deleted successfully", "id": task_id}
