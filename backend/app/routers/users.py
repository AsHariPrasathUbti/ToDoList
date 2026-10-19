from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.task import TaskAssignment, TaskStatus
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserWithStats, UserActiveToggle
from app.dependencies.auth import require_admin
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["User Management (Admin Only)"])

@router.get("/", response_model=List[UserWithStats])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List all registered users with their task assignment statistics (Admin only)."""
    users = db.query(User).order_by(User.role.asc(), User.name.asc()).all()
    results = []

    for u in users:
        total = db.query(func.count(TaskAssignment.id)).filter(TaskAssignment.user_id == u.id).scalar() or 0
        completed = (
            db.query(func.count(TaskAssignment.id))
            .filter(TaskAssignment.user_id == u.id, TaskAssignment.status == TaskStatus.COMPLETED.value)
            .scalar()
            or 0
        )
        in_progress = (
            db.query(func.count(TaskAssignment.id))
            .filter(TaskAssignment.user_id == u.id, TaskAssignment.status == TaskStatus.IN_PROGRESS.value)
            .scalar()
            or 0
        )
        pending = (
            db.query(func.count(TaskAssignment.id))
            .filter(TaskAssignment.user_id == u.id, TaskAssignment.status == TaskStatus.PENDING.value)
            .scalar()
            or 0
        )

        user_stat = UserWithStats(
            id=u.id,
            username=u.username or (u.email.split('@')[0].lower() if u.email else f"user_{u.id}"),
            name=u.name,
            email=u.email,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            updated_at=u.updated_at,
            total_assigned=total,
            completed_assigned=completed,
            pending_assigned=pending,
            in_progress_assigned=in_progress,
        )
        results.append(user_stat)

    return results

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new user account (Admin only). Default role is User unless explicitly assigned."""
    username_clean = user_in.username.strip().lower()
    email_clean = user_in.email.strip().lower()

    if db.query(User).filter(User.username == username_clean).first():
        raise HTTPException(status_code=409, detail=f"Username '{username_clean}' is already taken")
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(status_code=409, detail=f"Email '{email_clean}' is already registered")

    new_user = User(
        username=username_clean,
        name=user_in.name.strip(),
        email=email_clean,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role.value if user_in.role else UserRole.USER.value,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """View user details (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update user profile or password (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"]:
        user.name = update_data["name"].strip()
    if "email" in update_data and update_data["email"]:
        email_clean = update_data["email"].strip().lower()
        conflict = db.query(User).filter(User.email == email_clean, User.id != user_id).first()
        if conflict:
            raise HTTPException(status_code=409, detail="Email is already in use by another user")
        user.email = email_clean
    if "role" in update_data and update_data["role"]:
        user.role = update_data["role"].value if hasattr(update_data["role"], "value") else str(update_data["role"])
    if "is_active" in update_data and update_data["is_active"] is not None:
        user.is_active = update_data["is_active"]
    if "password" in update_data and update_data["password"]:
        user.hashed_password = get_password_hash(update_data["password"])

    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/active", response_model=UserResponse)
def toggle_user_active(
    user_id: int,
    payload: UserActiveToggle,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Activate or deactivate a user account (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate their own account")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user
