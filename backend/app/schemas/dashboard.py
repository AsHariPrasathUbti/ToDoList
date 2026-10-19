from pydantic import BaseModel
from typing import List
from app.schemas.task import TaskResponse
from app.schemas.user import UserBrief

class AdminDashboardStats(BaseModel):
    total_tasks: int
    total_users: int
    pending_assignments: int
    in_progress_assignments: int
    completed_assignments: int
    overdue_assignments: int
    overall_completion_percentage: float
    recent_tasks: List[TaskResponse]

class UserDashboardStats(BaseModel):
    total_assigned_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int
    due_today_tasks: int
    personal_completion_percentage: float
    recent_tasks: List[TaskResponse]

class UserSummaryStats(BaseModel):
    user: UserBrief
    total_assigned: int
    completed: int
    in_progress: int
    pending: int
    overdue: int
    completion_percentage: float
    tasks: List[TaskResponse]
