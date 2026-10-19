from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import AdminDashboardStats, UserDashboardStats, UserSummaryStats
from app.services.task_service import TaskService
from app.dependencies.auth import get_current_user, require_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/admin-stats", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Retrieve organization-wide team metrics and recent tasks across all users (Admin only)."""
    return TaskService.get_admin_dashboard_stats(db=db, admin_user=admin)

@router.get("/user-stats", response_model=UserDashboardStats)
def get_user_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve personal task metrics for the authenticated user."""
    return TaskService.get_user_dashboard_stats(db=db, regular_user=current_user)

@router.get("/user-summary/{user_id}", response_model=UserSummaryStats)
def get_user_summary(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """View task statistics for a specific user (Admin only)."""
    return TaskService.get_user_summary(db=db, admin_user=admin, user_id=user_id)
