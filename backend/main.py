import os
import json
import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import auth
from timetable_engine import generate_smart_timetable

# Initialize SQLite database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Student Study Planner API",
    description="High-performance backend powered by FastAPI & SQLite for intelligent student study planning, scheduling, and task management.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local development and network access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "🎓 Student Study Planner FastAPI Backend is active!",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        user_count = db.query(models.User).count()
        return {
            "status": "online",
            "database": "connected (SQLite)",
            "registered_users": user_count,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {"status": "degraded", "error": str(e)}

# ==========================================
# AUTHENTICATION & USER MANAGEMENT
# ==========================================

@app.post("/api/auth/register", response_model=schemas.TokenResponse)
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    username = user_in.username.strip().lower()
    
    existing = db.query(models.User).filter(models.User.username == username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '@{username}' is already registered. Please choose another or sign in."
        )

    # Hash password & create user
    hashed = auth.hash_password(user_in.password)
    user = models.User(
        username=username,
        password_hash=hashed,
        name=user_in.name.strip(),
        age=user_in.age or "",
        studying=user_in.studying or "higher_studies",
        college_year=user_in.collegeYear or "2nd_year",
        course_name=user_in.courseName or "",
        avatar=user_in.avatar or "🎓",
        daily_target_hours=user_in.dailyTargetHours or 4
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Default availability if not provided
    default_avail = {
        "Mon": [17, 18, 19, 20],
        "Tue": [17, 18, 19, 20],
        "Wed": [17, 18, 19, 20],
        "Thu": [17, 18, 19, 20],
        "Fri": [17, 18, 19, 20],
        "Sat": [10, 11, 12, 13, 14, 15],
        "Sun": [10, 11, 12, 13, 14, 15],
    }

    # Initial planner data setup
    init_planner = user_in.plannerData or {}
    tasks = init_planner.get("tasks", [])
    topics = user_in.topics or init_planner.get("topics", [])
    availability = user_in.availability or init_planner.get("availability", default_avail)
    
    # Generate initial timetable if topics exist
    initial_timetable = init_planner.get("timetable", [])
    if not initial_timetable and topics:
        today_iso = datetime.date.today().isoformat()
        initial_timetable = generate_smart_timetable(tasks, topics, availability, today_iso)

    default_todos = [
        {"id": "td-1", "text": "Review lecture slides and summary notes for next class", "completed": False, "priority": "High", "tag": "Revision", "createdAt": datetime.datetime.utcnow().isoformat()},
        {"id": "td-2", "text": "Organize assignment references and draft outline", "completed": False, "priority": "Medium", "tag": "Assignment", "createdAt": datetime.datetime.utcnow().isoformat()},
        {"id": "td-3", "text": "Set up 25-minute Pomodoro study sprint for today", "completed": True, "priority": "Low", "tag": "Quick Task", "createdAt": datetime.datetime.utcnow().isoformat()}
    ]

    default_notes = [
        {
            "id": "nt-1",
            "title": "⚡ Quick Study Rule",
            "content": "Pomodoro Focus: 25 mins deep study + 5 mins break. Active recall beats re-reading.",
            "color": "yellow",
            "tag": "Study Tip",
            "isPinned": True,
            "createdAt": datetime.datetime.utcnow().isoformat(),
            "updatedAt": datetime.datetime.utcnow().isoformat()
        },
        {
            "id": "nt-2",
            "title": "📌 Portal & Datesheet Check",
            "content": "Check college LMS portal every Monday for updated syllabus and submission links.",
            "color": "purple",
            "tag": "Reminder",
            "isPinned": False,
            "createdAt": datetime.datetime.utcnow().isoformat(),
            "updatedAt": datetime.datetime.utcnow().isoformat()
        }
    ]

    planner = models.PlannerData(
        user_id=user.id,
        tasks_json=json.dumps(tasks),
        topics_json=json.dumps(topics),
        availability_json=json.dumps(availability),
        timetable_json=json.dumps(initial_timetable),
        college_schedule_json=json.dumps(init_planner.get("collegeSchedule", [])),
        exam_schedule_json=json.dumps(init_planner.get("examSchedule", [])),
        events_json=json.dumps(init_planner.get("events", [])),
        dashboard_todos_json=json.dumps(init_planner.get("dashboardTodos", default_todos)),
        dashboard_notes_json=json.dumps(init_planner.get("dashboardNotes", default_notes)),
        dashboard_scratchpad=init_planner.get("dashboardScratchpad", ""),
        timetable_photo_json=json.dumps(init_planner.get("timetablePhoto", None)),
        last_generated=init_planner.get("lastGenerated", datetime.datetime.utcnow().isoformat())
    )
    db.add(planner)
    db.commit()
    db.refresh(planner)

    token = auth.create_access_token(data={"sub": user.username})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_profile_dict(),
        "plannerData": planner.to_dict()
    }

@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    username = login_in.username.strip().lower()
    user = db.query(models.User).filter(models.User.username == username).first()

    if not user or not auth.verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Please try again."
        )

    token = auth.create_access_token(data={"sub": user.username})
    planner_dict = user.planner_data.to_dict() if user.planner_data else {}

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_profile_dict(),
        "plannerData": planner_dict
    }

@app.post("/api/auth/reset-password", response_model=schemas.TokenResponse)
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    username = req.username.strip().lower()
    user = db.query(models.User).filter(models.User.username == username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No account found with username '@{username}'."
        )

    # Hash new password
    user.password_hash = auth.hash_password(req.new_password)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(data={"sub": user.username})
    planner_dict = user.planner_data.to_dict() if user.planner_data else {}

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_profile_dict(),
        "plannerData": planner_dict
    }

@app.get("/api/auth/me")
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    planner_dict = current_user.planner_data.to_dict() if current_user.planner_data else {}
    return {
        "user": current_user.to_profile_dict(),
        "plannerData": planner_dict
    }

@app.get("/api/auth/users")
def get_all_registered_users(db: Session = Depends(get_db)):
    """Returns a directory of saved accounts for quick switcher UI."""
    users = db.query(models.User).all()
    user_map = {}
    for u in users:
        pdict = u.to_profile_dict()
        user_map[u.username] = {
            "username": u.username,
            "profile": pdict,
            "plannerData": u.planner_data.to_dict() if u.planner_data else {}
        }
    return user_map

@app.put("/api/user/profile")
def update_profile(
    profile_in: schemas.UserProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.name is not None:
        current_user.name = profile_in.name.strip()
    if profile_in.age is not None:
        current_user.age = profile_in.age
    if profile_in.studying is not None:
        current_user.studying = profile_in.studying
    if profile_in.collegeYear is not None:
        current_user.college_year = profile_in.collegeYear
    if profile_in.courseName is not None:
        current_user.course_name = profile_in.courseName
    if profile_in.avatar is not None:
        current_user.avatar = profile_in.avatar
    if profile_in.dailyTargetHours is not None:
        current_user.daily_target_hours = profile_in.dailyTargetHours

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "profile": current_user.to_profile_dict()
    }

@app.delete("/api/user/account")
def delete_my_account(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return {"message": f"Account @{current_user.username} permanently deleted."}

@app.delete("/api/user/account/{username}")
def delete_account_by_username(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"Account @{username} deleted successfully"}

# ==========================================
# PLANNER DATA ENDPOINTS
# ==========================================

@app.get("/api/planner")
def get_planner_data(current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.planner_data:
        return {}
    return current_user.planner_data.to_dict()

@app.put("/api/planner")
def update_planner_data(
    data: schemas.PlannerDataUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    planner = current_user.planner_data
    if not planner:
        planner = models.PlannerData(user_id=current_user.id)
        db.add(planner)
        db.commit()
        db.refresh(planner)

    planner.update_from_dict(data.dict(exclude_unset=True))
    db.commit()
    db.refresh(planner)

    return {
        "message": "Planner data synchronized successfully",
        "plannerData": planner.to_dict()
    }

# ==========================================
# AI TIMETABLE GENERATION
# ==========================================

@app.post("/api/ai/generate-timetable")
def generate_timetable_api(payload: schemas.GenerateTimetableRequest):
    timetable = generate_smart_timetable(
        tasks=payload.tasks,
        topics=payload.topics,
        availability=payload.availability,
        week_start_str=payload.weekStart,
        college_schedule=payload.collegeSchedule,
        exam_schedule=payload.examSchedule
    )
    return {
        "success": True,
        "count": len(timetable),
        "timetable": timetable,
        "generatedAt": datetime.datetime.utcnow().isoformat()
    }

# ==========================================
# SYNC / IMPORT FROM LOCALSTORAGE
# ==========================================

@app.post("/api/auth/sync-legacy-accounts")
def sync_legacy_accounts(payload: dict, db: Session = Depends(get_db)):
    """Allows client to seamlessly upload legacy localStorage accounts into SQLite."""
    migrated_count = 0
    for uname, acc in payload.items():
        uname_clean = uname.strip().lower()
        if not db.query(models.User).filter(models.User.username == uname_clean).first():
            profile = acc.get("profile", {})
            pwd = acc.get("password") or "123456"
            hashed = auth.hash_password(pwd)

            user = models.User(
                username=uname_clean,
                password_hash=hashed,
                name=profile.get("name") or uname_clean.capitalize(),
                age=str(profile.get("age") or ""),
                studying=profile.get("studying") or "higher_studies",
                college_year=profile.get("collegeYear") or "2nd_year",
                course_name=profile.get("courseName") or "",
                avatar=profile.get("avatar") or "🎓",
                daily_target_hours=profile.get("dailyTargetHours") or 4
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            planner_dict = acc.get("plannerData", {})
            planner = models.PlannerData(
                user_id=user.id,
                tasks_json=json.dumps(planner_dict.get("tasks", [])),
                topics_json=json.dumps(planner_dict.get("topics", [])),
                availability_json=json.dumps(planner_dict.get("availability", {})),
                timetable_json=json.dumps(planner_dict.get("timetable", [])),
                college_schedule_json=json.dumps(planner_dict.get("collegeSchedule", [])),
                exam_schedule_json=json.dumps(planner_dict.get("examSchedule", [])),
                events_json=json.dumps(planner_dict.get("events", [])),
                dashboard_todos_json=json.dumps(planner_dict.get("dashboardTodos", [])),
                dashboard_notes_json=json.dumps(planner_dict.get("dashboardNotes", [])),
                dashboard_scratchpad=planner_dict.get("dashboardScratchpad", ""),
                timetable_photo_json=json.dumps(planner_dict.get("timetablePhoto", None)),
                last_generated=planner_dict.get("lastGenerated", datetime.datetime.utcnow().isoformat())
            )
            db.add(planner)
            db.commit()
            migrated_count += 1

    return {"status": "success", "migrated_accounts": migrated_count}
