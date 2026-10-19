from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.models.task import TaskStatus, TaskPriority
from app.schemas.user import UserBrief

class TaskAssignmentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    user: Optional[UserBrief] = None
    status: TaskStatus
    assigned_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    due_date: Optional[datetime] = None
    assigned_user_ids: List[int] = Field(default_factory=list, description="List of user IDs to assign this task to")

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    assigned_user_ids: Optional[List[int]] = None

class TaskAssignmentsUpdate(BaseModel):
    assigned_user_ids: List[int] = Field(..., description="Complete new list of assigned user IDs")

class TaskAssignmentStatusUpdate(BaseModel):
    status: TaskStatus

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    assignments: List[TaskAssignmentResponse] = []
    # For regular users: their specific assignment status and record
    user_assignment: Optional[TaskAssignmentResponse] = None
    my_status: Optional[TaskStatus] = None

    model_config = ConfigDict(from_attributes=True)

class PaginationMetadata(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    pagination: PaginationMetadata
