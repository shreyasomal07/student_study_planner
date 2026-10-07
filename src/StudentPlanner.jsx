import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LayoutDashboard, CheckSquare, BookOpenCheck, CalendarRange, Bell, Plus,
  Sparkles, CheckCircle2, Circle, Clock, Flame, TrendingUp, X, ChevronLeft,
  ChevronRight, ArrowUpDown, GraduationCap, Trash2, Pencil, Loader2,
  AlertTriangle, CalendarClock, Coffee, Target, BarChart3, Edit3, LogOut, User,
  Calendar, Search, Filter, Layers, Sun, Moon, Zap, Tag, Check, Award, School,
  Upload, FileText, MapPin, MoreHorizontal, ChevronDown, RotateCcw, Paperclip,
  Activity, Users, FileSpreadsheet, Settings, MessageSquare, CreditCard, FolderArchive,
  Image as ImageIcon
} from "lucide-react";
import PomodoroTimer from "./components/PomodoroTimer";
import ClassTimetableManager from "./components/ClassTimetableManager";
import ExamTimetableManager from "./components/ExamTimetableManager";
import DashboardNotesAndTodo from "./components/DashboardNotesAndTodo";
import TimetablePhotoViewer from "./components/TimetablePhotoViewer";

/* ============================================================================
   CONSTANTS & THEME TOKENS
   ========================================================================== */

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const DAY_SHORT_LABELS = { Mon: "MONDAY", Tue: "TUESDAY", Wed: "WEDNESDAY", Thu: "THU", Fri: "FRIDAY", Sat: "SATURDAY", Sun: "SUNDAY" };
const GRID_HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 -> 22:00

const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };
const PRIORITY_STYLES = {
  High: "bg-theme-bg text-theme-text border-theme-accent-green",
  Medium: "bg-theme-bg text-theme-accent-blue border-theme-accent-green-light",
  Low: "bg-theme-bg text-theme-accent-blue border-theme-accent-green-light",
};

const CATEGORIES = ["Assignment", "Exam Prep", "Project", "Homework", "Reading / Lab"];

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
function pad(n) { return String(n).padStart(2, "0"); }
function toISODate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfDay(d) { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; }
function startOfWeek(d) {
  const r = startOfDay(d);
  const dow = (r.getDay() + 6) % 7;
  return addDays(r, -dow);
}
function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return new Date(8640000000000000);
  try {
    const cleanDate = typeof dateStr === 'string' && dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const cleanTime = timeStr || "23:59";
    const d = new Date(`${cleanDate}T${cleanTime}:00`);
    if (isNaN(d.getTime())) return new Date(8640000000000000);
    return d;
  } catch (e) {
    return new Date(8640000000000000);
  }
}
function fmtDisplayDate(dateStr) {
  if (!dateStr) return "";
  try {
    const cleanDate = typeof dateStr === 'string' && dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const d = new Date(`${cleanDate}T00:00:00`);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  } catch (e) {
    return String(dateStr);
  }
}
function fmtShortDate(dateStr) {
  if (!dateStr) return "";
  try {
    const cleanDate = typeof dateStr === 'string' && dateStr.includes('T') ? dateStr.split('T')[0] : String(dateStr);
    const parts = cleanDate.split("-");
    if (parts.length >= 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return cleanDate;
  } catch (e) {
    return String(dateStr);
  }
}
function fmtTime12(t) {
  if (!t || typeof t !== 'string') return "";
  try {
    const parts = t.split(":");
    if (parts.length < 2) return t;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (isNaN(h) || isNaN(m)) return t;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad(m)} ${period}`;
  } catch (e) {
    return String(t);
  }
}
function fmtTime24(t) {
  if (!t || typeof t !== 'string') return "";
  return t.slice(0, 5);
}

/* ============================================================================
   INITIAL EMPTY DATA TEMPLATE (Zero Mock Data)
   ========================================================================== */

function buildMockData() {
  return { 
    tasks: [], 
    topics: [], 
    availability: {
      Mon: [17, 18, 19, 20], Tue: [17, 18, 19, 20], Wed: [17, 18, 19, 20],
      Thu: [17, 18, 19, 20], Fri: [17, 18, 19, 20],
      Sat: [10, 11, 12, 13, 14, 15], Sun: [10, 11, 12, 13, 14, 15],
    }, 
    collegeSchedule: [], 
    examSchedule: [], 
    timetable: [], 
    student: { name: "Student", program: "General Studies" } 
  };
}

/* ============================================================================
   AI TIMETABLE GENERATION ALGORITHM
   ========================================================================== */

function buildWeekSlots(availability, weekStart, collegeSchedule = [], examSchedule = []) {
  const slots = [];

  for (let d = 0; d < 7; d++) {
    const date = addDays(weekStart, d);
    const dateISO = toISODate(date);
    const dayKey = DAY_KEYS[d];

    // 1. Overlay College / School Classes
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

    // 2. Overlay Scheduled Exams
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

    // 3. Extract Free Hours
    const hours = [...(availability[dayKey] || [])].sort((a, b) => a - b);
    if (hours.length === 0) continue;

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
  const examItems = (examSchedule || []).map((ex) => ({
    key: `exam-prep-${ex.id}`,
    refId: ex.id,
    type: "exam_prep",
    title: ` Exam Revision: ${ex.subject}`,
    subtitle: ex.title || ex.weightage,
    subject: ex.subject,
    priority: "High",
    category: "Exam Prep",
    room: ex.room || "Main Auditorium",
    attachment: "Syllabus.pdf",
    participants: ["TY", "AB", "MR", "SS", "+3"],
    remainingMin: 250,
    deadline: parseDateTime(ex.date, ex.start),
  }));

  const taskItems = tasks
    .filter((t) => !t.completed)
    .map((t) => ({
      key: `task-${t.id}`,
      refId: t.id,
      type: "task",
      title: t.title,
      subtitle: t.subject,
      subject: t.subject,
      priority: t.priority,
      category: t.category || "Assignment",
      room: "West camp. Room 312",
      participants: ["TY"],
      remainingMin: Math.max(50, Math.round((t.estHours || 2) * 60)),
      deadline: parseDateTime(t.dueDate, t.dueTime),
    }));

  const topicItems = topics
    .filter((t) => !t.completed)
    .map((t) => ({
      key: `topic-${t.id}`,
      refId: t.id,
      type: "topic",
      title: `Topic: ${t.name}`,
      subtitle: t.subject,
      subject: t.subject,
      priority: t.difficulty === "Hard" ? "High" : t.difficulty === "Medium" ? "Medium" : "Low",
      category: "Exam Prep",
      room: "West camp. Conference",
      participants: ["TY", "AB", "SS", "+2"],
      remainingMin: t.difficulty === "Hard" ? 270 : t.difficulty === "Medium" ? 180 : 90,
      deadline: null,
    }));

  return [...examItems, ...taskItems, ...topicItems].sort((a, b) => {
    const ad = a.deadline ? a.deadline.getTime() : Infinity;
    const bd = b.deadline ? b.deadline.getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return (PRIORITY_WEIGHT[b.priority] || 1) - (PRIORITY_WEIGHT[a.priority] || 1);
  });
}

export { buildMockData, startOfWeek, toISODate };

export function generateTimetable(tasks, topics, availability, weekStart, collegeSchedule = [], examSchedule = []) {
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
      subtitle: item.subtitle,
      subject: item.subject,
      priority: item.priority,
      category: item.category,
      room: item.room,
      attachment: item.attachment,
      participants: item.participants,
    };
    item.remainingMin -= 50;
  }
  return slots;
}

/* ============================================================================
   MAIN COMPONENT WITH FULL SLEEK ICON SIDEBAR & SEAMLESS PERSONALIZATION
   ========================================================================== */

export default function StudentPlanner({ 
  userProfile, 
  savedPlannerData, 
  onSavePlannerData, 
  onEditProfile, 
  onDeleteProfile, 
  onSignOut 
}) {
  const [tasks, setTasks] = useState(() => {
    if (savedPlannerData?.tasks && Array.isArray(savedPlannerData.tasks)) return savedPlannerData.tasks;
    if (savedPlannerData && typeof savedPlannerData === 'object') return [];
    if (userProfile) return [];
    return [];
  });
  const [topics, setTopics] = useState(() => {
    if (savedPlannerData?.topics && Array.isArray(savedPlannerData.topics)) return savedPlannerData.topics;
    if (savedPlannerData && typeof savedPlannerData === 'object') return [];
    if (userProfile) return [];
    return [];
  });
  const [availability, setAvailability] = useState(() => {
    if (savedPlannerData?.availability && typeof savedPlannerData.availability === 'object') return savedPlannerData.availability;
    return {
      Mon: [17, 18, 19, 20], Tue: [17, 18, 19, 20], Wed: [17, 18, 19, 20],
      Thu: [17, 18, 19, 20], Fri: [17, 18, 19, 20],
      Sat: [10, 11, 12, 13, 14, 15], Sun: [10, 11, 12, 13, 14, 15],
    };
  });
  const [collegeSchedule, setCollegeSchedule] = useState(() => {
    if (savedPlannerData?.collegeSchedule && Array.isArray(savedPlannerData.collegeSchedule)) return savedPlannerData.collegeSchedule;
    return [];
  });
  const [examSchedule, setExamSchedule] = useState(() => {
    if (savedPlannerData?.examSchedule && Array.isArray(savedPlannerData.examSchedule)) return savedPlannerData.examSchedule;
    return [];
  });
  const [events, setEvents] = useState(() => {
    if (savedPlannerData?.events && Array.isArray(savedPlannerData.events)) return savedPlannerData.events;
    return [];
  });
  const [timetable, setTimetable] = useState(() => {
    if (savedPlannerData?.timetable && Array.isArray(savedPlannerData.timetable)) return savedPlannerData.timetable;
    const initialTasks = savedPlannerData?.tasks || [];
    const initialTopics = savedPlannerData?.topics || [];
    const initialAvail = savedPlannerData?.availability || {
      Mon: [17, 18, 19, 20], Tue: [17, 18, 19, 20], Wed: [17, 18, 19, 20],
      Thu: [17, 18, 19, 20], Fri: [17, 18, 19, 20],
      Sat: [10, 11, 12, 13, 14, 15], Sun: [10, 11, 12, 13, 14, 15],
    };
    const initialClasses = savedPlannerData?.collegeSchedule || [];
    const initialExams = savedPlannerData?.examSchedule || [];

    if (initialTasks.length === 0 && initialTopics.length === 0 && initialClasses.length === 0 && initialExams.length === 0) {
      return [];
    }

    return generateTimetable(initialTasks, initialTopics, initialAvail, startOfWeek(new Date()), initialClasses, initialExams);
  });
  const [lastGenerated, setLastGenerated] = useState(() => {
    return savedPlannerData?.lastGenerated || new Date().toISOString();
  });
  const [studentState, setStudentState] = useState({ name: "Student", program: "Academic Studies" });

  const [dashboardTodos, setDashboardTodos] = useState(() => {
    if (savedPlannerData?.dashboardTodos && Array.isArray(savedPlannerData.dashboardTodos)) {
      return savedPlannerData.dashboardTodos;
    }
    return [
      { id: "td-1", text: "Review lecture slides and summary notes for next class", completed: false, priority: "High", tag: "Revision", createdAt: new Date().toISOString() },
      { id: "td-2", text: "Organize assignment references and draft outline", completed: false, priority: "Medium", tag: "Assignment", createdAt: new Date().toISOString() },
      { id: "td-3", text: "Set up 25-minute Pomodoro study sprint for today", completed: true, priority: "Low", tag: "Quick Task", createdAt: new Date().toISOString() }
    ];
  });

  const [dashboardNotes, setDashboardNotes] = useState(() => {
    if (savedPlannerData?.dashboardNotes && Array.isArray(savedPlannerData.dashboardNotes)) {
      return savedPlannerData.dashboardNotes;
    }
    return [
      {
        id: "nt-1",
        title: " Quick Study Rule",
        content: "Pomodoro Focus: 25 mins deep study + 5 mins break. Active recall beats re-reading.",
        color: "yellow",
        tag: "Study Tip",
        isPinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "nt-2",
        title: "📌 Portal & Datesheet Check",
        content: "Check college LMS portal every Monday for updated syllabus and submission links.",
        color: "purple",
        tag: "Reminder",
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  });

  const [dashboardScratchpad, setDashboardScratchpad] = useState(() => {
    return savedPlannerData?.dashboardScratchpad || "";
  });

  const [timetablePhoto, setTimetablePhoto] = useState(() => {
    return savedPlannerData?.timetablePhoto || null;
  });

  const [timetableSubTab, setTimetableSubTab] = useState(() => {
    return savedPlannerData?.timetablePhoto ? "photo" : "grid";
  });

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
        if (course && year) programStr = `${course} (${year})`;
        else if (course) programStr = course;
        else if (year) programStr = year;
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

  const [view, setView] = useState("dashboard"); // default landing page as requested
  const [now, setNow] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [taskModal, setTaskModal] = useState({ open: false, editing: null });
  const [generating, setGenerating] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState("");
  const [searchFilterScope, setSearchFilterScope] = useState("all");
  const [scheduleTimeframe, setScheduleTimeframe] = useState("Week"); // Today | Week | Month

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
          events,
          timetable,
          lastGenerated,
          dashboardTodos,
          dashboardNotes,
          dashboardScratchpad,
          timetablePhoto
        });
      }
    }, 300);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [tasks, topics, availability, collegeSchedule, examSchedule, events, timetable, lastGenerated, dashboardTodos, dashboardNotes, dashboardScratchpad, timetablePhoto]);

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
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  /* ---- 15-Second Auto-Removal Timers for Completed Checklist Items (Silent 15s Delay) ---- */
  const taskRemovalTimers = useRef({});
  const topicRemovalTimers = useRef({});
  const blockRemovalTimers = useRef({});
  const eventRemovalTimers = useRef({});

  // Cleanup active timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(taskRemovalTimers.current).forEach(clearTimeout);
      Object.values(topicRemovalTimers.current).forEach(clearTimeout);
      Object.values(blockRemovalTimers.current).forEach(clearTimeout);
      Object.values(eventRemovalTimers.current).forEach(clearTimeout);
    };
  }, []);

  const deleteEvent = useCallback((id) => {
    if (eventRemovalTimers.current[id]) {
      clearTimeout(eventRemovalTimers.current[id]);
      delete eventRemovalTimers.current[id];
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleEvent = useCallback((id) => {
    setEvents((prev) => {
      const target = prev.find((e) => e.id === id);
      if (!target) return prev;
      const willComplete = !target.completed;

      if (willComplete) {
        // Start 15-second removal timer silently
        if (eventRemovalTimers.current[id]) {
          clearTimeout(eventRemovalTimers.current[id]);
        }
        eventRemovalTimers.current[id] = setTimeout(() => {
          deleteEvent(id);
        }, 15000);

        return prev.map((e) => (e.id === id ? { ...e, completed: true } : e));
      } else {
        // Unchecking: Cancel 15-second removal timer
        if (eventRemovalTimers.current[id]) {
          clearTimeout(eventRemovalTimers.current[id]);
          delete eventRemovalTimers.current[id];
        }
        return prev.map((e) => (e.id === id ? { ...e, completed: false } : e));
      }
    });
  }, [deleteEvent]);

  const saveEvent = useCallback((eventData) => {
    if (eventData.id) {
      setEvents((prev) => prev.map((e) => (e.id === eventData.id ? { ...e, ...eventData } : e)));
    } else {
      setEvents((prev) => [{ ...eventData, id: uid(), completed: false }, ...prev]);
    }
  }, []);

  const deleteTask = useCallback((id) => {
    if (taskRemovalTimers.current[id]) {
      clearTimeout(taskRemovalTimers.current[id]);
      delete taskRemovalTimers.current[id];
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const willComplete = !target.completed;

      if (willComplete) {
        // Start 15-second removal timer silently
        if (taskRemovalTimers.current[id]) {
          clearTimeout(taskRemovalTimers.current[id]);
        }
        taskRemovalTimers.current[id] = setTimeout(() => {
          deleteTask(id);
        }, 15000);

        return prev.map((t) => (t.id === id ? { ...t, completed: true } : t));
      } else {
        // Unchecking: Cancel 15-second removal timer
        if (taskRemovalTimers.current[id]) {
          clearTimeout(taskRemovalTimers.current[id]);
          delete taskRemovalTimers.current[id];
        }
        return prev.map((t) => (t.id === id ? { ...t, completed: false } : t));
      }
    });
  }, [deleteTask]);

  const saveTask = useCallback((taskData) => {
    if (taskData.id) {
      setTasks((prev) => prev.map((t) => (t.id === taskData.id ? { ...t, ...taskData } : t)));
    } else {
      setTasks((prev) => [{ ...taskData, id: uid(), completed: false, sessionsDone: 0, totalSessions: taskData.totalSessions || 4 }, ...prev]);
    }
  }, []);

  const addTopic = useCallback((topicData) => {
    setTopics((prev) => [...prev, { ...topicData, id: uid(), completed: false, sessionsDone: 0, totalSessions: topicData.totalSessions || 4 }]);
  }, []);

  const deleteTopic = useCallback((id) => {
    if (topicRemovalTimers.current[id]) {
      clearTimeout(topicRemovalTimers.current[id]);
      delete topicRemovalTimers.current[id];
    }
    setTopics((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTopic = useCallback((id) => {
    setTopics((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const willComplete = !target.completed;

      if (willComplete) {
        // Start 15-second removal timer silently
        if (topicRemovalTimers.current[id]) {
          clearTimeout(topicRemovalTimers.current[id]);
        }
        topicRemovalTimers.current[id] = setTimeout(() => {
          deleteTopic(id);
        }, 15000);

        return prev.map((t) => (t.id === id ? { ...t, completed: true } : t));
      } else {
        // Unchecking: Cancel 15-second removal timer
        if (topicRemovalTimers.current[id]) {
          clearTimeout(topicRemovalTimers.current[id]);
          delete topicRemovalTimers.current[id];
        }
        return prev.map((t) => (t.id === id ? { ...t, completed: false } : t));
      }
    });
  }, [deleteTopic]);

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
    setTimetable((prev) => {
      const target = prev.find((b) => b.id === blockId);
      if (!target) return prev;
      const willComplete = !target.completed;

      if (willComplete) {
        // Start 15-second removal timer silently
        if (blockRemovalTimers.current[blockId]) {
          clearTimeout(blockRemovalTimers.current[blockId]);
        }
        blockRemovalTimers.current[blockId] = setTimeout(() => {
          setTimetable((curr) => curr.filter((b) => b.id !== blockId));
          delete blockRemovalTimers.current[blockId];
        }, 15000);

        return prev.map((b) => (b.id === blockId ? { ...b, completed: true } : b));
      } else {
        // Unchecking: Cancel 15-second removal timer
        if (blockRemovalTimers.current[blockId]) {
          clearTimeout(blockRemovalTimers.current[blockId]);
          delete blockRemovalTimers.current[blockId];
        }
        return prev.map((b) => (b.id === blockId ? { ...b, completed: false } : b));
      }
    });
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

  /* ---- Dashboard To-Do Handlers ---- */
  const handleAddDashboardTodo = useCallback((newTodo) => {
    setDashboardTodos(prev => [newTodo, ...prev]);
  }, []);

  const handleToggleDashboardTodo = useCallback((id) => {
    setDashboardTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  const handleDeleteDashboardTodo = useCallback((id) => {
    setDashboardTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleClearCompletedDashboardTodos = useCallback(() => {
    setDashboardTodos(prev => prev.filter(t => !t.completed));
  }, []);

  /* ---- Dashboard Notes Handlers ---- */
  const handleAddDashboardNote = useCallback((newNote) => {
    setDashboardNotes(prev => [newNote, ...prev]);
  }, []);

  const handleUpdateDashboardNote = useCallback((id, updatedFields) => {
    setDashboardNotes(prev => prev.map(n => n.id === id ? { ...n, ...updatedFields } : n));
  }, []);

  const handleDeleteDashboardNote = useCallback((id) => {
    setDashboardNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const handlePinDashboardNote = useCallback((id) => {
    setDashboardNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  }, []);

  const handleUpdateDashboardScratchpad = useCallback((text) => {
    setDashboardScratchpad(text);
  }, []);

  /* ---- Computed metrics ---- */
  const alerts = useMemo(() => {
    const list = [];
    const in48h = addDays(now, 2);
    
    (examSchedule || []).forEach((ex) => {
      const examDate = parseDateTime(ex.date, ex.start);
      if (examDate >= now && examDate <= addDays(now, 4)) {
        list.push({ id: `ex-${ex.id}`, kind: "exam", title: `🚨 EXAM: ${ex.subject} (${ex.title || ex.weightage})`, subject: ex.subject, dueDate: ex.date, dueTime: ex.start });
      }
    });

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

    return { totalTasks, completedTasks, in48h, hoursStudied, completionRate, studyBlocksCount: studyBlocks.length, completedBlocks };
  }, [tasks, alerts, timetable]);

  const upNext = useMemo(() => {
    const todayISO = toISODate(now);
    const nowHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const nextBlock = timetable.find((b) => b.date === todayISO && !b.completed && b.end >= nowHHMM && b.assigned);
    if (nextBlock) return { kind: "block", block: nextBlock };

    const upcomingTask = [...tasks]
      .filter((t) => !t.completed)
      .sort((a, b) => parseDateTime(a.dueDate, a.dueTime) - parseDateTime(b.dueDate, b.dueTime))[0];
    if (upcomingTask) return { kind: "task", task: upcomingTask };

    return null;
  }, [now, timetable, tasks]);

  const currentHour = now.getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const studentName = student?.name || 'Student';

  return (
    <div className="w-full bg-theme-bg rounded-[34px] sm:rounded-[38px] p-4 sm:p-6 lg:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-theme-border flex flex-col gap-4 sm:gap-6 min-h-[94vh]">
      
      {/* ----------------- GLOBAL TOP HEADER: GREETING & PROFILE ----------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme-border/80">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display font-black text-xl sm:text-2xl text-theme-text tracking-tight">
              {timeGreeting}, {studentName}! 👋
            </h1>
            {student.summaryTag && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#B4C6A6] text-theme-accent-green text-[10px] font-black tracking-wide shadow-2xs">
                {student.summaryTag}
              </span>
            )}
          </div>
          <p className="text-xs text-theme-text font-medium">
            {student.courseName ? `Here's your academic workspace for ${student.courseName}. ` : student.program ? `Here's your academic workspace for ${student.program}. ` : ''}
            Manage your routines, exams, study sprint focus, and AI timetables.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="px-3.5 py-1.5 rounded-full bg-theme-card/80 border border-theme-border shadow-2xs text-xs font-bold text-theme-text flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-theme-accent-blue" />
            <span>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <button
            onClick={onEditProfile}
            className="px-3.5 py-1.5 rounded-full bg-theme-card hover:bg-theme-bg border border-theme-border text-xs font-bold text-theme-text shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Edit Profile"
          >
            <Pencil className="w-3 h-3 text-theme-text" />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>
          <button
            onClick={onSignOut}
            className="w-8.5 h-8.5 rounded-full bg-theme-card hover:bg-theme-card border border-theme-border text-theme-muted hover:text-theme-accent-blue shadow-2xs flex items-center justify-center cursor-pointer transition-all"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ----------------- GLOBAL SINGLE LINE ACADEMIC MODULES TASKBAR ----------------- */}
      <div className="bg-theme-card rounded-[26px] p-2 sm:p-2.5 shadow-xs border border-theme-border overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 min-w-[720px] lg:min-w-0">
          {/* 1. Dashboard Tab */}
          <button
            onClick={() => setView("dashboard")}
            className={`group p-2.5 rounded-2xl transition-all text-left cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
              view === "dashboard"
                ? "bg-[#B4C6A6] text-theme-text border border-[#B4C6A6]"
                : "bg-theme-bg hover:bg-[#B4C6A6] border border-theme-border"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                view === "dashboard"
                  ? "bg-theme-accent-green text-theme-text"
                  : "bg-[#B4C6A6] group-hover:bg-theme-accent-green text-theme-accent-green group-hover:text-theme-text"
              }`}>
                <LayoutDashboard className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className={`font-display font-extrabold text-xs truncate transition-all ${
                  view === "dashboard" ? "text-theme-text" : "text-theme-text group-hover:text-theme-text"
                }`}>
                  Dashboard
                </h4>
                <p className={`text-[9.5px] truncate transition-all ${
                  view === "dashboard" ? "text-theme-muted" : "text-theme-text group-hover:text-theme-muted"
                }`}>
                  Overview
                </p>
              </div>
            </div>
            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 transition-all ${
              view === "dashboard"
                ? "bg-theme-card/20 text-theme-text"
                : "bg-theme-card group-hover:bg-theme-card/20 text-theme-text group-hover:text-theme-text"
            }`}>
              Home
            </span>
          </button>

          {/* 2. Weekly Timetable */}
          <button
            onClick={() => setView("timetable")}
            className={`group p-2.5 rounded-2xl transition-all text-left cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
              view === "timetable"
                ? "bg-[#B4C6A6] text-theme-text border border-[#B4C6A6]"
                : "bg-theme-bg hover:bg-[#B4C6A6] border border-theme-border"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                view === "timetable"
                  ? "bg-theme-accent-green text-theme-text"
                  : "bg-[#B4C6A6] group-hover:bg-theme-accent-green text-theme-accent-green group-hover:text-theme-text"
              }`}>
                <CalendarRange className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className={`font-display font-extrabold text-xs truncate transition-all ${
                  view === "timetable" ? "text-theme-text" : "text-theme-text group-hover:text-theme-text"
                }`}>
                  Timetable
                </h4>
                <p className={`text-[9.5px] truncate transition-all ${
                  view === "timetable" ? "text-theme-muted" : "text-theme-text group-hover:text-theme-muted"
                }`}>
                  Weekly Plan
                </p>
              </div>
            </div>
            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 transition-all ${
              view === "timetable"
                ? "bg-theme-card/20 text-theme-text"
                : "bg-theme-card group-hover:bg-theme-card/20 text-theme-text group-hover:text-theme-text"
            }`}>
              AI
            </span>
          </button>

          {/* 3. Tasks & Assignments */}
          <button
            onClick={() => setView("tasks")}
            className={`group p-2.5 rounded-2xl transition-all text-left cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
              view === "tasks"
                ? "bg-[#B4C6A6] text-theme-text border border-[#B4C6A6]"
                : "bg-theme-bg hover:bg-[#B4C6A6] border border-theme-border"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                view === "tasks"
                  ? "bg-theme-accent-green text-theme-text"
                  : "bg-[#B4C6A6] group-hover:bg-theme-accent-green text-theme-accent-green group-hover:text-theme-text"
              }`}>
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className={`font-display font-extrabold text-xs truncate transition-all ${
                  view === "tasks" ? "text-theme-text" : "text-theme-text group-hover:text-theme-text"
                }`}>
                  Tasks
                </h4>
                <p className={`text-[9.5px] truncate transition-all ${
                  view === "tasks" ? "text-theme-muted" : "text-theme-text group-hover:text-theme-muted"
                }`}>
                  Assignments
                </p>
              </div>
            </div>
            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 transition-all ${
              view === "tasks"
                ? "bg-theme-card/20 text-theme-text"
                : "bg-theme-card group-hover:bg-theme-card/20 text-theme-text group-hover:text-theme-text"
            }`}>
              {tasks.length}
            </span>
          </button>

          {/* 4. College Timetable */}
          <button
            onClick={() => setView("classes")}
            className={`group p-2.5 rounded-2xl transition-all text-left cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
              view === "classes"
                ? "bg-[#B4C6A6] text-theme-text border border-[#B4C6A6]"
                : "bg-theme-bg hover:bg-[#B4C6A6] border border-theme-border"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                view === "classes"
                  ? "bg-theme-accent-green text-theme-text"
                  : "bg-[#B4C6A6] group-hover:bg-theme-accent-green text-theme-accent-green group-hover:text-theme-text"
              }`}>
                <School className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className={`font-display font-extrabold text-xs truncate transition-all ${
                  view === "classes" ? "text-theme-text" : "text-theme-text group-hover:text-theme-text"
                }`}>
                  Classes
                </h4>
                <p className={`text-[9.5px] truncate transition-all ${
                  view === "classes" ? "text-theme-muted" : "text-theme-text group-hover:text-theme-muted"
                }`}>
                  Routine
                </p>
              </div>
            </div>
            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 transition-all ${
              view === "classes"
                ? "bg-theme-card/20 text-theme-text"
                : "bg-theme-card group-hover:bg-theme-card/20 text-theme-text group-hover:text-theme-text"
            }`}>
              {collegeSchedule.length}
            </span>
          </button>

          {/* 5. Exam Schedule */}
          <button
            onClick={() => setView("exams")}
            className={`group p-2.5 rounded-2xl transition-all text-left cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
              view === "exams"
                ? "bg-[#B4C6A6] text-theme-text border border-[#B4C6A6]"
                : "bg-theme-bg hover:bg-[#B4C6A6] border border-theme-border"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                view === "exams"
                  ? "bg-theme-accent-green text-theme-text"
                  : "bg-[#B4C6A6] group-hover:bg-theme-accent-green text-theme-accent-green group-hover:text-theme-text"
              }`}>
                <Award className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className={`font-display font-extrabold text-xs truncate transition-all ${
                  view === "exams" ? "text-theme-text" : "text-theme-text group-hover:text-theme-text"
                }`}>
                  Exams
                </h4>
                <p className={`text-[9.5px] truncate transition-all ${
                  view === "exams" ? "text-theme-muted" : "text-theme-text group-hover:text-theme-muted"
                }`}>
                  Datesheets
                </p>
              </div>
            </div>
            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 transition-all ${
              view === "exams"
                ? "bg-theme-card/20 text-theme-text"
                : "bg-theme-card group-hover:bg-theme-card/20 text-theme-text group-hover:text-theme-text"
            }`}>
              {examSchedule.length}
            </span>
          </button>

          {/* 6. Focus Pomodoro Timer */}
          <button
            onClick={() => setView("pomodoro")}
            className={`group p-2.5 rounded-2xl transition-all text-left cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
              view === "pomodoro"
                ? "bg-[#B4C6A6] text-theme-text border border-[#B4C6A6]"
                : "bg-theme-bg hover:bg-[#B4C6A6] border border-theme-border"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                view === "pomodoro"
                  ? "bg-theme-accent-green text-theme-text"
                  : "bg-[#B4C6A6] group-hover:bg-theme-accent-green text-theme-accent-green group-hover:text-theme-text"
              }`}>
                <Target className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className={`font-display font-extrabold text-xs truncate transition-all ${
                  view === "pomodoro" ? "text-theme-text" : "text-theme-text group-hover:text-theme-text"
                }`}>
                  Focus Mode
                </h4>
                <p className={`text-[9.5px] truncate transition-all ${
                  view === "pomodoro" ? "text-theme-muted" : "text-theme-text group-hover:text-theme-muted"
                }`}>
                  Pomodoro
                </p>
              </div>
            </div>
            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 transition-all ${
              view === "pomodoro"
                ? "bg-theme-card/20 text-theme-text"
                : "bg-theme-card group-hover:bg-theme-card/20 text-theme-text group-hover:text-theme-text"
            }`}>
              Timer
            </span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT CANVAS */}
      <main className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
        
        {/* ----------------- SCHEDULE / TIMETABLE VIEW ----------------- */}
        {view === "timetable" && (
          <div className="space-y-4 flex-1 flex flex-col min-w-0">
            
            {/* Top Toolbar for Schedule */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-theme-border/60">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base sm:text-lg text-theme-text tracking-tight">
                    Weekly Timetable
                  </span>
                  <div className="text-xs font-normal text-theme-text bg-theme-card/80 px-3 py-1 rounded-full border border-theme-border flex items-center gap-1.5 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-theme-accent-blue" />
                    <span>{fmtDisplayDate(toISODate(weekStart))} – {fmtDisplayDate(toISODate(weekEnd))}</span>
                  </div>
                </div>

                {/* Subtle weekly summary chips matching dashboard palette */}
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-[11px] font-normal text-theme-text bg-theme-accent-green-light/80 border border-theme-accent-green-light px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-theme-accent-blue" />
                    {timetable.filter(b => b.type === "study").length} Study Sessions
                  </span>
                  <span className="text-[11px] font-normal text-theme-text bg-theme-bg/80 border border-theme-accent-green px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-theme-accent-blue" />
                    {timetable.filter(b => b.type === "class").length} Classes
                  </span>
                  {timetable.some(b => b.type === "exam") && (
                    <span className="text-[11px] font-normal text-theme-text bg-theme-bg/80 border border-theme-accent-green px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B4C6A6]" />
                      {timetable.filter(b => b.type === "exam").length} Exams
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-3.5 py-1.5 rounded-full bg-theme-card border border-theme-border hover:bg-theme-bg text-xs font-medium text-theme-text shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Regenerate Plan"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-theme-accent-blue ${generating ? "animate-spin" : ""}`} />
                  <span>{generating ? "Building..." : "Regenerate"}</span>
                </button>

                <button
                  onClick={() => setTaskModal({ open: true, editing: null })}
                  className="bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-text px-4 py-1.5 rounded-full font-medium text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-theme-accent-green" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* 7 Columns Timetable Grid */}
            <div className="flex-1 overflow-x-auto pb-3">
              <div className="grid grid-cols-7 gap-3 min-w-[1020px]">
                {DAY_KEYS.map((d, i) => {
                  const colDate = addDays(weekStart, i);
                  const colDateISO = toISODate(colDate);
                  const isToday = colDateISO === toISODate(now);
                  const dayBlocks = timetable.filter(b => b.date === colDateISO);
                  const activeBlocks = dayBlocks.filter(b => b.type !== "break");

                  return (
                    <div 
                      key={d} 
                      className={`rounded-[24px] p-2.5 space-y-2 flex flex-col transition-all ${
                        isToday 
                          ? "bg-theme-card/90 border-2 border-theme-accent-green/80 shadow-xs" 
                          : "bg-theme-card/45 hover:bg-theme-card/60 border border-theme-border"
                      }`}
                    >
                      {/* Column Header */}
                      <div className={`p-2.5 rounded-[18px] transition-all ${
                        isToday 
                          ? "bg-theme-bg border border-theme-accent-green-light shadow-2xs" 
                          : "bg-theme-card/80 border border-theme-border"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-theme-text">
                            <span className="hidden sm:inline">{DAY_LABELS[d]}</span>
                            <span className="sm:hidden">{d}</span>
                          </span>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors ${
                            isToday 
                              ? "bg-theme-accent-green text-theme-text shadow-2xs" 
                              : "bg-theme-bg text-theme-text"
                          }`}>
                            {colDate.getDate()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] font-normal">
                          <span className="text-theme-muted">
                            {activeBlocks.length === 0 ? "Rest Day" : `${activeBlocks.length} ${activeBlocks.length === 1 ? 'item' : 'items'}`}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-medium text-theme-text bg-theme-accent-green-light px-1.5 py-0.2 rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Day Event Cards */}
                      <div className="space-y-2 flex-1">
                        {dayBlocks.length === 0 ? (
                          <div className="h-36 rounded-[18px] bg-theme-card/30 border border-dashed border-theme-border p-4 text-center flex flex-col items-center justify-center gap-1.5 text-theme-muted">
                            <Coffee className="w-5 h-5 text-theme-muted" />
                            <span className="text-[11px] font-normal text-theme-muted">Rest Day</span>
                            <span className="text-[9.5px] text-theme-muted">No sessions scheduled</span>
                          </div>
                        ) : (
                          dayBlocks.map((b) => (
                            <ScheduleCardItem 
                              key={b.id} 
                              block={b} 
                              onToggle={() => toggleBlockDone(b.id)} 
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ----------------- DASHBOARD VIEW ----------------- */}
        {view === "dashboard" && (
          <DashboardView
            view={view}
            stats={stats}
            upNext={upNext}
            timetable={timetable}
            now={now}
            weekStart={weekStart}
            tasks={tasks}
            topics={topics}
            student={student}
            subjectList={subjectList}
            onGenerate={handleGenerate}
            generating={generating}
            toggleBlockDone={toggleBlockDone}
            toggleTask={toggleTask}
            toggleTopic={toggleTopic}
            setView={setView}
            onAddTask={() => setTaskModal({ open: true, editing: null })}
            onEditProfile={onEditProfile}
            onSignOut={onSignOut}
            collegeSchedule={collegeSchedule}
            examSchedule={examSchedule}
            events={events}
            onSaveEvent={saveEvent}
            onDeleteEvent={deleteEvent}
            onToggleEvent={toggleEvent}
            dashboardTodos={dashboardTodos}
            onAddDashboardTodo={handleAddDashboardTodo}
            onToggleDashboardTodo={handleToggleDashboardTodo}
            onDeleteDashboardTodo={handleDeleteDashboardTodo}
            onClearCompletedDashboardTodos={handleClearCompletedDashboardTodos}
            dashboardNotes={dashboardNotes}
            onAddDashboardNote={handleAddDashboardNote}
            onUpdateDashboardNote={handleUpdateDashboardNote}
            onDeleteDashboardNote={handleDeleteDashboardNote}
            onPinDashboardNote={handlePinDashboardNote}
            dashboardScratchpad={dashboardScratchpad}
            onUpdateDashboardScratchpad={handleUpdateDashboardScratchpad}
          />
        )}

        {/* ----------------- TASKS VIEW ----------------- */}
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

        {/* ----------------- TOPICS VIEW ----------------- */}
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

        {/* ----------------- CLASSES MANAGER VIEW ----------------- */}
        {view === "classes" && (
          <ClassTimetableManager
            classes={collegeSchedule}
            onSaveClass={handleSaveClass}
            onDeleteClass={handleDeleteClass}
            onImportBulkClasses={handleImportBulkClasses}
            subjectList={subjectList}
            timetablePhoto={timetablePhoto}
            onSaveTimetablePhoto={setTimetablePhoto}
            onRemoveTimetablePhoto={() => setTimetablePhoto(null)}
          />
        )}

        {/* ----------------- EXAMS MANAGER VIEW ----------------- */}
        {view === "exams" && (
          <ExamTimetableManager
            exams={examSchedule}
            onSaveExam={handleSaveExam}
            onDeleteExam={handleDeleteExam}
            onImportBulkExams={handleImportBulkExams}
            subjectList={subjectList}
          />
        )}

        {/* ----------------- POMODORO TIMER VIEW ----------------- */}
        {view === "pomodoro" && (
          <div className="flex-1 min-w-0 overflow-y-auto">
            <PomodoroTimer 
              tasks={tasks}
              topics={topics}
              student={student}
              onSessionComplete={(mins) => {
                console.log(`Focus session of ${mins} mins finished!`);
              }}
            />
          </div>
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

      {/* Notifications Drawer */}
      {notifOpen && (
        <NotificationDrawer alerts={alerts} onClose={() => setNotifOpen(false)} setView={setView} />
      )}

    </div>
  );
}

/* ============================================================================
   SCHEDULE CARD ITEM (Matching Exact Colors & Layout from Reference)
   ========================================================================== */

/* ============================================================================
   SCHEDULE CARD ITEM (Matching Dashboard Palette & Soft Approachable Aesthetics)
   ========================================================================== */

const SUBJECT_THEMES = {
  EDC: {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green-light",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-bg",
    tagText: "text-theme-text",
    accent: "#3B82F6",
    dot: "bg-theme-accent-blue",
    lightText: "text-theme-accent-blue"
  },
  ECA: {
    bg: "bg-theme-bg",
    border: "border-theme-border",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-bg",
    tagText: "text-theme-text",
    accent: "#9333EA",
    dot: "bg-[#B4C6A6]",
    lightText: "text-theme-text"
  },
  Calculus: {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green-light",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-accent-green-light",
    tagText: "text-theme-text",
    accent: "#D97706",
    dot: "bg-theme-accent-blue",
    lightText: "text-theme-text"
  },
  Physics: {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-bg",
    tagText: "text-theme-text",
    accent: "#E11D48",
    dot: "bg-[#B4C6A6]",
    lightText: "text-theme-text"
  },
  "Data Structures": {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green-light",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-accent-green-light",
    tagText: "text-theme-text",
    accent: "#0D9488",
    dot: "bg-theme-accent-blue",
    lightText: "text-theme-accent-blue"
  },
  Marketing: {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green-light",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-bg",
    tagText: "text-theme-text",
    accent: "#16A34A",
    dot: "bg-theme-accent-blue",
    lightText: "text-theme-text"
  }
};

const FALLBACK_PALETTES = [
  {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green-light",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-bg",
    tagText: "text-theme-text",
    accent: "#3B82F6",
    dot: "bg-theme-accent-blue"
  },
  {
    bg: "bg-theme-bg",
    border: "border-theme-border",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-bg",
    tagText: "text-theme-text",
    accent: "#9333EA",
    dot: "bg-[#B4C6A6]"
  },
  {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green-light",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-accent-green-light",
    tagText: "text-theme-text",
    accent: "#D97706",
    dot: "bg-theme-accent-blue"
  },
  {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-bg",
    tagText: "text-theme-text",
    accent: "#E11D48",
    dot: "bg-[#B4C6A6]"
  },
  {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green-light",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-bg",
    tagText: "text-theme-text",
    accent: "#16A34A",
    dot: "bg-theme-accent-blue"
  },
  {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green",
    hoverBorder: "hover:border-theme-accent-blue",
    tagBg: "bg-theme-accent-green-light",
    tagText: "text-theme-text",
    accent: "#EA580C",
    dot: "bg-theme-accent-blue"
  },
  {
    bg: "bg-theme-bg",
    border: "border-theme-accent-green-light",
    hoverBorder: "hover:border-theme-accent-green",
    tagBg: "bg-theme-accent-green-light",
    tagText: "text-theme-text",
    accent: "#0D9488",
    dot: "bg-theme-accent-blue"
  }
];

function getSubjectTheme(subject) {
  if (!subject) return FALLBACK_PALETTES[2];
  if (SUBJECT_THEMES[subject]) return SUBJECT_THEMES[subject];
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_PALETTES[Math.abs(hash) % FALLBACK_PALETTES.length];
}

function ScheduleCardItem({ block, onToggle }) {
  // Break row - Clean, slim, cozy pill divider
  if (block.type === "break") {
    return (
      <div className="py-0.5 px-2.5 my-0.5 rounded-full bg-theme-bg/80 border border-theme-border text-[9.5px] font-normal text-theme-accent-blue flex items-center justify-center gap-1.5 shadow-2xs hover:bg-theme-bg transition-colors whitespace-nowrap">
        <Coffee className="w-2.5 h-2.5 text-theme-accent-blue/80 shrink-0" />
        <span>Break · {fmtTime12(block.start)}–{fmtTime12(block.end)}</span>
      </div>
    );
  }

  // Class (Lecture / Lab / Tutorial) - Harmonious Sky Blue
  if (block.type === "class") {
    const classType = block.assigned?.classType || "Lecture";
    const subject = block.assigned?.subject || "College";
    return (
      <div className="p-2.5 rounded-[18px] bg-theme-bg text-theme-text border border-theme-accent-green-light shadow-2xs space-y-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs">
        <div className="flex items-center justify-between gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-theme-bg text-theme-text">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B4C6A6]" />
            <span className="truncate max-w-[80px]">{subject}</span>
          </span>
          <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-md bg-theme-card/80 border border-theme-accent-green text-theme-text shrink-0">
            {classType}
          </span>
        </div>
        <p className="text-[12px] font-medium text-theme-text leading-snug line-clamp-2">
          {block.assigned?.title}
        </p>
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-theme-accent-green/50 text-[10px] font-normal text-theme-accent-blue">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 shrink-0" />
            {fmtTime12(block.start)}–{fmtTime12(block.end)}
          </span>
          <span className="flex items-center gap-1 text-theme-text truncate">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            <span>{block.assigned?.room || "Room 101"}</span>
          </span>
        </div>
      </div>
    );
  }

  // Exam - Harmonious Coral / Rose
  if (block.type === "exam") {
    const subject = block.assigned?.subject || "Exam";
    return (
      <div className="p-2.5 rounded-[18px] bg-theme-bg text-theme-text border border-theme-accent-green shadow-2xs space-y-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs">
        <div className="flex items-center justify-between gap-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-theme-bg text-theme-text">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B4C6A6]" />
            <span className="truncate max-w-[80px]">{subject}</span>
          </span>
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-[#B4C6A6] text-theme-text shrink-0">
            EXAM
          </span>
        </div>
        <p className="text-[12px] font-medium text-theme-text leading-snug line-clamp-2">
          {block.assigned?.title}
        </p>
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-theme-accent-green/60 text-[10px] font-normal text-theme-text">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 shrink-0" />
            {fmtTime12(block.start)}–{fmtTime12(block.end)}
          </span>
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            <span>{block.assigned?.room || "Exam Hall"}</span>
          </span>
        </div>
      </div>
    );
  }

  // Regular Study / Tasks / Topics
  const isExamPrep = block.type === "exam_prep" || block.assigned?.itemType === "exam_prep";
  const isTopic = block.assigned?.itemType === "topic";
  const subject = block.assigned?.subject || "General";
  const theme = getSubjectTheme(subject);
  
  // Clean up title: remove redundant "Topic: " prefix if present for clean readability
  const rawTitle = block.assigned?.title || "Study Session";
  const displayTitle = rawTitle.replace(/^Topic:\s*/i, "");

  return (
    <div className={`p-2.5 rounded-[18px] border transition-all duration-150 ${
      block.completed
        ? "bg-theme-bg/80 border-theme-border opacity-60"
        : `${theme.bg} ${theme.border} ${theme.hoverBorder} shadow-2xs hover:-translate-y-0.5 hover:shadow-xs`
    } space-y-1.5`}>
      {/* Top Header: Subject Badge + Type Tag */}
      <div className="flex items-center justify-between gap-1">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium ${theme.tagBg} ${theme.tagText}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
          <span className="truncate max-w-[85px]">{subject}</span>
        </span>

        {isExamPrep ? (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-theme-accent-green-light text-theme-text shrink-0">
             Prep
          </span>
        ) : isTopic ? (
          <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-md bg-theme-card/80 text-theme-text border border-[#B4C6A6]/[0.04] shrink-0">
            Topic
          </span>
        ) : (
          <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-md bg-theme-card/80 text-theme-text border border-[#B4C6A6]/[0.04] shrink-0">
            Task
          </span>
        )}
      </div>

      {/* Card Content with Completion Toggle */}
      <div className="flex items-start gap-1.5">
        <button
          onClick={onToggle}
          className="mt-0.5 text-theme-muted hover:text-theme-text transition-colors cursor-pointer shrink-0"
          title={block.completed ? "Mark incomplete" : "Mark complete"}
        >
          {block.completed ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-theme-accent-blue" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-theme-muted hover:text-theme-text" />
          )}
        </button>
        <p className={`text-[12px] font-medium leading-snug line-clamp-2 ${
          block.completed ? "line-through text-theme-muted" : "text-theme-text"
        }`}>
          {displayTitle}
        </p>
      </div>

      {/* Card Footer: Time & Duration */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#B4C6A6]/[0.04] text-[10px] font-normal text-theme-text">
        <div className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-theme-muted shrink-0" />
          <span>{fmtTime12(block.start)}–{fmtTime12(block.end)}</span>
        </div>
        <span className="text-[9.5px] text-theme-muted">50m</span>
      </div>
    </div>
  );
}

/* ============================================================================
   ACADEMIC CALENDAR COMPONENT (Exams, Quizzes, Assignments, Routine, Events)
   ========================================================================== */

function cleanISODate(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (trimmed.includes('T')) return trimmed.split('T')[0];
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  }
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return `${dateVal.getFullYear()}-${pad(dateVal.getMonth() + 1)}-${pad(dateVal.getDate())}`;
  }
  return '';
}

function AcademicCalendar({ 
  now, 
  tasks = [], 
  timetable = [], 
  collegeSchedule = [], 
  examSchedule = [],
  events = [],
  onSaveEvent,
  onDeleteEvent,
  onToggleEvent,
  toggleTask,
  toggleBlockDone,
  onAddTask,
  setView
}) {
  const [calendarViewMode, setCalendarViewMode] = useState('grid'); // 'grid' | 'agenda'
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDateISO, setSelectedDateISO] = useState(() => toISODate(now));
  const [filterType, setFilterType] = useState('all'); // 'all' | 'exam' | 'task' | 'event'
  const [eventModal, setEventModal] = useState({ open: false, editing: null, defaultDate: '' });

  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateISO(toISODate(today));
  };

  // Calendar math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayDow = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  // Aggregate events for any ISO date
  const getEventsForDate = useCallback((isoStr) => {
    const list = [];

    // 1. Scheduled Exams / Quizzes (from examSchedule)
    (examSchedule || []).forEach(ex => {
      const exISO = cleanISODate(ex.date);
      if (exISO === isoStr) {
        const isQuiz = (ex.type || '').toLowerCase().includes('quiz') || (ex.title || '').toLowerCase().includes('quiz') || (ex.weightage || '').toLowerCase().includes('quiz');
        list.push({
          id: `ex-${ex.id}`,
          type: 'exam',
          isQuiz,
          categoryLabel: isQuiz ? 'Quiz / Test' : (ex.weightage || ex.type || 'Exam'),
          title: ex.title || `${ex.subject} ${isQuiz ? 'Quiz' : 'Exam'}`,
          subject: ex.subject,
          date: exISO,
          time: ex.start ? `${fmtTime12(ex.start)}${ex.end ? ` - ${fmtTime12(ex.end)}` : ''}` : 'Scheduled Exam',
          venue: ex.room || ex.venue || 'Main Exam Hall',
          weightage: ex.weightage || ex.type || (isQuiz ? 'Quiz' : 'Exam'),
          syllabus: ex.syllabus || '',
          raw: ex
        });
      }
    });

    // 2. Tasks / Assignments / Quizzes (from tasks)
    (tasks || []).forEach(t => {
      const taskISO = cleanISODate(t.dueDate);
      if (taskISO === isoStr) {
        const isQuiz = (t.category || '').toLowerCase().includes('quiz') || (t.title || '').toLowerCase().includes('quiz');
        list.push({
          id: `task-${t.id}`,
          type: 'task',
          isQuiz,
          categoryLabel: t.category || (isQuiz ? 'Quiz' : 'Assignment'),
          title: t.title,
          subject: t.subject,
          date: taskISO,
          priority: t.priority || 'Medium',
          category: t.category || 'Assignment',
          time: t.dueTime ? `Due ${fmtTime12(t.dueTime)}` : 'Due Today',
          completed: Boolean(t.completed),
          raw: t
        });
      }
    });

    // 3. Custom Events (Hackathons, Fests, Club Meets, Workshops, etc.)
    (events || []).forEach(ev => {
      const evISO = cleanISODate(ev.date);
      if (evISO === isoStr) {
        let timeStr = 'All Day / Scheduled';
        if (ev.startTime) {
          timeStr = ev.endTime ? `${fmtTime12(ev.startTime)} - ${fmtTime12(ev.endTime)}` : fmtTime12(ev.startTime);
        } else if (ev.time) {
          timeStr = ev.time;
        }

        list.push({
          id: `event-${ev.id}`,
          type: 'event',
          categoryLabel: ev.category || 'Event',
          title: ev.title,
          date: evISO,
          time: timeStr,
          venue: ev.venue || '',
          description: ev.description || '',
          completed: Boolean(ev.completed),
          category: ev.category || 'Event',
          raw: ev
        });
      }
    });

    return list;
  }, [examSchedule, tasks, events]);

  // Map of date ISO to event counts/types for calendar grid indicators
  const monthEventMap = useMemo(() => {
    const map = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
      const evts = getEventsForDate(iso);
      if (evts.length > 0) {
        map[day] = {
          iso,
          count: evts.length,
          hasExam: evts.some(e => e.type === 'exam'),
          hasTask: evts.some(e => e.type === 'task'),
          hasEvent: evts.some(e => e.type === 'event'),
          events: evts
        };
      }
    }
    return map;
  }, [currentYear, currentMonth, daysInMonth, getEventsForDate]);

  // Selected date events
  const selectedEvents = useMemo(() => {
    if (!selectedDateISO) return [];
    const all = getEventsForDate(selectedDateISO);
    if (filterType === 'all') return all;
    return all.filter(e => e.type === filterType);
  }, [selectedDateISO, filterType, getEventsForDate]);

  // All upcoming user items (Exams, Quizzes, Tasks, Assignments, Events) sorted chronologically
  const allUpcomingItems = useMemo(() => {
    const items = [];
    const todayStr = toISODate(now);

    // Exams & Quizzes
    (examSchedule || []).forEach(ex => {
      const iso = cleanISODate(ex.date);
      if (iso && iso >= todayStr) {
        const isQuiz = (ex.type || '').toLowerCase().includes('quiz') || (ex.title || '').toLowerCase().includes('quiz');
        items.push({
          id: `up-ex-${ex.id}`,
          type: 'exam',
          isQuiz,
          title: ex.title || `${ex.subject} ${isQuiz ? 'Quiz' : 'Exam'}`,
          subject: ex.subject,
          date: iso,
          time: ex.start ? fmtTime12(ex.start) : 'All Day',
          venue: ex.room || ex.venue || 'Exam Hall',
          badge: isQuiz ? 'Quiz / Test' : (ex.weightage || ex.type || 'Exam'),
          syllabus: ex.syllabus || '',
          raw: ex
        });
      }
    });

    // Tasks & Assignments
    (tasks || []).forEach(t => {
      const iso = cleanISODate(t.dueDate);
      if (iso && iso >= todayStr) {
        const isQuiz = (t.category || '').toLowerCase().includes('quiz') || (t.title || '').toLowerCase().includes('quiz');
        items.push({
          id: `up-t-${t.id}`,
          type: 'task',
          isQuiz,
          title: t.title,
          subject: t.subject,
          date: iso,
          time: t.dueTime ? fmtTime12(t.dueTime) : 'Due End of Day',
          priority: t.priority || 'Medium',
          category: t.category || 'Assignment',
          badge: t.category || 'Assignment',
          completed: Boolean(t.completed),
          raw: t
        });
      }
    });

    // Custom Events
    (events || []).forEach(ev => {
      const iso = cleanISODate(ev.date);
      if (iso && iso >= todayStr) {
        let timeStr = 'All Day';
        if (ev.startTime) {
          timeStr = ev.endTime ? `${fmtTime12(ev.startTime)} - ${fmtTime12(ev.endTime)}` : fmtTime12(ev.startTime);
        } else if (ev.time) {
          timeStr = ev.time;
        }

        items.push({
          id: `up-ev-${ev.id}`,
          type: 'event',
          title: ev.title,
          subject: ev.venue ? `📍 ${ev.venue}` : (ev.category || 'Event'),
          date: iso,
          time: timeStr,
          badge: ev.category || 'Event',
          venue: ev.venue || '',
          description: ev.description || '',
          completed: Boolean(ev.completed),
          raw: ev
        });
      }
    });

    return items.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [examSchedule, tasks, events, now]);

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDateISO) return '';
    const d = new Date(`${selectedDateISO}T00:00:00`);
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }, [selectedDateISO]);

  const todayISO = toISODate(now);

  const getRelativeDaysLabel = (targetISO) => {
    if (!targetISO) return '';
    if (targetISO === todayISO) return 'Today';
    const dToday = new Date(`${todayISO}T00:00:00`);
    const dTarget = new Date(`${targetISO}T00:00:00`);
    const diffDays = Math.round((dTarget - dToday) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays > 7 && diffDays <= 14) return 'Next week';
    return fmtDisplayDate(targetISO);
  };

  return (
    <div className="bg-[#B4C6A6] text-theme-text rounded-[34px] p-5 sm:p-6 shadow-xl border border-[#B4C6A6] flex flex-col justify-between space-y-4">
      {/* Calendar Top Header with View Switcher & Add Event */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#B4C6A6]">
          <div>
            <h3 className="font-display font-extrabold text-theme-text text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-theme-accent-green" />
              Academic Calendar & Events
            </h3>
            <p className="text-[11px] text-theme-muted">Exams, quizzes, assignments & custom event schedules</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Add Event Button */}
            <button
              onClick={() => setEventModal({ open: true, editing: null, defaultDate: selectedDateISO || toISODate(now) })}
              className="px-2.5 py-1 rounded-full bg-theme-accent-blue hover:bg-[#B4C6A6] text-theme-text text-[10px] font-black shadow-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Add New Event"
            >
              <Plus className="w-3 h-3" />
              <span>Add Event</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#B4C6A6] rounded-full p-0.5">
              <button
                onClick={() => setCalendarViewMode('grid')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  calendarViewMode === 'grid' ? 'bg-theme-accent-green text-theme-text shadow-xs' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                Calendar Grid
              </button>
              <button
                onClick={() => setCalendarViewMode('agenda')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  calendarViewMode === 'agenda' ? 'bg-theme-accent-green text-theme-text shadow-xs' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                All Upcoming ({allUpcomingItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* MONTHLY CALENDAR GRID MODE */}
        {calendarViewMode === 'grid' && (
          <div>
            {/* Month & Jump Controls */}
            <div className="flex items-center justify-between mt-3 mb-2 px-1">
              <span className="font-display font-extrabold text-xs text-theme-accent-green tracking-wide">
                {currentMonthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleJumpToday}
                  className="px-2 py-0.5 rounded-full bg-[#B4C6A6] hover:bg-[#B4C6A6] text-[9px] font-bold text-theme-text transition-all cursor-pointer"
                >
                  Today
                </button>
                <button
                  onClick={handlePrevMonth}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#B4C6A6] text-theme-muted hover:text-theme-text transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#B4C6A6] text-theme-muted hover:text-theme-text transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-theme-text mb-1">
              <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Leading empty days */}
              {Array.from({ length: firstDayDow }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-8 sm:h-9 rounded-xl opacity-0" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const iso = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
                const isToday = iso === todayISO;
                const isSelected = iso === selectedDateISO;
                const dayMeta = monthEventMap[dayNum];

                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDateISO(iso)}
                    className={`relative h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-theme-accent-green text-theme-text font-black shadow-md scale-105 z-10"
                        : isToday
                        ? "bg-[#B4C6A6] text-theme-accent-green font-black border border-theme-accent-green/40"
                        : dayMeta
                        ? "bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-text font-bold"
                        : "text-theme-muted hover:bg-[#B4C6A6] hover:text-theme-text"
                    }`}
                  >
                    <span className="text-[11px] leading-none">{dayNum}</span>
                    
                    {/* Event Indicator Dots */}
                    {dayMeta && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {dayMeta.hasExam && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#B4C6A6]" : "bg-theme-accent-blue"}`} title="Exam / Quiz" />
                        )}
                        {dayMeta.hasTask && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#B4C6A6]" : "bg-theme-accent-green"}`} title="Assignment / Task" />
                        )}
                        {dayMeta.hasEvent && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#B4C6A6]" : "bg-theme-accent-blue"}`} title="Event" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#B4C6A6] text-[9px] sm:text-[10px] text-theme-muted flex-wrap gap-1.5">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-theme-accent-blue" /> Exams & Quizzes</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-theme-accent-green" /> Assignments</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-theme-accent-blue" /> Events</span>
            </div>
          </div>
        )}
      </div>

      {/* SELECTED DATE DETAILS (In Grid Mode) */}
      {calendarViewMode === 'grid' && (
        <div className="bg-[#B4C6A6] rounded-2xl p-3.5 border border-[#B4C6A6] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-display font-extrabold text-xs text-theme-text flex items-center gap-1.5">
                <span>{selectedDateFormatted}</span>
                {selectedDateISO === todayISO && (
                  <span className="px-1.5 py-0.2 rounded bg-theme-accent-green text-theme-text text-[9px] font-black uppercase">Today</span>
                )}
              </h4>
              <p className="text-[10px] text-theme-muted">
                {selectedEvents.length} scheduled item{selectedEvents.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-[9px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'exam', label: 'Exams' },
                { id: 'task', label: 'Tasks' },
                { id: 'event', label: 'Events' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                    filterType === f.id
                      ? 'bg-theme-accent-green text-theme-text'
                      : 'bg-[#B4C6A6] text-theme-muted hover:text-theme-text'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event Items List */}
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {selectedEvents.length === 0 ? (
              <div className="py-5 px-3 rounded-xl bg-[#B4C6A6] border border-dashed border-[#B4C6A6] text-center flex flex-col items-center justify-center gap-1 text-theme-muted">
                <CheckCircle2 className="w-5 h-5 text-theme-text" />
                <p className="text-xs font-bold text-theme-text">No Items on this Date</p>
                <p className="text-[10px] text-theme-muted">No exams, homework deadlines, or custom events scheduled.</p>
              </div>
            ) : (
              selectedEvents.map(evt => {
                if (evt.type === 'exam') {
                  return (
                    <div key={evt.id} className="p-2.5 rounded-xl bg-[#B4C6A6] border border-theme-accent-blue/40 flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-theme-accent-blue text-theme-text text-[9px] font-black uppercase">
                            🚨 {evt.weightage}
                          </span>
                          <span className="text-xs font-black text-theme-text truncate">{evt.title}</span>
                        </div>
                        <p className="text-[10px] text-theme-accent-green font-semibold">{evt.subject} · {evt.time}</p>
                        {evt.venue && <p className="text-[9px] text-theme-accent-blue">📍 {evt.venue}</p>}
                        {evt.syllabus && <p className="text-[9px] text-theme-accent-green/80 italic truncate">Syllabus: {evt.syllabus}</p>}
                      </div>
                      <button
                        onClick={() => setView('exams')}
                        className="px-2 py-0.5 rounded-lg bg-theme-accent-blue/20 hover:bg-theme-accent-blue/40 text-theme-accent-green text-[9px] font-bold shrink-0 transition-all cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  );
                }

                if (evt.type === 'task') {
                  return (
                    <div key={evt.id} className="p-2.5 rounded-xl bg-[#B4C6A6] border border-theme-accent-green/30 flex items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            evt.priority === 'High' ? 'bg-[#B4C6A6] text-theme-text' : evt.priority === 'Medium' ? 'bg-theme-accent-blue text-theme-text' : 'bg-theme-accent-blue text-theme-text'
                          }`}>
                            {evt.priority}
                          </span>
                          <span className={`text-xs font-bold truncate ${evt.completed ? 'line-through text-theme-muted' : 'text-theme-text'}`}>
                            {evt.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-theme-accent-green font-medium">{evt.subject} · {evt.time} · {evt.category}</p>
                      </div>
                      <button
                        onClick={() => toggleTask && toggleTask(evt.raw.id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-accent-green shrink-0 cursor-pointer"
                        title={evt.completed ? "Mark Incomplete" : "Mark Done"}
                      >
                        {evt.completed ? <CheckCircle2 className="w-4 h-4 text-theme-accent-green" /> : <Circle className="w-4 h-4 text-theme-text" />}
                      </button>
                    </div>
                  );
                }

                if (evt.type === 'event') {
                  return (
                    <div key={evt.id} className="p-2.5 rounded-xl bg-[#B4C6A6] border border-theme-accent-blue/35 flex items-start justify-between gap-2 transition-all">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-[#B4C6A6] text-theme-text text-[9px] font-black uppercase">
                            {evt.categoryLabel}
                          </span>
                          <span className={`text-xs font-bold truncate ${evt.completed ? 'line-through text-theme-muted' : 'text-theme-text'}`}>
                            {evt.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-theme-accent-green font-medium">
                          {evt.time}{evt.venue ? ` · 📍 ${evt.venue}` : ''}
                        </p>
                        {evt.description && (
                          <p className="text-[9px] text-theme-accent-green/80 italic truncate">{evt.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => setEventModal({ open: true, editing: evt.raw, defaultDate: evt.date })}
                          className="w-6 h-6 rounded-lg bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-accent-green hover:text-theme-text flex items-center justify-center text-[10px] transition-all cursor-pointer"
                          title="Edit Event"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent && onDeleteEvent(evt.raw.id)}
                          className="w-6 h-6 rounded-lg bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-accent-green hover:text-theme-text flex items-center justify-center text-[10px] transition-all cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onToggleEvent && onToggleEvent(evt.raw.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-accent-blue cursor-pointer"
                          title={evt.completed ? "Mark Incomplete" : "Mark Done"}
                        >
                          {evt.completed ? <CheckCircle2 className="w-4 h-4 text-theme-accent-blue" /> : <Circle className="w-4 h-4 text-theme-text" />}
                        </button>
                      </div>
                    </div>
                  );
                }

                return null;
              })
            )}
          </div>
        </div>
      )}

      {/* ALL UPCOMING AGENDA VIEW (When Agenda tab selected) */}
      {calendarViewMode === 'agenda' && (
        <div className="bg-[#B4C6A6] rounded-2xl p-4 border border-[#B4C6A6] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-extrabold text-xs text-theme-text flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-theme-accent-green" />
              Chronological Upcoming Deadlines, Milestones & Events
            </h4>
            <span className="text-[10px] text-theme-muted font-semibold">{allUpcomingItems.length} Total</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {allUpcomingItems.length === 0 ? (
              <div className="py-8 px-4 rounded-xl bg-[#B4C6A6] border border-dashed border-[#B4C6A6] text-center flex flex-col items-center justify-center gap-1.5 text-theme-muted">
                <CheckCircle2 className="w-6 h-6 text-theme-text" />
                <p className="text-xs font-bold text-theme-text">No Upcoming Items in Your Planner</p>
                <p className="text-[11px] text-theme-muted">Add exams, assignments, or events to automatically view them here.</p>
              </div>
            ) : (
              allUpcomingItems.map(item => {
                const relativeLabel = getRelativeDaysLabel(item.date);
                const isExam = item.type === 'exam';
                const isEvent = item.type === 'event';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isExam
                        ? 'bg-[#B4C6A6] border-theme-accent-blue/40'
                        : isEvent
                        ? 'bg-[#B4C6A6] border-theme-accent-blue/35'
                        : item.completed
                        ? 'bg-[#B4C6A6] border-[#B4C6A6] opacity-60'
                        : 'bg-[#B4C6A6] border-theme-accent-green/30'
                    } flex items-center justify-between gap-3`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          isExam ? 'bg-theme-accent-blue text-theme-text' : isEvent ? 'bg-[#B4C6A6] text-theme-text' : item.isQuiz ? 'bg-theme-accent-blue text-theme-text' : 'bg-theme-accent-green text-theme-text'
                        }`}>
                          {isExam ? `🚨 ${item.badge}` : isEvent ? `${item.badge}` : item.isQuiz ? ` ${item.badge}` : `📝 ${item.badge}`}
                        </span>

                        <span className={`text-xs font-bold truncate ${item.completed ? 'line-through text-theme-muted' : 'text-theme-text'}`}>
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-theme-muted flex-wrap">
                        {item.subject && <span className="font-semibold text-theme-text">{item.subject}</span>}
                        {item.subject && <span>•</span>}
                        <span className="text-theme-accent-green font-medium">{fmtDisplayDate(item.date)} ({item.time})</span>
                        {item.venue && (
                          <>
                            <span>•</span>
                            <span className="text-theme-accent-green">📍 {item.venue}</span>
                          </>
                        )}
                        {item.description && (
                          <>
                            <span>•</span>
                            <span className="italic text-theme-muted truncate">{item.description}</span>
                          </>
                        )}
                        {item.syllabus && (
                          <>
                            <span>•</span>
                            <span className="italic text-theme-muted truncate">Syllabus: {item.syllabus}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        relativeLabel === 'Today' ? 'bg-[#B4C6A6] text-theme-text animate-pulse' :
                        relativeLabel === 'Tomorrow' ? 'bg-theme-accent-blue text-theme-text' : 'bg-[#B4C6A6] text-theme-muted'
                      }`}>
                        {relativeLabel}
                      </span>

                      {isEvent && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEventModal({ open: true, editing: item.raw, defaultDate: item.date })}
                            className="w-6 h-6 rounded-lg bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-accent-green hover:text-theme-text flex items-center justify-center text-[10px] transition-all cursor-pointer"
                            title="Edit Event"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent && onDeleteEvent(item.raw.id)}
                            className="w-6 h-6 rounded-lg bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-accent-green hover:text-theme-text flex items-center justify-center text-[10px] transition-all cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onToggleEvent && onToggleEvent(item.raw.id)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-accent-blue cursor-pointer"
                            title={item.completed ? "Mark Incomplete" : "Mark Done"}
                          >
                            {item.completed ? <CheckCircle2 className="w-4 h-4 text-theme-accent-blue" /> : <Circle className="w-4 h-4 text-theme-text" />}
                          </button>
                        </div>
                      )}

                      {item.type === 'task' && (
                        <button
                          onClick={() => toggleTask && toggleTask(item.raw.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-accent-green cursor-pointer"
                          title={item.completed ? "Mark Incomplete" : "Mark Done"}
                        >
                          {item.completed ? <CheckCircle2 className="w-5 h-5 text-theme-accent-green" /> : <Circle className="w-5 h-5 text-theme-text" />}
                        </button>
                      )}

                      {isExam && (
                        <button
                          onClick={() => setView('exams')}
                          className="px-2.5 py-1 rounded-lg bg-theme-accent-blue/20 hover:bg-theme-accent-blue/40 text-theme-accent-green text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Exam View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Event Modal for Adding & Editing Events */}
      {eventModal.open && (
        <EventModal
          editing={eventModal.editing}
          defaultDate={eventModal.defaultDate}
          onClose={() => setEventModal({ open: false, editing: null, defaultDate: '' })}
          onSave={(evData) => {
            if (onSaveEvent) onSaveEvent(evData);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================================
   REUSED DASHBOARD VIEW
   ========================================================================== */

function DashboardView({ 
  view = "dashboard",
  stats, 
  upNext, 
  timetable, 
  now, 
  weekStart, 
  tasks, 
  topics,
  student,
  subjectList, 
  onGenerate, 
  generating, 
  toggleBlockDone, 
  toggleTask, 
  toggleTopic, 
  setView, 
  onAddTask, 
  onEditProfile, 
  onSignOut,
  collegeSchedule = [], 
  examSchedule = [],
  events = [],
  onSaveEvent,
  onDeleteEvent,
  onToggleEvent,
  dashboardTodos = [],
  onAddDashboardTodo,
  onToggleDashboardTodo,
  onDeleteDashboardTodo,
  onClearCompletedDashboardTodos,
  dashboardNotes = [],
  onAddDashboardNote,
  onUpdateDashboardNote,
  onDeleteDashboardNote,
  onPinDashboardNote,
  dashboardScratchpad = "",
  onUpdateDashboardScratchpad
}) {
  const currentHour = now.getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const studentName = student?.name || 'Student';

  // Compute upcoming priority alerts (exams within next 7 days or overdue/due soon tasks)
  const upcomingAlerts = useMemo(() => {
    const list = [];
    const in7days = addDays(now, 7);

    (examSchedule || []).forEach(ex => {
      const exDate = new Date(`${ex.date}T${ex.start || '00:00'}:00`);
      if (exDate >= now && exDate <= in7days) {
        list.push({
          id: `alert-ex-${ex.id}`,
          kind: 'exam',
          title: `Exam: ${ex.subject} (${ex.title || ex.weightage || 'Exam'})`,
          date: ex.date,
          time: ex.start ? fmtTime12(ex.start) : '',
          raw: ex
        });
      }
    });

    tasks.filter(t => !t.completed && t.dueDate).forEach(t => {
      const dueDate = parseDateTime(t.dueDate, t.dueTime);
      if (dueDate <= addDays(now, 3)) {
        list.push({
          id: `alert-task-${t.id}`,
          kind: 'task',
          title: `${t.title} (${t.subject})`,
          date: t.dueDate,
          priority: t.priority,
          time: t.dueTime ? fmtTime12(t.dueTime) : '',
          raw: t
        });
      }
    });

    return list.slice(0, 3);
  }, [examSchedule, tasks, now]);

  return (
    <div className="space-y-6">
      {/* Main Dashboard Canvas: Upcoming Alerts & Academic Calendar */}
      <div className="space-y-4">
        {upcomingAlerts.length > 0 && (
          <div className="bg-theme-card rounded-[28px] p-4 sm:p-5 shadow-xs border border-theme-border space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xs text-theme-text flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-theme-text" />
                Upcoming Next 7 Days
              </h3>
              <span className="text-[10px] font-bold text-theme-muted">{upcomingAlerts.length} Critical Items</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {upcomingAlerts.map(alt => (
                <div key={alt.id} className="p-2.5 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-theme-text truncate">{alt.title}</p>
                    <p className="text-[10px] text-theme-muted font-medium">{fmtDisplayDate(alt.date)} {alt.time ? `· ${alt.time}` : ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                    alt.kind === 'exam' ? 'bg-theme-bg text-theme-text' : 'bg-theme-accent-green-light text-theme-accent-blue'
                  }`}>
                    {alt.kind === 'exam' ? 'Exam' : 'Due Soon'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Daily To-Do List & Quick Notes / Scratchpad Section */}
        <DashboardNotesAndTodo
          todos={dashboardTodos}
          onAddTodo={onAddDashboardTodo}
          onToggleTodo={onToggleDashboardTodo}
          onDeleteTodo={onDeleteDashboardTodo}
          onClearCompletedTodos={onClearCompletedDashboardTodos}
          notes={dashboardNotes}
          onAddNote={onAddDashboardNote}
          onUpdateNote={onUpdateDashboardNote}
          onDeleteNote={onDeleteDashboardNote}
          onPinNote={onPinDashboardNote}
          scratchpad={dashboardScratchpad}
          onUpdateScratchpad={onUpdateDashboardScratchpad}
        />

        <AcademicCalendar
          now={now}
          tasks={tasks}
          timetable={timetable}
          collegeSchedule={collegeSchedule}
          examSchedule={examSchedule}
          events={events}
          onSaveEvent={onSaveEvent}
          onDeleteEvent={onDeleteEvent}
          onToggleEvent={onToggleEvent}
          toggleTask={toggleTask}
          toggleBlockDone={toggleBlockDone}
          setView={setView}
        />
      </div>
    </div>
  );
}

/* ============================================================================
   TASKS & TOPICS & MODAL SUB-COMPONENTS
   ========================================================================== */

function TasksView({ tasks, subjectList, onAdd, onEdit, onDelete, onToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const subjects = useMemo(() => {
    const set = new Set(tasks.map(t => t.subject).filter(Boolean));
    return Array.from(set);
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter(t => !t.completed && t.priority === "High").length;
    const totalEstHours = tasks.filter(t => !t.completed).reduce((acc, t) => acc + (Number(t.estHours) || 2), 0);
    return { total, completed, pending, highPriority, totalEstHours };
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = (t.title || "").toLowerCase().includes(q) || (t.subject || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (selectedFilter === "pending" && t.completed) return false;
      if (selectedFilter === "completed" && !t.completed) return false;
      if (selectedFilter === "high" && (t.completed || t.priority !== "High")) return false;
      if (selectedSubject !== "all" && t.subject !== selectedSubject) return false;
      return true;
    });
  }, [tasks, searchQuery, selectedFilter, selectedSubject]);

  return (
    <div className="space-y-4 w-full">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-theme-border/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-medium text-lg sm:text-xl text-theme-text tracking-tight">Assignments & Tasks</h2>
            <span className="text-xs font-normal text-theme-text bg-theme-card/80 px-2.5 py-0.5 rounded-full border border-theme-border shadow-2xs">
              {stats.pending} pending · {stats.completed} done
            </span>
          </div>
          <p className="text-xs text-theme-text font-normal">
            Track your homework, projects, and upcoming assignment deadlines
          </p>
        </div>

        <button
          onClick={onAdd}
          className="bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-text px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-theme-accent-green" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Summary KPI Badges (Matching Dashboard Hero/Pill scheme) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-[20px] bg-theme-bg border border-theme-accent-green-light shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-theme-accent-green-light text-theme-accent-blue flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-normal text-theme-text uppercase tracking-wider">Pending</p>
            <p className="text-sm font-medium text-theme-text">{stats.pending} tasks</p>
          </div>
        </div>

        <div className="p-3 rounded-[20px] bg-theme-bg border border-theme-accent-green shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-text flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-normal text-theme-text uppercase tracking-wider">High Priority</p>
            <p className="text-sm font-medium text-theme-text">{stats.highPriority} urgent</p>
          </div>
        </div>

        <div className="p-3 rounded-[20px] bg-theme-bg border border-theme-accent-green-light shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-text flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-normal text-theme-text uppercase tracking-wider">Est. Workload</p>
            <p className="text-sm font-medium text-theme-text">{stats.totalEstHours.toFixed(1)} hrs</p>
          </div>
        </div>

        <div className="p-3 rounded-[20px] bg-theme-bg border border-theme-accent-green-light shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-accent-blue flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-normal text-theme-text uppercase tracking-wider">Completed</p>
            <p className="text-sm font-medium text-theme-text">{stats.completed} finished</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2.5 rounded-[22px] bg-theme-card/70 border border-theme-border shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments or subjects..."
            className="w-full bg-theme-bg border border-theme-border rounded-full pl-8.5 pr-3 py-1.5 text-xs text-theme-text placeholder-[#A8A29E] focus:outline-none focus:border-[#B4C6A6]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "high", label: "Urgent" },
            { id: "completed", label: "Done" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedFilter === tab.id
                  ? "bg-[#B4C6A6] text-theme-accent-green shadow-xs"
                  : "bg-theme-card hover:bg-theme-bg text-theme-text border border-theme-border"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {subjects.length > 0 && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-theme-card hover:bg-theme-bg border border-theme-border text-theme-text rounded-full px-3 py-1 text-xs font-medium cursor-pointer focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-12 px-4 rounded-[26px] bg-theme-card/40 border border-dashed border-theme-border text-center flex flex-col items-center justify-center gap-2 text-theme-muted">
            <CheckSquare className="w-8 h-8 text-theme-muted" />
            <p className="text-xs font-medium text-theme-text">No tasks found</p>
            <p className="text-[11px] text-theme-muted">Try changing your search or filter, or click "Add Task" to create one.</p>
          </div>
        ) : (
          filtered.map((t) => {
            const theme = getSubjectTheme(t.subject);
            const isPriorityHigh = t.priority === "High";

            return (
              <div
                key={t.id}
                className={`p-3.5 sm:p-4 rounded-[22px] border transition-all duration-150 ${
                  t.completed
                    ? "bg-theme-bg/80 border-theme-border opacity-60"
                    : `${theme.bg} ${theme.border} ${theme.hoverBorder} shadow-2xs hover:-translate-y-0.5 hover:shadow-xs`
                } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => onToggle(t.id)}
                    className="mt-0.5 sm:mt-0 text-theme-muted hover:text-theme-text transition-colors cursor-pointer shrink-0"
                    title={t.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {t.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-theme-accent-blue" />
                    ) : (
                      <Circle className="w-5 h-5 text-theme-muted hover:text-theme-text" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${theme.tagBg} ${theme.tagText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                        <span>{t.subject || "General"}</span>
                      </span>

                      {t.category && (
                        <span className="text-[9.5px] font-normal px-2 py-0.5 rounded-full bg-theme-card/80 text-theme-text border border-[#B4C6A6]/[0.04]">
                          {t.category}
                        </span>
                      )}

                      {isPriorityHigh && (
                        <span className="text-[9.5px] font-medium px-2 py-0.2 rounded-full bg-theme-bg text-theme-text flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" /> High Priority
                        </span>
                      )}
                    </div>

                    <p className={`text-xs sm:text-sm font-medium leading-snug ${
                      t.completed ? "line-through text-theme-muted" : "text-theme-text"
                    }`}>
                      {t.title}
                    </p>

                    <div className="flex items-center gap-3 text-[10.5px] font-normal text-theme-text flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-theme-muted" />
                        <span>Due {fmtDisplayDate(t.dueDate)} {t.dueTime ? `(${fmtTime12(t.dueTime)})` : ""}</span>
                      </span>
                      {t.estHours && (
                        <span className="flex items-center gap-1 text-theme-muted">
                          <Clock className="w-3 h-3 text-theme-muted" />
                          <span>~{t.estHours}h required</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#B4C6A6]/[0.04] w-full sm:w-auto justify-end">
                  <button
                    onClick={() => onEdit(t)}
                    className="p-2 rounded-full hover:bg-theme-card/80 text-theme-text hover:text-theme-text transition-colors cursor-pointer"
                    title="Edit task"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="p-2 rounded-full hover:bg-theme-bg/80 text-theme-text hover:text-theme-text transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TopicsView({ topics, subjectList, onAdd, onDelete, onToggle, availability, toggleSlot, onApplyPreset }) {
  const [form, setForm] = useState({ name: "", subject: "", difficulty: "Medium" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [activeSubjectFilter, setActiveSubjectFilter] = useState("all");

  const distinctSubjects = useMemo(() => {
    const set = new Set();
    topics.forEach((t) => { if (t.subject) set.add(t.subject); });
    (subjectList || []).forEach((s) => { if (s) set.add(s); });
    return Array.from(set);
  }, [topics, subjectList]);

  // High-level analytics
  const stats = useMemo(() => {
    const total = topics.length;
    const completed = topics.filter((t) => t.completed).length;
    const hard = topics.filter((t) => t.difficulty === "Hard" && !t.completed).length;
    const inProgress = total - completed;
    const masteryRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, hard, inProgress, masteryRate };
  }, [topics]);

  // Group topics by subject
  const groupedBySubject = useMemo(() => {
    const groups = {};
    const q = searchQuery.toLowerCase().trim();

    topics.forEach((t) => {
      // Filter by search
      if (q && !t.name.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) {
        return;
      }
      // Filter by difficulty
      if (difficultyFilter !== "all" && t.difficulty !== difficultyFilter) {
        return;
      }
      // Filter by subject
      if (activeSubjectFilter !== "all" && t.subject !== activeSubjectFilter) {
        return;
      }

      const subj = t.subject || "General";
      if (!groups[subj]) groups[subj] = [];
      groups[subj].push(t);
    });

    return groups;
  }, [topics, searchQuery, difficultyFilter, activeSubjectFilter]);

  const submit = (e) => {
    e?.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) return;
    onAdd(form);
    setForm({ name: "", subject: "", difficulty: "Medium" });
    setShowAddForm(false);
  };

  const openAddForSubject = (subj) => {
    setForm({ name: "", subject: subj, difficulty: "Medium" });
    setShowAddForm(true);
  };

  return (
    <div className="space-y-5 w-full">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-theme-border/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-medium text-lg sm:text-xl text-theme-text tracking-tight">Study Topics & Mastery</h2>
            <span className="text-xs font-normal text-theme-text bg-theme-card/80 px-2.5 py-0.5 rounded-full border border-theme-border shadow-2xs">
              {stats.completed} of {stats.total} Mastered ({stats.masteryRate}%)
            </span>
          </div>
          <p className="text-xs text-theme-text font-normal">
            Syllabus breakdown, concept difficulty ratings, and automated revision scheduling
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-text px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-theme-accent-green" />
          <span>{showAddForm ? "Close Form" : "Add Concept"}</span>
        </button>
      </div>

      {/* KPI Mastery Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-[20px] bg-theme-bg border border-theme-accent-green-light shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-theme-accent-green-light text-theme-accent-blue flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-normal text-theme-text uppercase tracking-wider">Total Syllabus</p>
            <p className="text-sm font-medium text-theme-text">{stats.total} concepts</p>
          </div>
        </div>

        <div className="p-3 rounded-[20px] bg-theme-bg border border-theme-accent-green shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-text flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-normal text-theme-text uppercase tracking-wider">Hard Topics</p>
            <p className="text-sm font-medium text-theme-text">{stats.hard} high focus</p>
          </div>
        </div>

        <div className="p-3 rounded-[20px] bg-theme-bg border border-theme-accent-green-light shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-text flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-normal text-theme-text uppercase tracking-wider">In Revision</p>
            <p className="text-sm font-medium text-theme-text">{stats.inProgress} to review</p>
          </div>
        </div>

        <div className="p-3 rounded-[20px] bg-theme-bg border border-theme-accent-green-light shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-accent-blue flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-normal text-theme-text uppercase tracking-wider">Mastered</p>
            <p className="text-sm font-medium text-theme-text">{stats.completed} solid</p>
          </div>
        </div>
      </div>

      {/* Slide-out / Collapsible Add Topic Form */}
      {showAddForm && (
        <form onSubmit={submit} className="p-4 sm:p-5 rounded-[24px] bg-theme-card border border-theme-border shadow-xs space-y-3 transition-all animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-theme-border">
            <span className="font-medium text-xs text-theme-text">New Concept / Syllabus Topic</span>
            <span className="text-[11px] text-theme-muted">Will automatically queue into your weekly study plan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            <div className="sm:col-span-5">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Topic / Concept (e.g. MOSFETs, Chain Rule)"
                className="w-full bg-theme-bg border border-theme-border rounded-full px-4 py-2 text-xs text-theme-text placeholder-[#A8A29A] focus:outline-none focus:border-[#B4C6A6]"
                autoFocus
              />
            </div>

            <div className="sm:col-span-3">
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Subject (e.g. EDC, Calculus)"
                className="w-full bg-theme-bg border border-theme-border rounded-full px-4 py-2 text-xs text-theme-text placeholder-[#A8A29A] focus:outline-none focus:border-[#B4C6A6]"
                list="subjects-datalist"
              />
              <datalist id="subjects-datalist">
                {distinctSubjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2">
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full bg-theme-bg border border-theme-border rounded-full px-3 py-2 text-xs text-theme-text focus:outline-none cursor-pointer"
              >
                <option value="Easy">Easy (1h)</option>
                <option value="Medium">Medium (2h)</option>
                <option value="Hard">Hard (3h)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-1.5">
              <button
                type="submit"
                disabled={!form.name.trim() || !form.subject.trim()}
                className="w-full bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-text py-2 rounded-full text-xs font-medium cursor-pointer shadow-sm transition-all disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-2 text-theme-muted hover:text-theme-text cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="p-2.5 rounded-[22px] bg-theme-card/70 border border-theme-border shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts or subjects..."
            className="w-full bg-theme-bg border border-theme-border rounded-full pl-8.5 pr-3 py-1.5 text-xs text-theme-text placeholder-[#A8A29E] focus:outline-none focus:border-[#B4C6A6]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={activeSubjectFilter}
            onChange={(e) => setActiveSubjectFilter(e.target.value)}
            className="bg-theme-card hover:bg-theme-bg border border-theme-border text-theme-text rounded-full px-3 py-1 text-xs font-medium cursor-pointer focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {distinctSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {[
            { id: "all", label: "All Difficulties" },
            { id: "Hard", label: " Hard" },
            { id: "Medium", label: "Medium" },
            { id: "Easy", label: "Easy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDifficultyFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                difficultyFilter === tab.id
                  ? "bg-[#B4C6A6] text-theme-accent-green shadow-xs"
                  : "bg-theme-card hover:bg-theme-bg text-theme-text border border-theme-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Subject Modules */}
      {Object.keys(groupedBySubject).length === 0 ? (
        <div className="py-12 px-4 rounded-[26px] bg-theme-card/40 border border-dashed border-theme-border text-center flex flex-col items-center justify-center gap-2 text-theme-muted">
          <BookOpenCheck className="w-8 h-8 text-theme-muted" />
          <p className="text-xs font-medium text-theme-text">No syllabus topics found</p>
          <p className="text-[11px] text-theme-muted">Click "Add Concept" above to begin structuring your revision topics.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBySubject).map(([subj, items]) => {
            const theme = getSubjectTheme(subj);
            const subjCompleted = items.filter((i) => i.completed).length;
            const subjPct = Math.round((subjCompleted / items.length) * 100);

            return (
              <div key={subj} className="rounded-[24px] bg-theme-card/60 border border-theme-border p-4 sm:p-5 shadow-2xs space-y-3.5">
                {/* Subject Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-theme-border">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium ${theme.tagBg} ${theme.tagText}`}>
                      <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                      <span>{subj}</span>
                    </span>
                    <span className="text-xs font-normal text-theme-text">
                      {subjCompleted} of {items.length} Mastered
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-24 bg-theme-bg h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#B4C6A6] rounded-full transition-all duration-300" style={{ width: `${subjPct}%` }} />
                      </div>
                      <span className="text-[10.5px] font-normal text-theme-muted">{subjPct}%</span>
                    </div>

                    <button
                      onClick={() => openAddForSubject(subj)}
                      className="text-[11px] font-medium text-theme-text hover:text-theme-text bg-theme-card hover:bg-theme-bg border border-theme-border px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-theme-accent-blue" />
                      <span>Add Concept</span>
                    </button>
                  </div>
                </div>

                {/* Concepts Grid for this Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((t) => {
                    const difficultyBadge =
                      t.difficulty === "Hard" ? "bg-theme-bg text-theme-text border border-theme-accent-green" :
                      t.difficulty === "Medium" ? "bg-theme-accent-green-light text-theme-text border border-theme-accent-green-light" :
                      "bg-theme-bg text-theme-text border border-theme-accent-green-light";

                    const estTime = t.difficulty === "Hard" ? "3.0h" : t.difficulty === "Medium" ? "2.0h" : "1.0h";

                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-[18px] border transition-all duration-150 ${
                          t.completed
                            ? "bg-theme-bg/80 border-theme-border opacity-60"
                            : `${theme.bg} ${theme.border} ${theme.hoverBorder} shadow-2xs hover:-translate-y-0.5 hover:shadow-xs`
                        } flex items-center justify-between gap-3`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            onClick={() => onToggle(t.id)}
                            className="text-theme-muted hover:text-theme-text transition-colors cursor-pointer shrink-0"
                            title={t.completed ? "Mark incomplete" : "Mark mastered"}
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-theme-accent-blue" />
                            ) : (
                              <Circle className="w-4 h-4 text-theme-muted hover:text-theme-text" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-medium leading-snug truncate ${
                              t.completed ? "line-through text-theme-muted" : "text-theme-text"
                            }`}>
                              {t.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded-md ${difficultyBadge}`}>
                                {t.difficulty}
                              </span>
                              <span className="text-[10px] font-normal text-theme-muted flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-theme-muted" />
                                <span>~{estTime} revision</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onDelete(t.id)}
                          className="p-1.5 rounded-full text-theme-muted hover:text-theme-text hover:bg-theme-bg/60 transition-colors cursor-pointer shrink-0"
                          title="Delete concept"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskModal({ editing, subjectList, onClose, onSave }) {
  const [form, setForm] = useState(() => editing || {
    title: "", 
    subject: "", 
    category: "Assignment", 
    dueDate: toISODate(addDays(new Date(), 3)), 
    dueTime: "18:00", 
    priority: "Medium", 
    estHours: 2,
  });
  const valid = form.title.trim() && form.subject.trim() && form.dueDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#B4C6A6]/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-theme-card rounded-[32px] shadow-2xl p-6 border border-theme-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-theme-border">
          <h3 className="font-medium text-base text-theme-text">
            {editing ? "Edit Task / Event" : "Add Task, Assignment or Quiz"}
          </h3>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-text transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title (e.g. Calculus Quiz 1, Physics Problem Set 4)"
            className="w-full bg-theme-bg border border-theme-border rounded-full px-4 py-2.5 text-xs text-theme-text focus:outline-none"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Subject (e.g. Calculus)"
              className="w-full bg-theme-bg border border-theme-border rounded-full px-4 py-2 text-xs text-theme-text focus:outline-none"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-theme-bg border border-theme-border rounded-full px-3 py-2 text-xs text-theme-text focus:outline-none cursor-pointer"
            >
              <option value="Assignment">📝 Assignment</option>
              <option value="Quiz / Test"> Quiz / Test</option>
              <option value="Exam Prep">🚨 Exam Prep</option>
              <option value="Project">📊 Project</option>
              <option value="Homework">📚 Homework</option>
              <option value="Other Event">🎯 Other Event</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-theme-muted ml-2 block mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full bg-theme-bg border border-theme-border rounded-full px-3 py-2 text-xs text-theme-text focus:outline-none cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-theme-muted ml-2 block mb-1">Due Time</label>
              <input
                type="time"
                value={form.dueTime}
                onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                className="w-full bg-theme-bg border border-theme-border rounded-full px-3 py-2 text-xs text-theme-text focus:outline-none cursor-pointer"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full bg-theme-bg border border-theme-border rounded-full px-3 py-2 text-xs text-theme-text focus:outline-none cursor-pointer"
            >
              <option value="High">🔴 High Priority</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="Low">🟢 Low Priority</option>
            </select>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={form.estHours}
              onChange={(e) => setForm({ ...form, estHours: parseFloat(e.target.value) || 1 })}
              placeholder="Est. Hours"
              className="w-full bg-theme-bg border border-theme-border rounded-full px-4 py-2 text-xs text-theme-text focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-theme-border">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-theme-muted hover:text-theme-text cursor-pointer">Cancel</button>
          <button disabled={!valid} onClick={() => onSave(form)} className="px-5 py-2 rounded-full bg-[#B4C6A6] hover:bg-[#B4C6A6] text-theme-text text-xs font-medium cursor-pointer shadow-sm transition-all disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}

function EventModal({ editing, defaultDate, onClose, onSave }) {
  const [form, setForm] = useState(() => editing || {
    title: "",
    category: "🎯 Hackathon",
    date: defaultDate || toISODate(new Date()),
    startTime: "10:00",
    endTime: "12:00",
    venue: "",
    description: "",
  });

  const valid = form.title.trim() && form.date;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#B4C6A6]/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-theme-card rounded-[32px] shadow-2xl p-6 border border-theme-border space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-theme-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-theme-bg text-theme-text flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-theme-text">
                {editing ? "Edit Calendar Event" : "Add Calendar Event"}
              </h3>
              <p className="text-[11px] text-theme-muted">Hackathons, fests, club meets, workshops & more</p>
            </div>
          </div>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-text transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-theme-muted ml-2 block mb-1">Event Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. 24h AI Hackathon, Robotics Club Meet, Cultural Fest"
              className="w-full bg-theme-bg border border-theme-border rounded-2xl px-4 py-2.5 text-xs text-theme-text font-medium focus:outline-none focus:border-theme-accent-blue"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-theme-muted ml-2 block mb-1">Event Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-theme-bg border border-theme-border rounded-2xl px-3 py-2 text-xs text-theme-text font-medium focus:outline-none focus:border-theme-accent-blue cursor-pointer"
              >
                <option value="🎯 Hackathon">🎯 Hackathon</option>
                <option value="🎪 Fest / Cultural">🎪 Fest / Cultural</option>
                <option value="👥 Club Meeting">👥 Club Meeting</option>
                <option value="🎤 Workshop / Seminar">🎤 Workshop / Seminar</option>
                <option value="💼 Career / Placement">💼 Career / Placement</option>
                <option value="🏆 Competition">🏆 Competition</option>
                <option value="📌 General Event">📌 General Event</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-theme-muted ml-2 block mb-1">Event Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-theme-bg border border-theme-border rounded-2xl px-3 py-2 text-xs text-theme-text font-medium focus:outline-none focus:border-theme-accent-blue cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-theme-muted ml-2 block mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime || ""}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full bg-theme-bg border border-theme-border rounded-2xl px-3 py-2 text-xs text-theme-text font-medium focus:outline-none focus:border-theme-accent-blue cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-theme-muted ml-2 block mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime || ""}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full bg-theme-bg border border-theme-border rounded-2xl px-3 py-2 text-xs text-theme-text font-medium focus:outline-none focus:border-theme-accent-blue cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-theme-muted ml-2 block mb-1">Venue / Location</label>
            <input
              value={form.venue || ""}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g. Main Auditorium, Lab 402, Online Zoom"
              className="w-full bg-theme-bg border border-theme-border rounded-2xl px-4 py-2 text-xs text-theme-text font-medium focus:outline-none focus:border-theme-accent-blue"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-theme-muted ml-2 block mb-1">Description / Notes (Optional)</label>
            <textarea
              rows={2}
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Bring laptop & ID card, team registration link: ..."
              className="w-full bg-theme-bg border border-theme-border rounded-2xl px-4 py-2 text-xs text-theme-text font-medium focus:outline-none focus:border-theme-accent-blue resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold text-theme-text hover:bg-theme-bg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() => {
              if (!valid) return;
              onSave(form);
              onClose();
            }}
            className="px-5 py-2 rounded-full bg-theme-accent-blue hover:bg-[#B4C6A6] disabled:opacity-50 text-theme-text text-xs font-black shadow-md transition-all cursor-pointer"
          >
            {editing ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationDrawer({ alerts, onClose, setView }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-6 top-16 w-80 sm:w-96 max-h-96 overflow-y-auto rounded-3xl border border-theme-border bg-theme-card shadow-2xl z-50 p-2">
        <div className="px-4 py-3 border-b border-theme-border flex items-center justify-between">
          <p className="font-medium text-sm text-theme-text">Reminders & Alerts</p>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-text"><X className="w-4 h-4" /></button>
        </div>
        <ul className="divide-y divide-theme-bg max-h-72 overflow-y-auto">
          {alerts.map((a) => (
            <li key={a.id} className="px-4 py-3 hover:bg-theme-bg text-xs transition-colors">
              <p className="font-medium text-theme-text">{a.title}</p>
              <p className="text-[11px] text-theme-muted font-normal">{a.subject} · {fmtDisplayDate(a.dueDate)} ({fmtTime12(a.dueTime)})</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
