import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LayoutDashboard, CheckSquare, BookOpenCheck, CalendarRange, Bell, Plus,
  Sparkles, CheckCircle2, Circle, Clock, Flame, TrendingUp, X, ChevronLeft,
  ChevronRight, ArrowUpDown, GraduationCap, Trash2, Pencil, Loader2,
  AlertTriangle, CalendarClock, Coffee, Target, BarChart3, Edit3, LogOut, User,
  Calendar, Search, Filter, Layers, Sun, Moon, Zap, Tag, Check, Award, School,
  Upload, FileText, MapPin
} from "lucide-react";
import PomodoroTimer from "./components/PomodoroTimer";
import AnalyticsView from "./components/AnalyticsView";
import ClassTimetableManager from "./components/ClassTimetableManager";
import ExamTimetableManager from "./components/ExamTimetableManager";

/* ============================================================================
   CONSTANTS & HELPERS
   ========================================================================== */

const STORAGE_KEY = "planner-data";

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const GRID_HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 -> 23:00

const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };
const PRIORITY_STYLES = {
  High: "bg-rose-50 text-rose-700 border-rose-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const CATEGORIES = ["Assignment", "Exam Prep", "Project", "Homework", "Reading / Lab"];
const CATEGORY_STYLES = {
  Assignment: "bg-blue-50 text-blue-700 border-blue-200",
  "Exam Prep": "bg-purple-50 text-purple-700 border-purple-200",
  Project: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Homework: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Reading / Lab": "bg-amber-50 text-amber-700 border-amber-200",
};

const DIFFICULTY_MINUTES = { Easy: 90, Medium: 180, Hard: 270 };
const DIFFICULTY_PRIORITY = { Easy: "Low", Medium: "Medium", Hard: "High" };
const DIFFICULTY_STYLES = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-rose-50 text-rose-700 border-rose-200",
};
const SUBJECT_DOT = ["bg-indigo-500", "bg-sky-500", "bg-violet-500", "bg-teal-500", "bg-fuchsia-500", "bg-orange-500", "bg-rose-500", "bg-amber-500"];

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
function pad(n) { return String(n).padStart(2, "0"); }
function toISODate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfDay(d) { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; }
function startOfWeek(d) {
  const r = startOfDay(d);
  const dow = (r.getDay() + 6) % 7; // Mon=0..Sun=6
  return addDays(r, -dow);
}
function parseDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr || "23:59"}:00`);
}
function fmtDisplayDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function fmtTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${period}`;
}
function subjectColor(subject, subjectList) {
  const idx = subjectList.indexOf(subject);
  return SUBJECT_DOT[idx >= 0 ? idx % SUBJECT_DOT.length : 0];
}

function getDeadlineStatus(dueDate, dueTime) {
  const now = new Date();
  const due = parseDateTime(dueDate, dueTime);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays) || 1;
    return { kind: "overdue", label: `Overdue by ${overdueDays}d`, color: "text-rose-600 bg-rose-50 border-rose-200" };
  }
  if (diffHours <= 12) {
    return { kind: "urgent", label: `Due in ${Math.max(1, diffHours)}h`, color: "text-rose-700 bg-rose-50 border-rose-300 font-bold animate-pulse" };
  }
  if (diffHours <= 24) {
    return { kind: "today", label: `Due Today (${fmtTime12(dueTime)})`, color: "text-amber-700 bg-amber-50 border-amber-300" };
  }
  if (diffDays === 1) {
    return { kind: "tomorrow", label: "Due Tomorrow", color: "text-amber-600 bg-amber-50 border-amber-200" };
  }
  return { kind: "upcoming", label: `Due in ${diffDays} days`, color: "text-slate-600 bg-slate-50 border-slate-200" };
}

/* ============================================================================
   MOCK DATA (first-launch seed)
   ========================================================================== */

function buildMockData() {
  const today = startOfDay(new Date());
  const tasks = [
    { id: uid(), title: "Calculus Problem Set 4", subject: "Calculus", category: "Assignment", dueDate: toISODate(addDays(today, 2)), dueTime: "23:59", priority: "High", estHours: 3, completed: false },
    { id: uid(), title: "Data Structures Lab Report", subject: "Data Structures", category: "Reading / Lab", dueDate: toISODate(addDays(today, 1)), dueTime: "18:00", priority: "High", estHours: 2, completed: false },
    { id: uid(), title: "Digital Electronics Circuit Simulation", subject: "Electronics", category: "Project", dueDate: toISODate(addDays(today, 4)), dueTime: "17:00", priority: "Medium", estHours: 3.5, completed: false },
    { id: uid(), title: "Marketing Case Study Draft", subject: "Marketing", category: "Assignment", dueDate: toISODate(addDays(today, 5)), dueTime: "12:00", priority: "Medium", estHours: 4, completed: false },
    { id: uid(), title: "Read Chapter 7 — Thermodynamics", subject: "Physics", category: "Homework", dueDate: toISODate(addDays(today, 7)), dueTime: "09:00", priority: "Low", estHours: 1.5, completed: false },
  ];
  const topics = [
    { id: uid(), name: "Integration by Parts & Substitution", subject: "Calculus", difficulty: "Medium", completed: false },
    { id: uid(), name: "Binary Search Trees & AVL Rotations", subject: "Data Structures", difficulty: "Hard", completed: false },
    { id: uid(), name: "K-Maps & Logic Simplification", subject: "Electronics", difficulty: "Medium", completed: false },
    { id: uid(), name: "Consumer Behaviour Models", subject: "Marketing", difficulty: "Easy", completed: false },
  ];
  const availability = {
    Mon: [17, 18, 19, 20], Tue: [17, 18, 19, 20], Wed: [17, 18, 19, 20],
    Thu: [17, 18, 19, 20], Fri: [17, 18, 19, 20],
    Sat: [10, 11, 12, 13, 14, 15], Sun: [10, 11, 12, 13, 14, 15],
  };

  const collegeSchedule = [
    { id: 'c1', day: 'Mon', start: '09:00', end: '10:30', subject: 'Calculus', type: 'Lecture', room: 'Hall 101' },
    { id: 'c2', day: 'Mon', start: '11:00', end: '13:00', subject: 'Data Structures', type: 'Lab', room: 'CS Lab 2' },
    { id: 'c3', day: 'Tue', start: '10:00', end: '11:30', subject: 'Digital Electronics', type: 'Lecture', room: 'ECE Hall A' },
    { id: 'c4', day: 'Wed', start: '09:00', end: '10:30', subject: 'Data Structures', type: 'Lecture', room: 'Hall 102' },
    { id: 'c5', day: 'Thu', start: '10:30', end: '12:00', subject: 'Marketing', type: 'Lecture', room: 'Management B' },
    { id: 'c6', day: 'Fri', start: '09:00', end: '10:30', subject: 'Calculus', type: 'Tutorial', room: 'Room 204' }
  ];

  const examSchedule = [
    {
      id: 'e1',
      subject: 'Data Structures',
      title: 'Mid-Term Theory Exam',
      date: toISODate(addDays(today, 3)),
      start: '10:00',
      end: '12:00',
      room: 'Examination Hall A',
      weightage: 'Midterm',
      syllabus: 'Binary Search Trees, Heaps, AVL Trees, Graphs'
    },
    {
      id: 'e2',
      subject: 'Calculus',
      title: 'Mid-Semester Written Paper',
      date: toISODate(addDays(today, 6)),
      start: '14:00',
      end: '16:30',
      room: 'Main Auditorium',
      weightage: 'Midterm',
      syllabus: 'Differential Equations, Multivariable Calculus'
    }
  ];

  return { 
    tasks, 
    topics, 
    availability, 
    collegeSchedule, 
    examSchedule, 
    timetable: [], 
    student: { name: "Student", program: "General Studies" } 
  };
}

/* ============================================================================
   AI TIMETABLE GENERATOR (Aware of College Schedule + Exams + Availability)
   ========================================================================== */

function buildWeekSlots(availability, weekStart, collegeSchedule = [], examSchedule = []) {
  const slots = [];

  for (let d = 0; d < 7; d++) {
    const date = addDays(weekStart, d);
    const dateISO = toISODate(date);
    const dayKey = DAY_KEYS[d];

    // 1. Overlay College / School Classes for this day
    const dayClasses = (collegeSchedule || []).filter((c) => c.day === dayKey);
    dayClasses.forEach((cls) => {
      slots.push({
        id: `cls-${cls.id}-${dateISO}`,
        date: dateISO,
        day: dayKey,
        start: cls.start,
        end: cls.end,
        type: "class",
        assigned: {
          title: `${cls.subject} (${cls.type})`,
          subject: cls.subject,
          classType: cls.type,
          room: cls.room,
        },
        completed: true,
      });
    });

    // 2. Overlay Scheduled Exams on this exact date
    const dayExams = (examSchedule || []).filter((e) => e.date === dateISO);
    dayExams.forEach((ex) => {
      slots.push({
        id: `exam-${ex.id}-${dateISO}`,
        date: dateISO,
        day: dayKey,
        start: ex.start,
        end: ex.end,
        type: "exam",
        assigned: {
          title: ex.title || `${ex.subject} Exam`,
          subject: ex.subject,
          weightage: ex.weightage,
          room: ex.room,
          syllabus: ex.syllabus,
        },
        completed: false,
      });
    });

    // 3. Extract Free Hours from Student Availability Grid (excluding class & exam hours)
    const hours = [...(availability[dayKey] || [])].sort((a, b) => a - b);
    if (hours.length === 0) continue;

    // Filter hours that clash with college classes or exams
    const freeHours = hours.filter((h) => {
      const hStart = h * 60;
      const hEnd = (h + 1) * 60;
      const classClash = dayClasses.some((c) => {
        const [csH, csM] = c.start.split(":").map(Number);
        const [ceH, ceM] = c.end.split(":").map(Number);
        return hStart < ceH * 60 + ceM && hEnd > csH * 60 + csM;
      });
      const examClash = dayExams.some((e) => {
        const [esH, esM] = e.start.split(":").map(Number);
        const [eeH, eeM] = e.end.split(":").map(Number);
        return hStart < eeH * 60 + eeM && hEnd > esH * 60 + esM;
      });
      return !classClash && !examClash;
    });

    if (freeHours.length === 0) continue;

    const runs = [];
    let run = [freeHours[0]];
    for (let i = 1; i < freeHours.length; i++) {
      if (freeHours[i] === freeHours[i - 1] + 1) run.push(freeHours[i]);
      else { runs.push(run); run = [freeHours[i]]; }
    }
    runs.push(run);

    runs.forEach((r) => {
      let cursorMin = r[0] * 60;
      const endMin = (r[r.length - 1] + 1) * 60;
      while (cursorMin + 50 <= endMin) {
        const startH = Math.floor(cursorMin / 60), startM = cursorMin % 60;
        const blockEndMin = cursorMin + 50;
        const endH = Math.floor(blockEndMin / 60), endM = blockEndMin % 60;
        slots.push({
          id: uid(),
          date: dateISO,
          day: dayKey,
          start: `${pad(startH)}:${pad(startM)}`,
          end: `${pad(endH)}:${pad(endM)}`,
          type: "study",
          assigned: null,
          completed: false,
        });
        cursorMin = blockEndMin;
        if (cursorMin + 10 <= endMin) {
          const bEndMin = cursorMin + 10;
          slots.push({
            id: uid(),
            date: dateISO,
            day: dayKey,
            start: `${pad(Math.floor(cursorMin / 60))}:${pad(cursorMin % 60)}`,
            end: `${pad(Math.floor(bEndMin / 60))}:${pad(bEndMin % 60)}`,
            type: "break",
            assigned: null,
            completed: false,
          });
          cursorMin = bEndMin;
        }
      }
    });
  }

  return slots.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
}

function buildWorkQueue(tasks, topics, examSchedule = []) {
  // 1. Exam Prep Sprints (Highest priority, scheduled before exam date)
  const examItems = (examSchedule || []).map((ex) => ({
    key: `exam-prep-${ex.id}`,
    refId: ex.id,
    type: "task",
    title: `⚡ Exam Revision: ${ex.subject} (${ex.title || ex.weightage})`,
    subject: ex.subject,
    priority: "High",
    category: "Exam Prep",
    remainingMin: 250, // Dedicated 4-5 study slots for upcoming exam
    deadline: parseDateTime(ex.date, ex.start),
  }));

  // 2. Open Assignment Tasks
  const taskItems = tasks
    .filter((t) => !t.completed)
    .map((t) => ({
      key: `task-${t.id}`,
      refId: t.id,
      type: "task",
      title: t.title,
      subject: t.subject,
      priority: t.priority,
      category: t.category || "Assignment",
      remainingMin: Math.max(50, Math.round((t.estHours || 2) * 60)),
      deadline: parseDateTime(t.dueDate, t.dueTime),
    }));

  // 3. Concept Revision Topics
  const topicItems = topics
    .filter((t) => !t.completed)
    .map((t) => ({
      key: `topic-${t.id}`,
      refId: t.id,
      type: "topic",
      title: `📖 Topic Mastery: ${t.name}`,
      subject: t.subject,
      priority: DIFFICULTY_PRIORITY[t.difficulty] || "Medium",
      category: "Exam Prep",
      remainingMin: DIFFICULTY_MINUTES[t.difficulty] || 180,
      deadline: null,
    }));

  return [...examItems, ...taskItems, ...topicItems].sort((a, b) => {
    const ad = a.deadline ? a.deadline.getTime() : Infinity;
    const bd = b.deadline ? b.deadline.getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1);
  });
}

function generateTimetable(tasks, topics, availability, weekStart, collegeSchedule = [], examSchedule = []) {
  const slots = buildWeekSlots(availability, weekStart, collegeSchedule, examSchedule);
  const queue = buildWorkQueue(tasks, topics, examSchedule);
  let qIndex = 0;

  for (const slot of slots) {
    if (slot.type !== "study") continue;
    const slotMoment = parseDateTime(slot.date, slot.start);

    while (qIndex < queue.length && queue[qIndex].remainingMin <= 0) qIndex++;
    let chosen = -1;
    for (let i = qIndex; i < queue.length; i++) {
      const item = queue[i];
      if (item.remainingMin <= 0) continue;
      if (item.deadline && slotMoment >= item.deadline) continue;
      chosen = i;
      break;
    }
    if (chosen === -1) continue;

    const item = queue[chosen];
    slot.assigned = {
      refId: item.refId,
      itemType: item.type,
      title: item.title,
      subject: item.subject,
      priority: item.priority,
      category: item.category,
    };
    item.remainingMin -= 50;
  }
  return slots;
}

/* ============================================================================
   ROOT APP
   ========================================================================== */

export default function StudentPlanner({ 
  userProfile, 
  savedPlannerData, 
  onSavePlannerData, 
  onEditProfile, 
  onDeleteProfile, 
  onSignOut 
}) {
  // Lazy initial state from savedPlannerData or mock seed
  const [tasks, setTasks] = useState(() => {
    if (savedPlannerData?.tasks && Array.isArray(savedPlannerData.tasks)) return savedPlannerData.tasks;
    return buildMockData().tasks;
  });
  const [topics, setTopics] = useState(() => {
    if (savedPlannerData?.topics && Array.isArray(savedPlannerData.topics)) return savedPlannerData.topics;
    return buildMockData().topics;
  });
  const [availability, setAvailability] = useState(() => {
    if (savedPlannerData?.availability && typeof savedPlannerData.availability === 'object') return savedPlannerData.availability;
    return buildMockData().availability;
  });
  const [collegeSchedule, setCollegeSchedule] = useState(() => {
    if (savedPlannerData?.collegeSchedule && Array.isArray(savedPlannerData.collegeSchedule)) return savedPlannerData.collegeSchedule;
    return buildMockData().collegeSchedule;
  });
  const [examSchedule, setExamSchedule] = useState(() => {
    if (savedPlannerData?.examSchedule && Array.isArray(savedPlannerData.examSchedule)) return savedPlannerData.examSchedule;
    return buildMockData().examSchedule;
  });
  const [timetable, setTimetable] = useState(() => {
    if (savedPlannerData?.timetable && Array.isArray(savedPlannerData.timetable)) return savedPlannerData.timetable;
    return buildMockData().timetable;
  });
  const [lastGenerated, setLastGenerated] = useState(() => {
    return savedPlannerData?.lastGenerated || null;
  });
  const [studentState, setStudentState] = useState({ name: "Student", program: "" });

  const student = useMemo(() => {
    if (userProfile) {
      const course = userProfile.courseName?.trim() || '';
      let year = userProfile.yearLabel || userProfile.yearShort || '';
      if (!year && userProfile.collegeYear) {
        const yrClean = String(userProfile.collegeYear).replace('year_', '').replace('_year', '');
        const suffix = yrClean === '1' || yrClean === '1st' ? '1st' : yrClean === '2' || yrClean === '2nd' ? '2nd' : yrClean === '3' || yrClean === '3rd' ? '3rd' : yrClean === '4' || yrClean === '4th' ? '4th' : `${yrClean}th`;
        year = `${suffix} Year`;
      }

      let programStr = userProfile.levelTitle || 'Student';
      if (userProfile.studying === 'higher_studies') {
        if (course && year) {
          programStr = `${course} (${year})`;
        } else if (course) {
          programStr = course;
        } else if (year) {
          programStr = year;
        }
      }

      return {
        name: userProfile.name || 'Student',
        program: programStr,
        courseName: course,
        yearLabel: year,
        studying: userProfile.studying,
        avatar: userProfile.avatar,
        age: userProfile.age,
        dailyTargetHours: userProfile.dailyTargetHours || 4,
        summaryTag: userProfile.summaryTag
      };
    }
    return studentState;
  }, [userProfile, studentState]);

  const [view, setView] = useState("dashboard");
  const [now, setNow] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [taskModal, setTaskModal] = useState({ open: false, editing: null });
  const [generating, setGenerating] = useState(false);

  // Debounced/Safe auto-save to parent accounts storage without thrashing
  const onSaveRef = useRef(onSavePlannerData);
  useEffect(() => {
    onSaveRef.current = onSavePlannerData;
  }, [onSavePlannerData]);

  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef(null);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (onSaveRef.current) {
        onSaveRef.current({
          tasks,
          topics,
          availability,
          collegeSchedule,
          examSchedule,
          timetable,
          lastGenerated
        });
      }
    }, 300);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [tasks, topics, availability, collegeSchedule, examSchedule, timetable, lastGenerated]);

  /* ---- live clock ---- */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const subjectList = useMemo(() => {
    const s = new Set([
      ...tasks.map((t) => t.subject), 
      ...topics.map((t) => t.subject),
      ...collegeSchedule.map((c) => c.subject),
      ...examSchedule.map((e) => e.subject)
    ]);
    return Array.from(s).filter(Boolean);
  }, [tasks, topics, collegeSchedule, examSchedule]);

  const weekStart = useMemo(() => startOfWeek(now), [now]);

  /* ---- Handlers ---- */
  const toggleTask = useCallback((id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);

  const saveTask = useCallback((taskData) => {
    if (taskData.id) {
      setTasks((prev) => prev.map((t) => (t.id === taskData.id ? { ...t, ...taskData } : t)));
    } else {
      setTasks((prev) => [{ ...taskData, id: uid(), completed: false }, ...prev]);
    }
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addTopic = useCallback((topicData) => {
    setTopics((prev) => [...prev, { ...topicData, id: uid(), completed: false }]);
  }, []);

  const deleteTopic = useCallback((id) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTopic = useCallback((id) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);

  const toggleSlot = useCallback((day, hour) => {
    setAvailability((prev) => {
      const current = prev[day] || [];
      const next = current.includes(hour) ? current.filter((h) => h !== hour) : [...current, hour];
      return { ...prev, [day]: next };
    });
  }, []);

  const applyAvailabilityPreset = useCallback((presetType) => {
    if (presetType === "clear") {
      setAvailability({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] });
      return;
    }
    if (presetType === "morning") {
      const morningHours = [7, 8, 9, 10, 11];
      const next = {};
      DAY_KEYS.forEach(d => { next[d] = morningHours; });
      setAvailability(next);
      return;
    }
    if (presetType === "evening") {
      const eveningHours = [17, 18, 19, 20, 21];
      const next = {};
      DAY_KEYS.forEach(d => { next[d] = eveningHours; });
      setAvailability(next);
      return;
    }
    if (presetType === "night") {
      const nightHours = [20, 21, 22, 23];
      const next = {};
      DAY_KEYS.forEach(d => { next[d] = nightHours; });
      setAvailability(next);
      return;
    }
    if (presetType === "weekend") {
      setAvailability({
        Mon: [18, 19, 20], Tue: [18, 19, 20], Wed: [18, 19, 20], Thu: [18, 19, 20], Fri: [18, 19, 20],
        Sat: [9, 10, 11, 12, 14, 15, 16, 17], Sun: [9, 10, 11, 12, 14, 15, 16, 17]
      });
      return;
    }
  }, []);

  /* ---- College Class Handlers ---- */
  const handleSaveClass = useCallback((classData) => {
    if (classData.id) {
      setCollegeSchedule(prev => prev.map(c => c.id === classData.id ? classData : c));
    } else {
      setCollegeSchedule(prev => [...prev, { ...classData, id: uid() }]);
    }
  }, []);

  const handleDeleteClass = useCallback((id) => {
    setCollegeSchedule(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleImportBulkClasses = useCallback((newItems) => {
    setCollegeSchedule(prev => [...prev, ...newItems]);
  }, []);

  /* ---- Exam Schedule Handlers ---- */
  const handleSaveExam = useCallback((examData) => {
    if (examData.id) {
      setExamSchedule(prev => prev.map(e => e.id === examData.id ? examData : e));
    } else {
      setExamSchedule(prev => [...prev, { ...examData, id: uid() }]);
    }
  }, []);

  const handleDeleteExam = useCallback((id) => {
    setExamSchedule(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleImportBulkExams = useCallback((newItems) => {
    setExamSchedule(prev => [...prev, ...newItems]);
  }, []);

  const toggleBlockDone = useCallback((blockId) => {
    setTimetable((prev) => prev.map((b) => (b.id === blockId ? { ...b, completed: !b.completed } : b)));
  }, []);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const slots = generateTimetable(tasks, topics, availability, weekStart, collegeSchedule, examSchedule);
      setTimetable(slots);
      setLastGenerated(new Date().toISOString());
      setGenerating(false);
    }, 600);
  }, [tasks, topics, availability, weekStart, collegeSchedule, examSchedule]);

  /* ---- Computed metrics ---- */
  const alerts = useMemo(() => {
    const list = [];
    const in48h = addDays(now, 2);
    
    // Exam alerts
    (examSchedule || []).forEach((ex) => {
      const examDate = parseDateTime(ex.date, ex.start);
      if (examDate >= now && examDate <= addDays(now, 4)) {
        list.push({ id: `ex-${ex.id}`, kind: "exam", title: `🚨 EXAM: ${ex.subject} (${ex.title || ex.weightage})`, subject: ex.subject, dueDate: ex.date, dueTime: ex.start });
      }
    });

    // Task alerts
    tasks.filter((t) => !t.completed).forEach((t) => {
      const due = parseDateTime(t.dueDate, t.dueTime);
      if (due < now) {
        list.push({ id: t.id, kind: "overdue", title: t.title, subject: t.subject, dueDate: t.dueDate, dueTime: t.dueTime });
      } else if (due <= in48h) {
        list.push({ id: t.id, kind: "upcoming", title: t.title, subject: t.subject, dueDate: t.dueDate, dueTime: t.dueTime });
      }
    });
    return list;
  }, [tasks, examSchedule, now]);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const in48h = alerts.length;

    const studyBlocks = timetable.filter((b) => b.type === "study");
    const completedBlocks = studyBlocks.filter((b) => b.completed).length;
    const hoursStudied = Math.round(((completedBlocks * 50) / 60) * 10) / 10;
    const completionRate = studyBlocks.length > 0 ? Math.round((completedBlocks / studyBlocks.length) * 100) : 0;

    return { totalTasks, completedTasks, in48h, hoursStudied, completionRate };
  }, [tasks, alerts, timetable]);

  const upNext = useMemo(() => {
    const todayISO = toISODate(now);
    const nowHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    // Next timetable event (class, exam, or study block)
    const nextBlock = timetable.find((b) => b.date === todayISO && !b.completed && b.end >= nowHHMM && b.assigned);
    if (nextBlock) return { kind: "block", block: nextBlock };

    const upcomingTask = [...tasks]
      .filter((t) => !t.completed)
      .sort((a, b) => parseDateTime(a.dueDate, a.dueTime) - parseDateTime(b.dueDate, b.dueTime))[0];
    if (upcomingTask) return { kind: "task", task: upcomingTask };
    return null;
  }, [timetable, tasks, now]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Lexend', ui-sans-serif, system-ui, sans-serif; }
      `}</style>

      {/* Primary Top Header */}
      <AppHeader
        student={student}
        now={now}
        alerts={alerts}
        notifOpen={notifOpen}
        setNotifOpen={setNotifOpen}
        onAddTask={() => setTaskModal({ open: true, editing: null })}
        onGenerate={handleGenerate}
        generating={generating}
        setView={setView}
        onEditProfile={onEditProfile}
        onDeleteProfile={onDeleteProfile}
        onSignOut={onSignOut}
      />

      {/* Navigation Tabs with Live Clock pill */}
      <NavTabs view={view} setView={setView} alertCount={alerts.length} now={now} />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 pt-6">
        {view === "dashboard" && (
          <DashboardView
            stats={stats}
            upNext={upNext}
            timetable={timetable}
            now={now}
            weekStart={weekStart}
            tasks={tasks}
            subjectList={subjectList}
            onGenerate={handleGenerate}
            generating={generating}
            toggleBlockDone={toggleBlockDone}
            setView={setView}
            onAddTask={() => setTaskModal({ open: true, editing: null })}
            collegeScheduleCount={collegeSchedule.length}
            examScheduleCount={examSchedule.length}
          />
        )}

        {view === "tasks" && (
          <TasksView
            tasks={tasks}
            subjectList={subjectList}
            onAdd={() => setTaskModal({ open: true, editing: null })}
            onEdit={(t) => setTaskModal({ open: true, editing: t })}
            onDelete={deleteTask}
            onToggle={toggleTask}
          />
        )}

        {view === "topics" && (
          <TopicsView
            topics={topics}
            subjectList={subjectList}
            onAdd={addTopic}
            onDelete={deleteTopic}
            onToggle={toggleTopic}
            availability={availability}
            toggleSlot={toggleSlot}
            onApplyPreset={applyAvailabilityPreset}
          />
        )}

        {view === "timetable" && (
          <TimetableView
            timetable={timetable}
            collegeSchedule={collegeSchedule}
            examSchedule={examSchedule}
            onSaveClass={handleSaveClass}
            onDeleteClass={handleDeleteClass}
            onImportBulkClasses={handleImportBulkClasses}
            onSaveExam={handleSaveExam}
            onDeleteExam={handleDeleteExam}
            onImportBulkExams={handleImportBulkExams}
            onGenerate={handleGenerate}
            generating={generating}
            toggleBlockDone={toggleBlockDone}
            lastGenerated={lastGenerated}
            subjectList={subjectList}
          />
        )}

        {view === "analytics" && (
          <AnalyticsView
            tasks={tasks}
            topics={topics}
            timetable={timetable}
            student={student}
            subjectList={subjectList}
          />
        )}
      </main>

      {/* Task Creation / Edit Modal */}
      {taskModal.open && (
        <TaskModal
          editing={taskModal.editing}
          subjectList={subjectList}
          onClose={() => setTaskModal({ open: false, editing: null })}
          onSave={(data) => { saveTask(data); setTaskModal({ open: false, editing: null }); }}
        />
      )}
    </div>
  );
}

/* ============================================================================
   HEADER
   ========================================================================== */

function AppHeader({ student, now, alerts, notifOpen, setNotifOpen, onAddTask, onGenerate, generating, setView, onEditProfile, onDeleteProfile, onSignOut }) {
  const initials = (student.name || "Student").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-display font-semibold text-sm shrink-0 shadow-sm ring-2 ring-indigo-100">
            {student.avatar ? <span className="text-xl select-none leading-none">{student.avatar}</span> : initials}
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <p className="font-display font-bold text-slate-800 text-sm sm:text-base truncate">{student.name}</p>
            {student.courseName && student.yearLabel ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  {student.courseName}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                  {student.yearLabel}
                </span>
              </div>
            ) : student.courseName ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                {student.courseName}
              </span>
            ) : student.yearLabel ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                  {student.yearLabel}
                </span>
                {onEditProfile && (
                  <button
                    onClick={onEditProfile}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/80 transition-colors cursor-pointer"
                    title="Click to add Course / Degree"
                  >
                    <Plus className="w-3 h-3" /> Add Course
                  </button>
                )}
              </div>
            ) : student.summaryTag ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                {student.summaryTag}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
              aria-label="Notifications"
              title="Notifications & Alerts"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Alerts</span>
              {alerts.length > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotificationDrawer alerts={alerts} onClose={() => setNotifOpen(false)} setView={setView} />
            )}
          </div>

          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-xs cursor-pointer"
              title="Edit Profile & Academic Info"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Profile</span>
            </button>
          )}

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/60 text-xs font-semibold text-rose-600 hover:bg-rose-100/80 transition-all shadow-xs cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function NotificationDrawer({ alerts, onClose, setView }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl z-50 p-1">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <p className="font-display font-semibold text-sm text-slate-800">Reminders & Alerts</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-400 mt-0.5">No overdue assignments or urgent deadlines.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {alerts.map((a) => (
              <li key={a.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <button
                  className="w-full text-left cursor-pointer"
                  onClick={() => { setView(a.kind === "exam" ? "timetable" : "tasks"); onClose(); }}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${a.kind === "overdue" || a.kind === "exam" ? "text-rose-500" : "text-amber-500"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{a.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-semibold text-indigo-600">{a.subject}</span>
                        <span>·</span>
                        <span className={a.kind === "overdue" || a.kind === "exam" ? "text-rose-600 font-semibold" : "text-amber-600 font-medium"}>
                          {a.kind === "overdue" ? "Overdue" : a.kind === "exam" ? "Exam Date" : "Due soon"}: {fmtDisplayDate(a.dueDate)} ({fmtTime12(a.dueTime)})
                        </span>
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/* ============================================================================
   NAV TABS
   ========================================================================== */

function NavTabs({ view, setView, alertCount, now }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks & Assignments", icon: CheckSquare },
    { id: "topics", label: "Topics & Availability", icon: BookOpenCheck },
    { id: "timetable", label: "Timetable & Classes", icon: CalendarRange },
    { id: "analytics", label: "Progress & Analytics", icon: BarChart3 },
  ];
  return (
    <div className="border-b border-slate-200 bg-white shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        <nav className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  active ? "border-indigo-600 text-indigo-600 font-semibold" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.id === "tasks" && alertCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {now && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl my-1.5 shadow-2xs shrink-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
            <span className="text-slate-300">·</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">{now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   DASHBOARD VIEW
   ========================================================================== */

function DashboardView({ 
  stats, 
  upNext, 
  timetable, 
  now, 
  weekStart, 
  tasks, 
  subjectList, 
  onGenerate, 
  generating, 
  toggleBlockDone, 
  setView, 
  onAddTask,
  collegeScheduleCount = 0,
  examScheduleCount = 0
}) {
  const todayISO = toISODate(now);
  const todayBlocks = timetable.filter((b) => b.date === todayISO).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Target} label="Total Tasks" value={stats.totalTasks} sub={`${stats.completedTasks} finished`} tint="indigo" />
        <StatCard icon={AlertTriangle} label="Deadlines (48h)" value={stats.in48h} sub={stats.in48h > 0 ? "Urgent attention" : "On track"} tint="rose" />
        <StatCard icon={Flame} label="Hours Studied" value={`${stats.hoursStudied}h`} sub="this week" tint="amber" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${stats.completionRate}%`} sub="weekly plan" tint="emerald" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Today's Schedule (Classes + Exams + Study) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-slate-800 text-base">Today's Agenda & Schedule</h2>
                <p className="text-xs text-slate-400 mt-0.5">{fmtDisplayDate(todayISO)} · Classes, Exams & Study Sessions</p>
              </div>
              <button onClick={() => setView("timetable")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                View Timetable Hub →
              </button>
            </div>

            {todayBlocks.length === 0 ? (
              <EmptyState
                icon={CalendarRange}
                title="No schedule blocks for today"
                body="Generate your AI study timetable to automatically integrate your college classes, upcoming exams, and prioritized tasks."
                action={
                  <button onClick={onGenerate} disabled={generating} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 cursor-pointer shadow-sm">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate AI Schedule
                  </button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {todayBlocks.map((b) => (
                  <ScheduleBlockRow key={b.id} block={b} onToggle={toggleBlockDone} subjectList={subjectList} />
                ))}
              </ul>
            )}
          </div>

          {/* Quick Shortcuts to Class and Exam Timetable */}
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div 
              onClick={() => setView("timetable")}
              className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50/70 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">College / School Routine</h4>
                  <p className="text-[11px] text-slate-500">{collegeScheduleCount} regular classes registered</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600">Manage →</span>
            </div>

            <div 
              onClick={() => setView("timetable")}
              className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/70 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Exam Timetable</h4>
                  <p className="text-[11px] text-slate-500">{examScheduleCount} upcoming exam dates</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600">Manage →</span>
            </div>
          </div>
        </div>

        {/* Right Col: Pomodoro Focus Timer & Up Next */}
        <div className="space-y-5">
          <PomodoroTimer />

          {/* Up Next Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">Up Next in Your Schedule</h3>
            {upNext ? (
              upNext.kind === "block" ? (
                <div className={`rounded-xl p-4 border ${
                  upNext.block.type === 'class' 
                    ? 'bg-blue-50/80 border-blue-100' 
                    : upNext.block.type === 'exam' 
                      ? 'bg-rose-50/80 border-rose-100' 
                      : 'bg-indigo-50/80 border-indigo-100'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {fmtTime12(upNext.block.start)} – {fmtTime12(upNext.block.end)}
                    </p>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-white/80">
                      {upNext.block.type}
                    </span>
                  </div>
                  <p className="font-display font-bold text-slate-800 text-sm">{upNext.block.assigned.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{upNext.block.assigned.subject}</p>
                </div>
              ) : (
                <div className="rounded-xl bg-indigo-50/80 border border-indigo-100 p-4">
                  <p className="text-[11px] font-bold text-indigo-600 mb-1">
                    Due {fmtDisplayDate(upNext.task.dueDate)}, {fmtTime12(upNext.task.dueTime)}
                  </p>
                  <p className="font-display font-bold text-slate-800 text-sm">{upNext.task.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{upNext.task.subject}</p>
                </div>
              )
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">Nothing pending right now — great job!</p>
            )}

            {/* Open tasks breakdown */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Open Tasks by Priority</p>
              {["High", "Medium", "Low"].map((p) => {
                const count = tasks.filter((t) => !t.completed && t.priority === p).length;
                return (
                  <div key={p} className="flex items-center justify-between py-1 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${p === "High" ? "bg-rose-500" : p === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`} />
                      {p} Priority
                    </span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tint }) {
  const tints = {
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-4 sm:p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tints[tint]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="font-display text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}{sub ? <span className="block text-[11px] text-slate-400 font-normal">{sub}</span> : null}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <p className="font-display font-semibold text-slate-700 text-sm">{title}</p>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

function ScheduleBlockRow({ block, onToggle, subjectList }) {
  if (block.type === 'class') {
    return (
      <li className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3 shadow-2xs">
        <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
          <School className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{block.assigned.title}</p>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {block.assigned.classType || 'Class'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>{block.assigned.subject}</span>
            {block.assigned.room && <span>• {block.assigned.room}</span>}
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-700 shrink-0 bg-white border border-blue-200 px-2 py-1 rounded-lg">
          {fmtTime12(block.start)} – {fmtTime12(block.end)}
        </span>
      </li>
    );
  }

  if (block.type === 'exam') {
    return (
      <li className="flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50/60 p-3 shadow-2xs">
        <div className="p-1.5 rounded-lg bg-rose-600 text-white shrink-0">
          <Award className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-bold text-rose-900 truncate">{block.assigned.title}</p>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
              EXAM
            </span>
          </div>
          <p className="text-[11px] text-slate-600 flex items-center gap-2">
            <span>{block.assigned.subject}</span>
            {block.assigned.room && <span>• {block.assigned.room}</span>}
          </p>
        </div>
        <span className="text-xs font-bold text-rose-700 shrink-0 bg-white border border-rose-200 px-2 py-1 rounded-lg">
          {fmtTime12(block.start)} – {fmtTime12(block.end)}
        </span>
      </li>
    );
  }

  if (block.type === 'break') {
    return (
      <li className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Rest Break · {fmtTime12(block.start)}–{fmtTime12(block.end)}</span>
      </li>
    );
  }

  return (
    <li className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${block.completed ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white"} shadow-2xs`}>
      <button onClick={() => onToggle(block.id)} className="shrink-0 cursor-pointer">
        {block.completed ? <CheckCircle2 className="w-5 h-5 text-indigo-600" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400" />}
      </button>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${subjectColor(block.assigned?.subject, subjectList)}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-xs sm:text-sm font-semibold truncate ${block.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{block.assigned?.title}</p>
        <p className="text-[11px] text-slate-500 flex items-center gap-2">
          <span>{block.assigned?.subject}</span>
          {block.assigned?.category && (
            <span className="text-[10px] px-1.5 rounded bg-slate-100 text-slate-600">{block.assigned?.category}</span>
          )}
        </p>
      </div>
      <span className="text-xs font-semibold text-slate-600 shrink-0 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-lg">
        {fmtTime12(block.start)} – {fmtTime12(block.end)}
      </span>
    </li>
  );
}

/* ============================================================================
   TASKS & ASSIGNMENT MANAGEMENT VIEW
   ========================================================================== */

function TasksView({ tasks, subjectList, onAdd, onEdit, onDelete, onToggle }) {
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [statusTab, setStatusTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("deadline");
  const [viewLayout, setViewLayout] = useState("list");

  const filtered = useMemo(() => {
    let list = [...tasks];

    const now = new Date();
    if (statusTab === "pending") {
      list = list.filter((t) => !t.completed);
    } else if (statusTab === "completed") {
      list = list.filter((t) => t.completed);
    } else if (statusTab === "overdue") {
      list = list.filter((t) => !t.completed && parseDateTime(t.dueDate, t.dueTime) < now);
    }

    if (filterSubject !== "All") {
      list = list.filter((t) => t.subject === filterSubject);
    }

    if (filterCategory !== "All") {
      list = list.filter((t) => (t.category || "Assignment") === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === "deadline") return parseDateTime(a.dueDate, a.dueTime) - parseDateTime(b.dueDate, b.dueTime);
      if (sortBy === "priority") return (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1);
      if (sortBy === "subject") return a.subject.localeCompare(b.subject);
      return 0;
    });

    return list;
  }, [tasks, statusTab, filterSubject, filterCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-lg sm:text-xl font-bold text-slate-800">Assignments & Task Management</h1>
          <p className="text-xs text-slate-500">Track deadlines, organize by priority, and schedule revision blocks.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              onClick={() => setViewLayout("list")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewLayout === "list" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewLayout("matrix")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewLayout === "matrix" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Matrix
            </button>
          </div>

          <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100">
          {[
            { id: "all", label: "All Tasks", count: tasks.length },
            { id: "pending", label: "Pending", count: tasks.filter(t => !t.completed).length },
            { id: "overdue", label: "Overdue", count: tasks.filter(t => !t.completed && parseDateTime(t.dueDate, t.dueTime) < new Date()).length },
            { id: "completed", label: "Completed", count: tasks.filter(t => t.completed).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                statusTab === tab.id
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusTab === tab.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Subject, Category, and Sorting controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or subjects…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Subjects</option>
            {subjectList.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent focus:outline-none w-full">
              <option value="deadline">Sort: Deadline</option>
              <option value="priority">Sort: Priority</option>
              <option value="subject">Sort: Subject</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Render */}
      {viewLayout === "list" ? (
        filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState
              icon={CheckSquare}
              title="No tasks found"
              body="There are no assignments matching your current filters. Add a task to start scheduling."
              action={
                <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              }
            />
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((t) => (
              <TaskRow key={t.id} task={t} subjectList={subjectList} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} />
            ))}
          </ul>
        )
      ) : (
        /* Priority Matrix View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["High", "Medium", "Low"].map((p) => {
            const listForPriority = filtered.filter(t => t.priority === p);
            return (
              <div key={p} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-display font-bold text-xs flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${p === "High" ? "bg-rose-500" : p === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`} />
                    {p} Priority
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.2 rounded-full">
                    {listForPriority.length}
                  </span>
                </div>
                {listForPriority.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No {p.toLowerCase()} priority tasks</p>
                ) : (
                  <ul className="space-y-2">
                    {listForPriority.map((t) => (
                      <li key={t.id} className={`p-3 rounded-xl border ${t.completed ? "border-slate-100 bg-slate-50 opacity-60" : "border-slate-200 bg-white"} shadow-2xs space-y-1.5`}>
                        <div className="flex items-start gap-2">
                          <button onClick={() => onToggle(t.id)} className="mt-0.5 shrink-0 cursor-pointer">
                            {t.completed ? <CheckCircle2 className="w-4 h-4 text-indigo-600" /> : <Circle className="w-4 h-4 text-slate-300" />}
                          </button>
                          <p className={`text-xs font-bold ${t.completed ? "line-through text-slate-400" : "text-slate-800"}`}>{t.title}</p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pl-6">
                          <span>{t.subject}</span>
                          <span>{fmtDisplayDate(t.dueDate)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, subjectList, onEdit, onDelete, onToggle }) {
  const status = getDeadlineStatus(task.dueDate, task.dueTime);
  const categoryStyle = CATEGORY_STYLES[task.category] || CATEGORY_STYLES.Assignment;

  return (
    <li className={`flex items-center gap-3 rounded-2xl border p-3 sm:p-4 ${task.completed ? "border-slate-100 bg-slate-50/70" : "border-slate-200 bg-white"} shadow-2xs transition-all hover:border-indigo-200`}>
      <button onClick={() => onToggle(task.id)} className="shrink-0 cursor-pointer">
        {task.completed ? <CheckCircle2 className="w-5 h-5 text-indigo-600" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />}
      </button>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${subjectColor(task.subject, subjectList)}`} />
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-xs sm:text-sm font-bold truncate ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</p>
          {task.category && (
            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${categoryStyle}`}>
              {task.category}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 mt-0.5">
          <span className="font-semibold text-slate-700">{task.subject}</span>
          <span>·</span>
          <span className={`px-2 py-0.2 rounded-md border text-[10px] font-bold ${status.color}`}>
            {status.label}
          </span>
          <span>·</span>
          <span>{task.estHours}h estimated</span>
        </p>
      </div>

      <span className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
      <button onClick={() => onEdit(task)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0 cursor-pointer"><Pencil className="w-4 h-4" /></button>
      <button onClick={() => onDelete(task.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 shrink-0 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
    </li>
  );
}

/* ============================================================================
   TASK MODAL (Add / Edit)
   ========================================================================== */

function TaskModal({ editing, subjectList, onClose, onSave }) {
  const [form, setForm] = useState(() => editing || {
    title: "", subject: "", category: "Assignment", dueDate: toISODate(addDays(new Date(), 3)), dueTime: "18:00", priority: "Medium", estHours: 2,
  });
  const valid = form.title.trim() && form.subject.trim() && form.dueDate;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-display font-bold text-slate-800">{editing ? "Edit Task" : "Add Task / Assignment"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <Field label="Task Title">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Physics Lab Writeup" className="input" />
          </Field>
          
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject">
              <input list="subject-list" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Calculus" className="input" />
              <datalist id="subject-list">{subjectList.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Category">
              <select value={form.category || "Assignment"} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Due Date"><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" /></Field>
            <Field label="Due Time"><input type="time" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} className="input" /></Field>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority Weight">
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input">
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </Field>
            <Field label="Estimated Hours">
              <input type="number" min="0.5" step="0.5" value={form.estHours} onChange={(e) => setForm({ ...form, estHours: Number(e.target.value) })} className="input" />
            </Field>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
          <button
            disabled={!valid}
            onClick={() => onSave(form)}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {editing ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
      <style>{`.input{width:100%;border:1px solid #E2E8F0;border-radius:0.75rem;padding:0.6rem 0.85rem;font-size:0.8125rem;color:#1E293B;background:#F8FAFC;outline:none} .input:focus{border-color:#6366F1;background:white;box-shadow:0 0 0 3px rgba(99,102,241,0.15)}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

/* ============================================================================
   TOPICS & AVAILABILITY VIEW
   ========================================================================== */

function TopicsView({ topics, subjectList, onAdd, onDelete, onToggle, availability, toggleSlot, onApplyPreset }) {
  const [form, setForm] = useState({ name: "", subject: "", difficulty: "Medium" });

  const submit = () => {
    if (!form.name.trim() || !form.subject.trim()) return;
    onAdd(form);
    setForm({ name: "", subject: "", difficulty: "Medium" });
  };

  const totalTopics = topics.length;
  const doneTopics = topics.filter(t => t.completed).length;

  return (
    <div className="space-y-8">
      {/* Topics Section */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold text-slate-800">Study Topic Entry & Revision</h1>
            <p className="text-xs text-slate-500">List core concepts and difficulty ratings for automated revision scheduling.</p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            {doneTopics} of {totalTopics} Topics Mastered
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs p-4 sm:p-5 mb-4">
          <div className="grid sm:grid-cols-[1.5fr_1fr_130px_auto] gap-3 items-end">
            <Field label="Topic / Concept Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fourier Transforms, K-Maps" className="input" /></Field>
            <Field label="Subject"><input list="subject-list-2" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" className="input" />
              <datalist id="subject-list-2">{subjectList.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Difficulty">
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="input">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </Field>
            <button onClick={submit} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 h-[40px] shadow-sm cursor-pointer">
              <Plus className="w-4 h-4" /> Add Topic
            </button>
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState icon={GraduationCap} title="No study topics entered" body="Add difficult or key exam topics so the AI scheduler can automatically dedicate study blocks to them." />
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {topics.map((t) => (
              <li key={t.id} className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs transition-all ${t.completed ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white"}`}>
                <button onClick={() => onToggle(t.id)} className="shrink-0 cursor-pointer">
                  {t.completed ? <CheckCircle2 className="w-5 h-5 text-indigo-600" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs sm:text-sm font-bold truncate ${t.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{t.name}</p>
                  <p className="text-[11px] text-slate-500">{t.subject}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLES[t.difficulty]}`}>{t.difficulty}</span>
                <button onClick={() => onDelete(t.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 shrink-0 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Student Availability Section */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-800">Free Study Availability Grid</h2>
            <p className="text-xs text-slate-500">Paint your weekly free study hours. The AI timetable only schedules self-study blocks in these windows.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => onApplyPreset("morning")} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer">
              🌅 Morning (7-11 AM)
            </button>
            <button onClick={() => onApplyPreset("evening")} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer">
              🌆 Evening (5-9 PM)
            </button>
            <button onClick={() => onApplyPreset("night")} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 cursor-pointer">
              🌙 Night Owl
            </button>
            <button onClick={() => onApplyPreset("weekend")} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer">
              📚 Weekend Intensive
            </button>
            <button onClick={() => onApplyPreset("clear")} className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
              Clear
            </button>
          </div>
        </div>

        <AvailabilityGrid availability={availability} toggleSlot={toggleSlot} />
      </div>
    </div>
  );
}

function AvailabilityGrid({ availability, toggleSlot }) {
  const isDown = useRef(false);
  const dragValue = useRef(true);

  const isOn = (day, hour) => (availability[day] || []).includes(hour);

  const handleDown = (day, hour) => {
    isDown.current = true;
    dragValue.current = !isOn(day, hour);
    toggleSlot(day, hour);
  };
  const handleEnter = (day, hour) => {
    if (!isDown.current) return;
    const currentlyOn = isOn(day, hour);
    if (currentlyOn !== dragValue.current) toggleSlot(day, hour);
  };
  useEffect(() => {
    const up = () => { isDown.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 overflow-x-auto select-none">
      <div className="min-w-[580px]">
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          <div />
          {DAY_KEYS.map((d) => (
            <div key={d} className="text-center text-xs font-bold text-slate-600 pb-2">{d}</div>
          ))}
          {GRID_HOURS.map((h) => (
            <React.Fragment key={h}>
              <div className="text-[11px] text-slate-400 pr-2 py-0.5 text-right leading-4">{fmtTime12(`${pad(h)}:00`)}</div>
              {DAY_KEYS.map((d) => {
                const on = isOn(d, h);
                return (
                  <button
                    key={d + h}
                    onMouseDown={() => handleDown(d, h)}
                    onMouseEnter={() => handleEnter(d, h)}
                    onClick={(e) => e.preventDefault()}
                    className={`m-[2px] h-5 rounded-md border transition-all cursor-pointer ${on ? "bg-indigo-600 border-indigo-600 shadow-2xs" : "bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50"}`}
                    aria-label={`${DAY_LABELS[d]} ${h}:00`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        Click any cell or click and drag across the grid to paint free study hours.
      </p>
    </div>
  );
}

/* ============================================================================
   TIMETABLE HUB (AI Study Schedule + College Routine + Exam Timetable)
   ========================================================================== */

function TimetableView({ 
  timetable, 
  collegeSchedule = [],
  examSchedule = [],
  onSaveClass,
  onDeleteClass,
  onImportBulkClasses,
  onSaveExam,
  onDeleteExam,
  onImportBulkExams,
  onGenerate, 
  generating, 
  toggleBlockDone, 
  lastGenerated, 
  subjectList 
}) {
  const [subTab, setSubTab] = useState("ai_timetable"); // ai_timetable | college_schedule | exam_schedule
  const [mode, setMode] = useState("weekly"); // weekly | daily
  const [dayOffset, setDayOffset] = useState(0);

  const selectedDate = addDays(startOfWeek(new Date()), dayOffset);
  const selectedISO = toISODate(selectedDate);

  const byDay = useMemo(() => {
    const map = {};
    DAY_KEYS.forEach((d, i) => { map[toISODate(addDays(startOfWeek(new Date()), i))] = []; });
    timetable.forEach((b) => { if (map[b.date] !== undefined) map[b.date].push(b); });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.start.localeCompare(b.start)));
    return map;
  }, [timetable]);

  return (
    <div className="space-y-5">
      
      {/* Sub-tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubTab("ai_timetable")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === "ai_timetable"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4" /> AI Study Timetable
          </button>

          <button
            onClick={() => setSubTab("college_schedule")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === "college_schedule"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <School className="w-4 h-4" /> College / School Classes
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${subTab === "college_schedule" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
              {collegeSchedule.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab("exam_schedule")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === "exam_schedule"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Award className="w-4 h-4" /> Exam Schedule
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${subTab === "exam_schedule" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
              {examSchedule.length}
            </span>
          </button>
        </div>

        {/* Generate AI schedule action */}
        <button
          onClick={onGenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer shrink-0"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Generate AI Timetable</span>
        </button>
      </div>

      {/* Sub-View 1: AI Generated Study Timetable */}
      {subTab === "ai_timetable" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-lg sm:text-xl font-bold text-slate-800">Personalized AI Study Schedule</h1>
              {lastGenerated && (
                <p className="text-xs text-slate-500">
                  Optimized for {collegeSchedule.length} classes, {examSchedule.length} exams, and your study goals · {new Date(lastGenerated).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
                <button onClick={() => setMode("daily")} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${mode === "daily" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"}`}>Daily Timeline</button>
                <button onClick={() => setMode("weekly")} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${mode === "weekly" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"}`}>Weekly Grid</button>
              </div>
            </div>
          </div>

          {/* AI Intelligence Info Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-3 text-xs text-indigo-900 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Smart Constraint Solver:</strong> Automatically reserved <strong>{collegeSchedule.length} College lecture slots</strong>, scheduled <strong>dedicated prep sprints for {examSchedule.length} exams</strong>, and spaced 50m study intervals with 10m breaks.
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold shrink-0">
              <span className="flex items-center gap-1 text-blue-700">🏫 Blue: Classes</span>
              <span className="flex items-center gap-1 text-rose-700">🚨 Red: Exams</span>
              <span className="flex items-center gap-1 text-indigo-700">✨ Purple: AI Study</span>
            </div>
          </div>

          {timetable.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <EmptyState
                icon={Sparkles}
                title="No timetable generated yet"
                body="Add your college classes, exam timetable, and free hours, then generate your optimized timetable."
                action={<button onClick={onGenerate} disabled={generating} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 shadow-md cursor-pointer">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate AI Schedule
                </button>}
              />
            </div>
          ) : mode === "daily" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button onClick={() => setDayOffset((d) => Math.max(0, d - 1))} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                <p className="font-display font-bold text-slate-800 text-sm sm:text-base">{fmtDisplayDate(selectedISO)}</p>
                <button onClick={() => setDayOffset((d) => Math.min(6, d + 1))} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <DayColumn blocks={byDay[selectedISO] || []} onToggle={toggleBlockDone} subjectList={subjectList} expanded />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {DAY_KEYS.map((d, i) => {
                const iso = toISODate(addDays(startOfWeek(new Date()), i));
                const isToday = iso === toISODate(new Date());
                return (
                  <div key={d} className={`rounded-2xl border ${isToday ? "border-indigo-400 ring-2 ring-indigo-400/20 bg-indigo-50/20" : "border-slate-200 bg-white"} shadow-2xs p-3 space-y-2`}>
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-700">{DAY_LABELS[d]}</p>
                      {isToday && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-full border border-indigo-200">Today</span>}
                    </div>
                    <DayColumn blocks={byDay[iso] || []} onToggle={toggleBlockDone} subjectList={subjectList} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-View 2: College / School Class Timetable Manager */}
      {subTab === "college_schedule" && (
        <ClassTimetableManager
          classes={collegeSchedule}
          onSaveClass={onSaveClass}
          onDeleteClass={onDeleteClass}
          onImportBulkClasses={onImportBulkClasses}
          subjectList={subjectList}
        />
      )}

      {/* Sub-View 3: Exam Timetable Manager */}
      {subTab === "exam_schedule" && (
        <ExamTimetableManager
          exams={examSchedule}
          onSaveExam={onSaveExam}
          onDeleteExam={onDeleteExam}
          onImportBulkExams={onImportBulkExams}
          subjectList={subjectList}
        />
      )}
    </div>
  );
}

function DayColumn({ blocks, onToggle, subjectList, expanded }) {
  if (blocks.length === 0) return <p className="text-xs text-slate-400 py-6 text-center">No blocks</p>;
  return (
    <ul className="space-y-2">
      {blocks.map((b) => {
        if (b.type === "class") {
          return (
            <li key={b.id} className="rounded-xl border border-blue-200 bg-blue-50/60 p-2.5 text-xs shadow-2xs space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 truncate">{b.assigned.title}</span>
                <span className="text-[9px] font-bold px-1 rounded bg-blue-200/70 text-blue-800">
                  {b.assigned.classType || "Class"}
                </span>
              </div>
              <p className="text-[10px] text-blue-700">{fmtTime12(b.start)}–{fmtTime12(b.end)}</p>
              {b.assigned.room && <p className="text-[9px] text-slate-500">📍 {b.assigned.room}</p>}
            </li>
          );
        }

        if (b.type === "exam") {
          return (
            <li key={b.id} className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs shadow-2xs space-y-0.5 animate-pulse">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 truncate">🚨 {b.assigned.title}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white">
                  EXAM
                </span>
              </div>
              <p className="text-[10px] text-rose-700 font-bold">{fmtTime12(b.start)}–{fmtTime12(b.end)}</p>
              {b.assigned.room && <p className="text-[9px] text-slate-600">📍 {b.assigned.room}</p>}
            </li>
          );
        }

        if (b.type === "break") {
          return (
            <li key={b.id} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 px-2 py-1 bg-slate-50 rounded-lg">
              <Coffee className="w-3 h-3 text-amber-500" /> Break · {fmtTime12(b.start)}–{fmtTime12(b.end)}
            </li>
          );
        }

        if (!b.assigned) {
          return (
            <li key={b.id} className="flex items-center gap-1.5 text-[10px] text-slate-400 px-2 py-1.5 border border-dashed border-slate-200 rounded-lg">
              Free · {fmtTime12(b.start)}–{fmtTime12(b.end)}
            </li>
          );
        }

        return (
          <li key={b.id} className={`rounded-xl border p-2.5 transition-all ${b.completed ? "border-slate-100 bg-slate-50/70" : "border-slate-200 bg-white shadow-2xs hover:border-indigo-200"}`}>
            <div className="flex items-start gap-2">
              <button onClick={() => onToggle(b.id)} className="shrink-0 mt-0.5 cursor-pointer">
                {b.completed ? <CheckCircle2 className="w-4 h-4 text-indigo-600" /> : <Circle className="w-4 h-4 text-slate-300 hover:text-indigo-500" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${b.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{b.assigned.title}</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${subjectColor(b.assigned.subject, subjectList)}`} />
                  <span className="truncate">{b.assigned.subject}</span>
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-1">{fmtTime12(b.start)}–{fmtTime12(b.end)}</p>
              </div>
              {b.assigned.priority && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${PRIORITY_STYLES[b.assigned.priority]}`}>{b.assigned.priority}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
