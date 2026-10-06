# 🎓 AI Student Study Planner & Timetable Engine

A modern, intelligent full-stack student study planner and automated timetable generator with OCR image timetable scanning, college lecture schedule management, exam countdowns, Pomodoro focus timer, and a dedicated **Python + FastAPI + SQLite** backend.

---

## ✨ Full-Stack Architecture

### 🖥️ Frontend (React 18 + Vite + Tailwind CSS)
- **Fast Interactive UI**: Glassmorphic dashboard with live scheduling, calendar grids, task managers, and Pomodoro timers.
- **Client-Side OCR**: Local document/routine extraction via `tesseract.js`.
- **Real-Time Sync**: Debounced auto-sync to SQLite database with optimistic state updates and offline fallback.

### 🐍 Backend (Python + FastAPI + SQLite + SQLAlchemy)
- **High-Performance Async REST API**: Powered by FastAPI and Uvicorn.
- **Database**: Persistent SQLite database (`backend/planner.db`) managed with SQLAlchemy ORM.
- **Secure Authentication**: Password hashing with `bcrypt` and JWT bearer token authentication with `pyjwt`.
- **Interactive Documentation**: Auto-generated Swagger UI at `/docs` and ReDoc at `/redoc`.
- **Algorithmic Timetable Engine**: Intelligent scheduling avoiding college clashes & prioritizing upcoming exams.

---

## 🚀 Quick Start

### 1. Run Everything (Frontend + Backend)
```bash
npm run dev
```
- **Frontend App:** [http://localhost:5173/](http://localhost:5173/) (or `http://localhost:5174/`)
- **FastAPI Backend:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Run Individually

**Backend Only:**
```bash
npm run server
# or directly with python:
cd backend && ./venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend Only:**
```bash
npm run dev:frontend
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status & SQLite connectivity check |
| `POST` | `/api/auth/register` | Register student profile with initial subjects & availability |
| `POST` | `/api/auth/login` | Authenticate student credentials & receive JWT token |
| `GET` | `/api/auth/me` | Fetch active student session & planner state |
| `GET` | `/api/auth/users` | List registered user profiles for fast switcher |
| `PUT` | `/api/user/profile` | Update profile settings (name, avatar, level, goals) |
| `DELETE` | `/api/user/account` | Delete student profile and all associated data |
| `GET` | `/api/planner` | Fetch tasks, topics, routines, exams, notes & timetable |
| `PUT` | `/api/planner` | Synchronize and save all planner changes to SQLite |
| `POST` | `/api/ai/generate-timetable` | Algorithmic study timetable generator endpoint |

---

## 🛠️ Technology Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend:** Python 3, FastAPI, Uvicorn, SQLAlchemy 2.0, SQLite, Pydantic v2, Bcrypt, PyJWT
