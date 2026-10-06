from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class UserProfile(BaseModel):
    username: str
    name: str
    age: Optional[str] = ""
    studying: Optional[str] = "higher_studies"
    collegeYear: Optional[str] = "2nd_year"
    courseName: Optional[str] = ""
    avatar: Optional[str] = "🎓"
    dailyTargetHours: Optional[int] = 4
    createdAt: Optional[str] = None

class UserRegister(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=3)
    name: str = Field(..., min_length=1)
    age: Optional[str] = ""
    studying: Optional[str] = "higher_studies"
    collegeYear: Optional[str] = "2nd_year"
    courseName: Optional[str] = ""
    avatar: Optional[str] = "🎓"
    dailyTargetHours: Optional[int] = 4
    availability: Optional[Dict[str, List[int]]] = None
    topics: Optional[List[Dict[str, Any]]] = None
    plannerData: Optional[Dict[str, Any]] = None

class UserLogin(BaseModel):
    username: str
    password: str

class ResetPasswordRequest(BaseModel):
    username: str
    new_password: str = Field(..., min_length=3)

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[str] = None
    studying: Optional[str] = None
    collegeYear: Optional[str] = None
    courseName: Optional[str] = None
    avatar: Optional[str] = None
    dailyTargetHours: Optional[int] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    plannerData: Dict[str, Any]

class PlannerDataUpdate(BaseModel):
    tasks: Optional[List[Dict[str, Any]]] = None
    topics: Optional[List[Dict[str, Any]]] = None
    availability: Optional[Dict[str, List[int]]] = None
    timetable: Optional[List[Dict[str, Any]]] = None
    collegeSchedule: Optional[List[Dict[str, Any]]] = None
    examSchedule: Optional[List[Dict[str, Any]]] = None
    events: Optional[List[Dict[str, Any]]] = None
    dashboardTodos: Optional[List[Dict[str, Any]]] = None
    dashboardNotes: Optional[List[Dict[str, Any]]] = None
    dashboardScratchpad: Optional[str] = None
    timetablePhoto: Optional[Any] = None
    lastGenerated: Optional[str] = None

class GenerateTimetableRequest(BaseModel):
    tasks: List[Dict[str, Any]] = []
    topics: List[Dict[str, Any]] = []
    availability: Dict[str, List[int]] = {}
    weekStart: str
    collegeSchedule: List[Dict[str, Any]] = []
    examSchedule: List[Dict[str, Any]] = []
