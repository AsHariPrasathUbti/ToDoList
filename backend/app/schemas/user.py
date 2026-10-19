from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional
from app.models.user import UserRole

class UserBase(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: UserRole = Field(default=UserRole.USER)
    is_active: bool = True

class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: Optional[UserRole] = UserRole.USER

class UserLogin(BaseModel):
    username: str = Field(..., description="Username or email for authentication")
    password: str = Field(..., description="Plain-text password")

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)

class UserActiveToggle(BaseModel):
    is_active: bool

class UserBrief(BaseModel):
    id: int
    username: str
    name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserWithStats(UserResponse):
    total_assigned: int = 0
    completed_assigned: int = 0
    pending_assigned: int = 0
    in_progress_assigned: int = 0

    model_config = ConfigDict(from_attributes=True)
