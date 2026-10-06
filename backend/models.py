import datetime
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(String(20), nullable=True)
    studying = Column(String(100), nullable=True)
    college_year = Column(String(100), nullable=True)
    course_name = Column(String(200), nullable=True)
    avatar = Column(String(10), default="🎓")
    daily_target_hours = Column(Integer, default=4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    planner_data = relationship("PlannerData", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def to_profile_dict(self):
        return {
            "username": self.username,
            "name": self.name,
            "age": self.age or "",
            "studying": self.studying or "higher_studies",
            "collegeYear": self.college_year or "2nd_year",
            "courseName": self.course_name or "",
            "avatar": self.avatar or "🎓",
            "dailyTargetHours": self.daily_target_hours or 4,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }

class PlannerData(Base):
    __tablename__ = "planner_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    tasks_json = Column(Text, default="[]")
    topics_json = Column(Text, default="[]")
    availability_json = Column(Text, default="{}")
    timetable_json = Column(Text, default="[]")
    college_schedule_json = Column(Text, default="[]")
    exam_schedule_json = Column(Text, default="[]")
    events_json = Column(Text, default="[]")
    dashboard_todos_json = Column(Text, default="[]")
    dashboard_notes_json = Column(Text, default="[]")
    dashboard_scratchpad = Column(Text, default="")
    timetable_photo_json = Column(Text, default="null")
    last_generated = Column(String(50), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="planner_data")

    def to_dict(self):
        def parse_safe(val, fallback):
            if not val:
                return fallback
            try:
                return json.loads(val)
            except Exception:
                return fallback

        return {
            "tasks": parse_safe(self.tasks_json, []),
            "topics": parse_safe(self.topics_json, []),
            "availability": parse_safe(self.availability_json, {
                "Mon": [17, 18, 19, 20],
                "Tue": [17, 18, 19, 20],
                "Wed": [17, 18, 19, 20],
                "Thu": [17, 18, 19, 20],
                "Fri": [17, 18, 19, 20],
                "Sat": [10, 11, 12, 13, 14, 15],
                "Sun": [10, 11, 12, 13, 14, 15],
            }),
            "timetable": parse_safe(self.timetable_json, []),
            "collegeSchedule": parse_safe(self.college_schedule_json, []),
            "examSchedule": parse_safe(self.exam_schedule_json, []),
            "events": parse_safe(self.events_json, []),
            "dashboardTodos": parse_safe(self.dashboard_todos_json, []),
            "dashboardNotes": parse_safe(self.dashboard_notes_json, []),
            "dashboardScratchpad": self.dashboard_scratchpad or "",
            "timetablePhoto": parse_safe(self.timetable_photo_json, None),
            "lastGenerated": self.last_generated,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }

    def update_from_dict(self, data: dict):
        if "tasks" in data:
            self.tasks_json = json.dumps(data["tasks"])
        if "topics" in data:
            self.topics_json = json.dumps(data["topics"])
        if "availability" in data:
            self.availability_json = json.dumps(data["availability"])
        if "timetable" in data:
            self.timetable_json = json.dumps(data["timetable"])
        if "collegeSchedule" in data:
            self.college_schedule_json = json.dumps(data["collegeSchedule"])
        if "examSchedule" in data:
            self.exam_schedule_json = json.dumps(data["examSchedule"])
        if "events" in data:
            self.events_json = json.dumps(data["events"])
        if "dashboardTodos" in data:
            self.dashboard_todos_json = json.dumps(data["dashboardTodos"])
        if "dashboardNotes" in data:
            self.dashboard_notes_json = json.dumps(data["dashboardNotes"])
        if "dashboardScratchpad" in data:
            self.dashboard_scratchpad = data["dashboardScratchpad"] or ""
        if "timetablePhoto" in data:
            self.timetable_photo_json = json.dumps(data["timetablePhoto"]) if data["timetablePhoto"] is not None else "null"
        if "lastGenerated" in data:
            self.last_generated = data["lastGenerated"]
        self.updated_at = datetime.datetime.utcnow()
