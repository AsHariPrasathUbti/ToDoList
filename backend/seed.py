import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.user import User, UserRole
from app.models.task import Task, TaskAssignment
from app.core.security import get_password_hash
import app.models  # ensure models are registered

# Exact required user roster
TARGET_ROSTER = [
    {
        "username": "admin",
        "name": "Admin",
        "email": "admin@taskflow.com",
        "role": UserRole.ADMIN.value,
        "password": "Admin@12345",
    },
    {
        "username": "hari",
        "name": "Hari",
        "email": "hari@taskflow.com",
        "role": UserRole.USER.value,
        "password": "Hari@12345",
    },
    {
        "username": "sneka",
        "name": "Sneka",
        "email": "sneka@taskflow.com",
        "role": UserRole.USER.value,
        "password": "Sneka@12345",
    },
    {
        "username": "adnan",
        "name": "Adnan",
        "email": "adnan@taskflow.com",
        "role": UserRole.USER.value,
        "password": "Adnan@12345",
    },
    {
        "username": "shri",
        "name": "Shri",
        "email": "shri@taskflow.com",
        "role": UserRole.USER.value,
        "password": "Shri@12345",
    },
    {
        "username": "anu",
        "name": "Anu",
        "email": "anu@taskflow.com",
        "role": UserRole.USER.value,
        "password": "Anu@12345",
    },
    {
        "username": "mannisha",
        "name": "Mannisha",
        "email": "mannisha@taskflow.com",
        "role": UserRole.USER.value,
        "password": "Mannisha@12345",
    },
]

def migrate_existing_tables():
    """Safely add new columns to existing SQLite tables if upgrading."""
    with engine.connect() as conn:
        res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
        col_names = [r[1] for r in res]

        if "username" not in col_names:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(50)"))
                conn.commit()
                print("✓ Migrated users table: added 'username' column")
            except Exception as e:
                print(f"Notice on username column: {e}")

        if "role" not in col_names:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'User'"))
                conn.commit()
                print("✓ Migrated users table: added 'role' column")
            except Exception as e:
                print(f"Notice on role column: {e}")

        if "is_active" not in col_names:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                conn.commit()
                print("✓ Migrated users table: added 'is_active' column")
            except Exception as e:
                print(f"Notice on is_active column: {e}")

        task_res = conn.execute(text("PRAGMA table_info(tasks)")).fetchall()
        task_cols = [r[1] for r in task_res]
        if "created_by" not in task_cols:
            try:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN created_by INTEGER"))
                conn.commit()
                print("✓ Migrated tasks table: added 'created_by' column")
            except Exception as e:
                print(f"Notice on created_by column: {e}")

def seed_database():
    """Idempotently seed the exact requested team user roster and delete remaining users."""
    print("Ensuring database schema...")
    migrate_existing_tables()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        allowed_usernames = {item["username"].lower() for item in TARGET_ROSTER}

        # 1. Upsert all users in TARGET_ROSTER
        synced_users = {}
        for item in TARGET_ROSTER:
            uname = item["username"].lower()
            user = db.query(User).filter(User.username == uname).first()
            if not user:
                # Also check by email
                user = db.query(User).filter(User.email == item["email"].lower()).first()

            if user:
                user.username = uname
                user.name = item["name"]
                user.email = item["email"].lower()
                user.role = item["role"]
                user.is_active = True
                user.hashed_password = get_password_hash(item["password"])
                db.add(user)
                synced_users[uname] = user
                print(f"[OK] Synchronized user: '{uname}' ({item['name']} - {item['role']})")
            else:
                user = User(
                    username=uname,
                    name=item["name"],
                    email=item["email"].lower(),
                    hashed_password=get_password_hash(item["password"]),
                    role=item["role"],
                    is_active=True,
                )
                db.add(user)
                db.flush()
                synced_users[uname] = user
                print(f"[OK] Created new user: '{uname}' ({item['name']} - {item['role']})")

        db.commit()

        # Admin user object for re-associating any orphaned tasks
        admin_user = synced_users["admin"]

        # 2. Find and delete remaining users not in target roster
        all_users = db.query(User).all()
        deleted_count = 0
        for u in all_users:
            if u.username and u.username.lower() in allowed_usernames:
                continue

            print(f"[CLEANUP] Removing unauthorized/legacy user: id={u.id}, username='{u.username}', email='{u.email}'")

            # Remove any task assignments for this user
            db.query(TaskAssignment).filter(TaskAssignment.user_id == u.id).delete()

            # Reassign any tasks created by or belonging to this user to the Admin
            tasks_to_reassign = db.query(Task).filter((Task.created_by == u.id) | (Task.user_id == u.id)).all()
            for t in tasks_to_reassign:
                if t.created_by == u.id:
                    t.created_by = admin_user.id
                if t.user_id == u.id:
                    t.user_id = admin_user.id
                db.add(t)

            db.delete(u)
            deleted_count += 1

        db.commit()
        print(f"Deleted {deleted_count} legacy user(s).")

        # 3. Print final roster
        final_users = db.query(User).order_by(User.id).all()
        print("\n--- Current Database User Roster ---")
        for u in final_users:
            print(f"  • {u.name} (Username: {u.username}, Role: {u.role}, Email: {u.email}, Active: {u.is_active})")
        print("------------------------------------\n")

    except Exception as e:
        db.rollback()
        print(f"Error during database seeding: {e}", file=sys.stderr)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
