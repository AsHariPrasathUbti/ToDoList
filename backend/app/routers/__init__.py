from app.routers.auth import router as auth_router
from app.routers.tasks import router as tasks_router
from app.routers.dashboard import router as dashboard_router
from app.routers.users import router as users_router
from app.routers.admin_database import router as admin_database_router

__all__ = ["auth_router", "tasks_router", "dashboard_router", "users_router", "admin_database_router"]
