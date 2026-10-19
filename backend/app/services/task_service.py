from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, desc, asc
from datetime import datetime, timezone, time
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from app.models.task import Task, TaskAssignment, TaskStatus, TaskPriority
from app.models.user import User, UserRole
from app.schemas.task import TaskCreate, TaskUpdate, TaskAssignmentStatusUpdate

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class TaskService:
    @staticmethod
    def create_task(db: Session, admin_user: User, task_in: TaskCreate) -> Task:
        """Create a new task and assign it to one or multiple users (Admin only)."""
        db_task = Task(
            title=task_in.title.strip(),
            description=task_in.description.strip() if task_in.description else None,
            status=TaskStatus.PENDING.value,
            priority=task_in.priority.value,
            due_date=task_in.due_date,
            created_by=admin_user.id,
            user_id=admin_user.id,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        db.add(db_task)
        db.flush()  # Populate db_task.id

        # Create assignments for requested users
        if task_in.assigned_user_ids:
            # Deduplicate IDs
            unique_user_ids = list(set(task_in.assigned_user_ids))
            # Verify users exist
            valid_users = db.query(User).filter(User.id.in_(unique_user_ids)).all()
            for u in valid_users:
                assignment = TaskAssignment(
                    task_id=db_task.id,
                    user_id=u.id,
                    assigned_by=admin_user.id,
                    assigned_at=utc_now(),
                    status=TaskStatus.PENDING.value,
                )
                db.add(assignment)

        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def get_task_by_id(db: Session, user: User, task_id: int) -> Task:
        """Get task details. Admin can view any task; User can only view if assigned."""
        task = (
            db.query(Task)
            .options(joinedload(Task.assignments).joinedload(TaskAssignment.user))
            .filter(Task.id == task_id)
            .first()
        )
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found"
            )

        if user.role != UserRole.ADMIN.value:
            # Check if user is assigned
            user_assignment = next((a for a in task.assignments if a.user_id == user.id), None)
            if not user_assignment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Task with ID {task_id} not found or access denied"
                )
            # Inject my_status and user_assignment for regular user view
            task.my_status = user_assignment.status
            task.user_assignment = user_assignment
        return task

    @staticmethod
    def list_tasks(
        db: Session,
        user: User,
        search: Optional[str] = None,
        task_status: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_user_id: Optional[int] = None,
        due_date: Optional[str] = None,
        overdue: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 10,
    ) -> Tuple[List[Task], int]:
        """List tasks with role-based filtering, search, status, and pagination."""
        query = db.query(Task).options(joinedload(Task.assignments).joinedload(TaskAssignment.user))
        now = utc_now()

        # Role-based restriction
        if user.role != UserRole.ADMIN.value:
            # Regular user: strictly filter to tasks assigned to this user
            query = query.join(TaskAssignment, Task.id == TaskAssignment.task_id).filter(
                TaskAssignment.user_id == user.id
            )
        else:
            # Admin can filter by assigned_user_id
            if assigned_user_id:
                query = query.join(TaskAssignment, Task.id == TaskAssignment.task_id).filter(
                    TaskAssignment.user_id == assigned_user_id
                )

        # Search across title and description
        if search:
            search_pat = f"%{search.strip()}%"
            query = query.filter(or_(Task.title.ilike(search_pat), Task.description.ilike(search_pat)))

        # Priority filter
        if priority:
            priorities = [p.strip() for p in priority.split(",") if p.strip()]
            if priorities:
                query = query.filter(Task.priority.in_(priorities))

        # Status filter
        if task_status:
            statuses = [s.strip() for s in task_status.split(",") if s.strip()]
            if statuses:
                if user.role != UserRole.ADMIN.value:
                    # Regular user filters by their assignment status
                    query = query.filter(TaskAssignment.status.in_(statuses))
                else:
                    query = query.filter(Task.status.in_(statuses))

        # Overdue filter
        if overdue is True:
            query = query.filter(and_(Task.due_date < now, Task.status != TaskStatus.COMPLETED.value))

        # Due date filter
        if due_date:
            today_start = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)
            today_end = datetime.combine(now.date(), time.max).replace(tzinfo=timezone.utc)
            if due_date.lower() == "today":
                query = query.filter(and_(Task.due_date >= today_start, Task.due_date <= today_end))
            elif due_date.lower() == "upcoming":
                query = query.filter(Task.due_date > today_end)
            elif due_date.lower() == "overdue":
                query = query.filter(and_(Task.due_date < now, Task.status != TaskStatus.COMPLETED.value))

        total = query.distinct().count()

        # Sorting logic
        sort_map = {
            "created_at": Task.created_at,
            "updated_at": Task.updated_at,
            "due_date": Task.due_date,
            "title": Task.title,
            "priority": Task.priority,
            "status": Task.status,
        }
        col = sort_map.get(sort_by, Task.created_at)

        if sort_order.lower() == "asc":
            order_clause = Task.due_date.asc().nullslast() if sort_by == "due_date" else asc(col)
        else:
            order_clause = Task.due_date.desc().nullslast() if sort_by == "due_date" else desc(col)

        query = query.order_by(order_clause)
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        # For regular users, attach their assignment status to my_status
        for t in items:
            user_assignment = next((a for a in t.assignments if a.user_id == user.id), None)
            if user_assignment:
                t.my_status = user_assignment.status
                t.user_assignment = user_assignment

        return items, total

    @staticmethod
    def update_task(db: Session, admin_user: User, task_id: int, task_in: TaskUpdate) -> Task:
        """Update task details and/or assignment list (Admin only)."""
        task = TaskService.get_task_by_id(db, admin_user, task_id)
        update_data = task_in.model_dump(exclude_unset=True)

        if "title" in update_data and update_data["title"] is not None:
            task.title = update_data["title"].strip()
        if "description" in update_data:
            desc_val = update_data["description"]
            task.description = desc_val.strip() if desc_val else None
        if "priority" in update_data and update_data["priority"] is not None:
            task.priority = update_data["priority"].value if hasattr(update_data["priority"], "value") else str(update_data["priority"])
        if "due_date" in update_data:
            task.due_date = update_data["due_date"]
        if "status" in update_data and update_data["status"] is not None:
            task.status = update_data["status"].value if hasattr(update_data["status"], "value") else str(update_data["status"])
            if task.status == TaskStatus.COMPLETED.value:
                task.completed_at = utc_now()
            else:
                task.completed_at = None

        # Reassign users if specified
        if "assigned_user_ids" in update_data and update_data["assigned_user_ids"] is not None:
            TaskService.reassign_task(db, admin_user, task_id, update_data["assigned_user_ids"])

        task.updated_at = utc_now()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def reassign_task(db: Session, admin_user: User, task_id: int, new_user_ids: List[int]) -> Task:
        """Reassign task users safely, preserving existing assignment progress for kept users."""
        task = TaskService.get_task_by_id(db, admin_user, task_id)
        unique_new_ids = set(new_user_ids)

        current_assignments = {a.user_id: a for a in task.assignments}

        # Remove assignments for users no longer in list
        for user_id, assignment in list(current_assignments.items()):
            if user_id not in unique_new_ids:
                db.delete(assignment)

        # Add new assignments for users who are new
        for user_id in unique_new_ids:
            if user_id not in current_assignments:
                user_exists = db.query(User).filter(User.id == user_id).first()
                if user_exists:
                    new_assignment = TaskAssignment(
                        task_id=task.id,
                        user_id=user_id,
                        assigned_by=admin_user.id,
                        assigned_at=utc_now(),
                        status=TaskStatus.PENDING.value,
                    )
                    db.add(new_assignment)

        task.updated_at = utc_now()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def update_assignment_status(
        db: Session,
        current_user: User,
        task_id: int,
        target_user_id: int,
        status_in: TaskAssignmentStatusUpdate
    ) -> Task:
        """Update an assigned user's status. Regular users can only update their own assignment."""
        if current_user.role != UserRole.ADMIN.value and current_user.id != target_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are only permitted to update your own task assignment status",
            )

        assignment = (
            db.query(TaskAssignment)
            .filter(TaskAssignment.task_id == task_id, TaskAssignment.user_id == target_user_id)
            .first()
        )
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No assignment found for user ID {target_user_id} on task {task_id}",
            )

        new_status = status_in.status.value
        assignment.status = new_status
        if new_status == TaskStatus.COMPLETED.value:
            assignment.completed_at = utc_now()
        else:
            assignment.completed_at = None

        # Re-evaluate overall task status across all assignments
        all_assignments = db.query(TaskAssignment).filter(TaskAssignment.task_id == task_id).all()
        task = db.query(Task).filter(Task.id == task_id).first()
        if task and all_assignments:
            all_completed = all(a.status == TaskStatus.COMPLETED.value for a in all_assignments)
            any_in_progress = any(a.status in (TaskStatus.IN_PROGRESS.value, TaskStatus.COMPLETED.value) for a in all_assignments)

            if all_completed:
                task.status = TaskStatus.COMPLETED.value
                task.completed_at = utc_now()
            elif any_in_progress:
                task.status = TaskStatus.IN_PROGRESS.value
                task.completed_at = None
            else:
                task.status = TaskStatus.PENDING.value
                task.completed_at = None
            task.updated_at = utc_now()

        db.commit()
        return TaskService.get_task_by_id(db, current_user, task_id)

    @staticmethod
    def delete_task(db: Session, admin_user: User, task_id: int) -> None:
        """Delete task and associated assignments (Admin only)."""
        task = TaskService.get_task_by_id(db, admin_user, task_id)
        db.delete(task)
        db.commit()

    @staticmethod
    def get_admin_dashboard_stats(db: Session, admin_user: User):
        """Calculate organization-wide team metrics across all users."""
        now = utc_now()
        total_tasks = db.query(func.count(Task.id)).scalar() or 0
        total_users = db.query(func.count(User.id)).filter(User.role == UserRole.USER.value).scalar() or 0

        pending_assignments = (
            db.query(func.count(TaskAssignment.id))
            .filter(TaskAssignment.status == TaskStatus.PENDING.value)
            .scalar()
            or 0
        )
        in_progress_assignments = (
            db.query(func.count(TaskAssignment.id))
            .filter(TaskAssignment.status == TaskStatus.IN_PROGRESS.value)
            .scalar()
            or 0
        )
        completed_assignments = (
            db.query(func.count(TaskAssignment.id))
            .filter(TaskAssignment.status == TaskStatus.COMPLETED.value)
            .scalar()
            or 0
        )

        total_assignments = pending_assignments + in_progress_assignments + completed_assignments

        # Overdue assignments (task due date < now and assignment not completed)
        overdue_assignments = (
            db.query(func.count(TaskAssignment.id))
            .join(Task, TaskAssignment.task_id == Task.id)
            .filter(Task.due_date < now, TaskAssignment.status != TaskStatus.COMPLETED.value)
            .scalar()
            or 0
        )

        overall_completion = (
            round((completed_assignments / total_assignments * 100), 1) if total_assignments > 0 else 0.0
        )

        recent_tasks = (
            db.query(Task)
            .options(joinedload(Task.assignments).joinedload(TaskAssignment.user))
            .order_by(desc(Task.created_at))
            .limit(6)
            .all()
        )

        return {
            "total_tasks": total_tasks,
            "total_users": total_users,
            "pending_assignments": pending_assignments,
            "in_progress_assignments": in_progress_assignments,
            "completed_assignments": completed_assignments,
            "overdue_assignments": overdue_assignments,
            "overall_completion_percentage": overall_completion,
            "recent_tasks": recent_tasks,
        }

    @staticmethod
    def get_user_dashboard_stats(db: Session, regular_user: User):
        """Calculate metrics strictly for the authenticated regular user's assignments."""
        now = utc_now()
        today_start = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)
        today_end = datetime.combine(now.date(), time.max).replace(tzinfo=timezone.utc)

        user_assignments_query = db.query(TaskAssignment).filter(TaskAssignment.user_id == regular_user.id)
        total_assigned = user_assignments_query.count()

        pending_tasks = (
            db.query(func.count(TaskAssignment.id))
            .filter(TaskAssignment.user_id == regular_user.id, TaskAssignment.status == TaskStatus.PENDING.value)
            .scalar()
            or 0
        )
        in_progress_tasks = (
            db.query(func.count(TaskAssignment.id))
            .filter(TaskAssignment.user_id == regular_user.id, TaskAssignment.status == TaskStatus.IN_PROGRESS.value)
            .scalar()
            or 0
        )
        completed_tasks = (
            db.query(func.count(TaskAssignment.id))
            .filter(TaskAssignment.user_id == regular_user.id, TaskAssignment.status == TaskStatus.COMPLETED.value)
            .scalar()
            or 0
        )

        overdue_tasks = (
            db.query(func.count(TaskAssignment.id))
            .join(Task, TaskAssignment.task_id == Task.id)
            .filter(
                TaskAssignment.user_id == regular_user.id,
                Task.due_date < now,
                TaskAssignment.status != TaskStatus.COMPLETED.value,
            )
            .scalar()
            or 0
        )

        due_today_tasks = (
            db.query(func.count(TaskAssignment.id))
            .join(Task, TaskAssignment.task_id == Task.id)
            .filter(
                TaskAssignment.user_id == regular_user.id,
                Task.due_date >= today_start,
                Task.due_date <= today_end,
            )
            .scalar()
            or 0
        )

        personal_completion = (
            round((completed_tasks / total_assigned * 100), 1) if total_assigned > 0 else 0.0
        )

        recent_tasks = (
            db.query(Task)
            .join(TaskAssignment, Task.id == TaskAssignment.task_id)
            .options(joinedload(Task.assignments).joinedload(TaskAssignment.user))
            .filter(TaskAssignment.user_id == regular_user.id)
            .order_by(desc(Task.created_at))
            .limit(6)
            .all()
        )

        for t in recent_tasks:
            ua = next((a for a in t.assignments if a.user_id == regular_user.id), None)
            if ua:
                t.my_status = ua.status
                t.user_assignment = ua

        return {
            "total_assigned_tasks": total_assigned,
            "pending_tasks": pending_tasks,
            "in_progress_tasks": in_progress_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
            "due_today_tasks": due_today_tasks,
            "personal_completion_percentage": personal_completion,
            "recent_tasks": recent_tasks,
        }

    @staticmethod
    def get_user_summary(db: Session, admin_user: User, user_id: int):
        """Admin view of an individual user's task summary."""
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")

        stats = TaskService.get_user_dashboard_stats(db, target_user)
        return {
            "user": target_user,
            "total_assigned": stats["total_assigned_tasks"],
            "completed": stats["completed_tasks"],
            "in_progress": stats["in_progress_tasks"],
            "pending": stats["pending_tasks"],
            "overdue": stats["overdue_tasks"],
            "completion_percentage": stats["personal_completion_percentage"],
            "tasks": stats["recent_tasks"],
        }
