import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LayoutDashboard, CheckSquare, BookOpenCheck, CalendarRange, Bell, Plus,
  Sparkles, CheckCircle2, Circle, Clock, Flame, TrendingUp, X, ChevronLeft,
  ChevronRight, ArrowUpDown, GraduationCap, Trash2, Pencil, Loader2,
  AlertTriangle, CalendarClock, Coffee, Target, BarChart3, Edit3, LogOut, User,
  Calendar, Search, Filter, Layers, Sun, Moon, Zap, Tag, Check, Award, School,
  Upload, FileText, MapPin, MoreHorizontal, ChevronDown, RotateCcw, Paperclip,
  Activity, Users, FileSpreadsheet, Settings, MessageSquare, CreditCard, FolderArchive
} from "lucide-react";
import PomodoroTimer from "./components/PomodoroTimer";
import AnalyticsView from "./components/AnalyticsView";
import ClassTimetableManager from "./components/ClassTimetableManager";
import ExamTimetableManager from "./components/ExamTimetableManager";

/* ============================================================================
   CONSTANTS & THEME TOKENS
   ========================================================================== */

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const DAY_SHORT_LABELS = { Mon: "MONDAY", Tue: "TUESDAY", Wed: "WEDNESDAY", Thu: "THU", Fri: "FRIDAY", Sat: "SATURDAY", Sun: "SUNDAY" };
const GRID_HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 -> 22:00

const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };
const PRIORITY_STYLES = {
  High: "bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]",
  Medium: "bg-[#FEFCE8] text-[#CA8A04] border-[#FEF08A]",
  Low: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
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
  return new Date(`${dateStr}T${timeStr || "23:59"}:00`);
}
function fmtDisplayDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function fmtShortDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}
function fmtTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${period}`;
}
function fmtTime24(t) {
  if (!t) return "";
  return t.slice(0, 5);
}

/* ============================================================================
   MOCK DATA SEED
   ========================================================================== */

function buildMockData() {
  const today = startOfDay(new Date());
  const tasks = [
    { id: uid(), title: "Calculus Problem Set 4", subject: "Calculus", category: "Assignment", dueDate: toISODate(addDays(today, 2)), dueTime: "23:59", priority: "High", estHours: 3, completed: false, sessionsDone: 9, totalSessions: 12 },
    { id: uid(), title: "Data Structures Lab Report", subject: "Data Structures", category: "Reading / Lab", dueDate: toISODate(addDays(today, 1)), dueTime: "18:00", priority: "High", estHours: 2, completed: false, sessionsDone: 6, totalSessions: 10 },
    { id: uid(), title: "Digital Electronics Circuit Simulation", subject: "Electronics", category: "Project", dueDate: toISODate(addDays(today, 4)), dueTime: "17:00", priority: "Medium", estHours: 3.5, completed: false, sessionsDone: 4, totalSessions: 8 },
    { id: uid(), title: "Marketing Case Study Draft", subject: "Marketing", category: "Assignment", dueDate: toISODate(addDays(today, 5)), dueTime: "12:00", priority: "Medium", estHours: 4, completed: false, sessionsDone: 8, totalSessions: 10 },
    { id: uid(), title: "Read Chapter 7 — Thermodynamics", subject: "Physics", category: "Homework", dueDate: toISODate(addDays(today, 7)), dueTime: "09:00", priority: "Low", estHours: 1.5, completed: false, sessionsDone: 2, totalSessions: 5 },
  ];
  const topics = [
    { id: uid(), name: "Integration by Parts & Substitution", subject: "Calculus", difficulty: "Medium", completed: false, sessionsDone: 5, totalSessions: 6 },
    { id: uid(), name: "Binary Search Trees & AVL Rotations", subject: "Data Structures", difficulty: "Hard", completed: false, sessionsDone: 7, totalSessions: 8 },
    { id: uid(), name: "K-Maps & Logic Simplification", subject: "Electronics", difficulty: "Medium", completed: false, sessionsDone: 3, totalSessions: 4 },
    { id: uid(), name: "Consumer Behaviour Models", subject: "Marketing", difficulty: "Easy", completed: false, sessionsDone: 4, totalSessions: 4 },
  ];
  const availability = {
    Mon: [8, 9, 17, 18, 19, 20], Tue: [17, 18, 19, 20], Wed: [8, 9, 17, 18, 19, 20],
    Thu: [17, 18, 19, 20], Fri: [17, 18, 19, 20],
    Sat: [9, 10, 11, 12, 13, 14, 15], Sun: [9, 10, 11, 12, 13, 14, 15],
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
    student: { name: "Dr. Olivia", program: "Medicine & Health Sciences" } 
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
    title: `⚡ Exam Revision: ${ex.subject}`,
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
    return buildMockData().tasks;
  });
  const [topics, setTopics] = useState(() => {
    if (savedPlannerData?.topics && Array.isArray(savedPlannerData.topics)) return savedPlannerData.topics;
    if (savedPlannerData && typeof savedPlannerData === 'object') return [];
    return buildMockData().topics;
  });
  const [availability, setAvailability] = useState(() => {
    if (savedPlannerData?.availability && typeof savedPlannerData.availability === 'object') return savedPlannerData.availability;
    return buildMockData().availability;
  });
  const [collegeSchedule, setCollegeSchedule] = useState(() => {
    if (savedPlannerData?.collegeSchedule && Array.isArray(savedPlannerData.collegeSchedule)) return savedPlannerData.collegeSchedule;
    if (savedPlannerData && typeof savedPlannerData === 'object') return [];
    return buildMockData().collegeSchedule;
  });
  const [examSchedule, setExamSchedule] = useState(() => {
    if (savedPlannerData?.examSchedule && Array.isArray(savedPlannerData.examSchedule)) return savedPlannerData.examSchedule;
    if (savedPlannerData && typeof savedPlannerData === 'object') return [];
    return buildMockData().examSchedule;
  });
  const [timetable, setTimetable] = useState(() => {
    if (savedPlannerData?.timetable && Array.isArray(savedPlannerData.timetable)) return savedPlannerData.timetable;
    const initialTasks = savedPlannerData?.tasks || (savedPlannerData ? [] : buildMockData().tasks);
    const initialTopics = savedPlannerData?.topics || (savedPlannerData ? [] : buildMockData().topics);
    const initialAvail = savedPlannerData?.availability || buildMockData().availability;
    const initialClasses = savedPlannerData?.collegeSchedule || (savedPlannerData ? [] : buildMockData().collegeSchedule);
    const initialExams = savedPlannerData?.examSchedule || (savedPlannerData ? [] : buildMockData().examSchedule);

    return generateTimetable(initialTasks, initialTopics, initialAvail, startOfWeek(new Date()), initialClasses, initialExams);
  });
  const [lastGenerated, setLastGenerated] = useState(() => {
    return savedPlannerData?.lastGenerated || new Date().toISOString();
  });
  const [studentState, setStudentState] = useState({ name: "Dr. Olivia", program: "Medicine & Health Sciences" });

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
        name: userProfile.name || 'Dr. Olivia',
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
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  /* ---- Handlers ---- */
  const toggleTask = useCallback((id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);

  const saveTask = useCallback((taskData) => {
    if (taskData.id) {
      setTasks((prev) => prev.map((t) => (t.id === taskData.id ? { ...t, ...taskData } : t)));
    } else {
      setTasks((prev) => [{ ...taskData, id: uid(), completed: false, sessionsDone: 1, totalSessions: 6 }, ...prev]);
    }
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addTopic = useCallback((topicData) => {
    setTopics((prev) => [...prev, { ...topicData, id: uid(), completed: false, sessionsDone: 0, totalSessions: 5 }]);
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
  }, [timetable, tasks, now]);

  return (
    <div className="w-full max-w-[1520px] bg-[#F5F2EB] rounded-[38px] p-3 sm:p-5 lg:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-[#E8E2D8] flex flex-col md:flex-row gap-4 sm:gap-6 min-h-[92vh]">
      
      {/* =========================================================================
         1. MINIMALIST ICON-ONLY SIDEBAR (As requested)
         ========================================================================= */}
      <aside className="w-full md:w-16 flex md:flex-col items-center justify-between py-2 md:py-3 px-2 md:px-0 shrink-0 gap-2 border-b md:border-b-0 md:border-r border-[#E8E2D8]/80">
        
        {/* Navigation Icon Buttons */}
        <div className="flex md:flex-col items-center gap-2.5">
          {/* Dashboard */}
          <button
            onClick={() => setView("dashboard")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              view === "dashboard"
                ? "bg-[#181A1D] text-[#FACC15] shadow-md"
                : "text-[#8E8880] hover:text-[#181A1D] hover:bg-white/80"
            }`}
            title="Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>

          {/* Tasks & Routine */}
          <button
            onClick={() => setView("tasks")}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              view === "tasks"
                ? "bg-[#181A1D] text-[#FACC15] shadow-md"
                : "text-[#8E8880] hover:text-[#181A1D] hover:bg-white/80"
            }`}
            title="Tasks & Assignments"
          >
            <CheckSquare className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 rounded-full bg-[#FB7185] text-white text-[8px] font-black">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Topics & Mastery */}
          <button
            onClick={() => setView("topics")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              view === "topics"
                ? "bg-[#181A1D] text-[#FACC15] shadow-md"
                : "text-[#8E8880] hover:text-[#181A1D] hover:bg-white/80"
            }`}
            title="Study Topics & Availability"
          >
            <BookOpenCheck className="w-5 h-5" />
          </button>

          {/* Schedule / Timetable */}
          <button
            onClick={() => setView("timetable")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              view === "timetable"
                ? "bg-[#181A1D] text-[#FACC15] shadow-md"
                : "text-[#8E8880] hover:text-[#181A1D] hover:bg-white/80"
            }`}
            title="Weekly Timetable"
          >
            <CalendarRange className="w-5 h-5" />
          </button>

          {/* Statistics & Reports */}
          <button
            onClick={() => setView("analytics")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              view === "analytics"
                ? "bg-[#181A1D] text-[#FACC15] shadow-md"
                : "text-[#8E8880] hover:text-[#181A1D] hover:bg-white/80"
            }`}
            title="Statistics & Reports"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {/* Classes & Routine */}
          <button
            onClick={() => setView("classes")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              view === "classes"
                ? "bg-[#181A1D] text-[#FACC15] shadow-md"
                : "text-[#8E8880] hover:text-[#181A1D] hover:bg-white/80"
            }`}
            title="College Classes & Timetable"
          >
            <School className="w-5 h-5" />
          </button>

          {/* Exam Milestones */}
          <button
            onClick={() => setView("exams")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              view === "exams"
                ? "bg-[#181A1D] text-[#FACC15] shadow-md"
                : "text-[#8E8880] hover:text-[#181A1D] hover:bg-white/80"
            }`}
            title="Exam Schedule & Vision Engine"
          >
            <Award className="w-5 h-5" />
          </button>

          {/* Focus Pomodoro */}
          <button
            onClick={() => setView("pomodoro")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              view === "pomodoro"
                ? "bg-[#181A1D] text-[#FACC15] shadow-md"
                : "text-[#8E8880] hover:text-[#181A1D] hover:bg-white/80"
            }`}
            title="Focus Pomodoro Timer"
          >
            <Target className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom User / Settings / Logout */}
        <div className="flex md:flex-col items-center gap-2 pt-2">
          <button
            onClick={onEditProfile}
            className="w-9 h-9 rounded-full bg-white border border-[#ECE6DC] flex items-center justify-center text-[#181A1D] hover:bg-[#F8F6F1] shadow-2xs cursor-pointer text-xs font-bold"
            title="Profile & Settings"
          >
            {student.avatar ? <span className="text-sm">{student.avatar}</span> : (student.name || "S")[0]}
          </button>
          <button
            onClick={onSignOut}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#FB7185] hover:bg-rose-50 transition-all cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* =========================================================================
         2. MAIN CONTENT CANVAS
         ========================================================================= */}
      <main className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
        
        {/* ----------------- SCHEDULE / TIMETABLE VIEW ----------------- */}
        {view === "timetable" && (
          <div className="space-y-3 flex-1 flex flex-col min-w-0">
            
            {/* Top Toolbar for Schedule */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-[#E8E2D8]/60">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-base sm:text-lg text-[#181A1D] tracking-tight">
                  Weekly Timetable
                </span>
                <span className="text-xs font-semibold text-[#8E8880] bg-white/80 px-2.5 py-0.5 rounded-full border border-[#ECE6DC]">
                  {fmtDisplayDate(toISODate(weekStart))} – {fmtDisplayDate(toISODate(weekEnd))}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#ECE6DC] hover:bg-[#F8F6F1] text-xs font-bold text-[#181A1D] shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Regenerate Plan"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-[#EAB308] ${generating ? "animate-spin" : ""}`} />
                  <span>{generating ? "Building..." : "Regenerate"}</span>
                </button>

                <button
                  onClick={() => setTaskModal({ open: true, editing: null })}
                  className="bg-[#181A1D] hover:bg-black text-white px-4 py-1.5 rounded-full font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FACC15]" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* 7 Columns Timetable Grid */}
            <div className="flex-1 overflow-x-auto pb-2">
              <div className="grid grid-cols-7 gap-2.5 min-w-[960px]">
                {DAY_KEYS.map((d, i) => {
                  const colDateISO = toISODate(addDays(weekStart, i));
                  const isToday = colDateISO === toISODate(now);
                  const dayBlocks = timetable.filter(b => b.date === colDateISO);

                  return (
                    <div 
                      key={d} 
                      className={`rounded-[24px] p-2 space-y-2 flex flex-col transition-all ${
                        isToday 
                          ? "bg-white/80 border border-[#E0D8CA] shadow-xs" 
                          : "bg-white/40 border border-[#ECE6DC]"
                      }`}
                    >
                      {/* Column Header */}
                      <div className={`px-3 py-2 rounded-[18px] flex items-center justify-between ${
                        isToday 
                          ? "bg-white border border-[#E8E2D8] shadow-2xs" 
                          : "bg-white/60 border border-[#ECE6DC]"
                      }`}>
                        <span className="font-display font-extrabold text-xs text-[#181A1D]">
                          {DAY_LABELS[d]}
                        </span>
                        {isToday && (
                          <span className="bg-[#FDE047] text-[#181A1D] text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Day Event Cards */}
                      <div className="space-y-2 flex-1">
                        {dayBlocks.length === 0 ? (
                          <div className="h-32 rounded-[18px] bg-white/30 border border-dashed border-[#ECE6DC] p-3 text-center flex items-center justify-center text-[10px] text-[#A8A29E]">
                            No activities
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
            collegeScheduleCount={collegeSchedule.length}
            examScheduleCount={examSchedule.length}
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

        {/* ----------------- ANALYTICS VIEW ----------------- */}
        {view === "analytics" && (
          <AnalyticsView
            tasks={tasks}
            topics={topics}
            timetable={timetable}
            student={student}
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

const SUBJECT_DOT_COLORS = {
  Calculus: "bg-[#EAB308]",
  "Data Structures": "bg-[#FB7185]",
  Electronics: "bg-[#3B82F6]",
  Marketing: "bg-[#10B981]",
  Physics: "bg-[#8B5CF6]",
};

function getSubjectDotColor(subject) {
  if (!subject) return "bg-[#EAB308]";
  return SUBJECT_DOT_COLORS[subject] || "bg-[#6366F1]";
}

function ScheduleCardItem({ block, onToggle }) {
  // Break row
  if (block.type === "break") {
    return (
      <div className="py-1 px-2.5 rounded-xl bg-white/40 border border-[#ECE6DC] text-[10px] text-[#8E8880] flex items-center gap-1.5">
        <Coffee className="w-3 h-3 text-[#EAB308]" />
        <span>Break · {fmtTime12(block.start)}–{fmtTime12(block.end)}</span>
      </div>
    );
  }

  // Class (Lecture / Lab / Tutorial) - Soft Sky Blue
  if (block.type === "class") {
    return (
      <div className="p-3 rounded-[20px] bg-[#EDF5FF] text-[#1E3A8A] border border-[#BFDBFE] shadow-2xs space-y-1.5 transition-all hover:scale-[1.01]">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-extrabold text-[#1E3A8A] truncate">{block.assigned?.title}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#DBEAFE] text-[#1D4ED8] shrink-0">
            {block.assigned?.classType || "Lecture"}
          </span>
        </div>
        <p className="text-[10px] font-bold text-[#2563EB]">
          {fmtTime12(block.start)}–{fmtTime12(block.end)}
        </p>
        <p className="text-[10px] font-medium text-[#3B82F6] flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-[#3B82F6]" />
          <span>{block.assigned?.room || "Room 101"}</span>
        </p>
      </div>
    );
  }

  // Exam - Soft Rose / Pink
  if (block.type === "exam") {
    return (
      <div className="p-3 rounded-[20px] bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] shadow-2xs space-y-1.5 transition-all hover:scale-[1.01] animate-pulse">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-black text-[#9F1239] truncate flex items-center gap-1">
            <span>⚡</span> {block.assigned?.title}
          </p>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#FFE4E6] text-[#E11D48] shrink-0">
            EXAM
          </span>
        </div>
        <p className="text-[10px] font-bold text-[#E11D48]">
          {fmtTime12(block.start)}–{fmtTime12(block.end)}
        </p>
        <p className="text-[10px] font-medium text-[#BE123C] flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-[#E11D48]" />
          <span>{block.assigned?.room || "Examination Hall"}</span>
        </p>
      </div>
    );
  }

  // Regular Study Tasks & Topics - Warm White Card with Subject Dot
  const isExamPrep = block.type === "exam_prep" || block.assigned?.itemType === "exam_prep";
  const subject = block.assigned?.subject || "Calculus";

  return (
    <div className={`p-3 rounded-[20px] border transition-all ${
      block.completed 
        ? "bg-[#F8F6F1] border-[#ECE6DC] opacity-60" 
        : "bg-white border-[#ECE6DC] shadow-2xs hover:border-[#181A1D]"
    } space-y-1.5`}>
      <div className="flex items-start gap-2">
        <button onClick={onToggle} className="mt-0.5 text-[#A8A29E] hover:text-[#181A1D] cursor-pointer">
          {block.completed ? <CheckCircle2 className="w-4 h-4 text-[#181A1D]" /> : <Circle className="w-4 h-4 text-[#D6D3D1]" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold leading-snug truncate ${block.completed ? "line-through text-[#A8A29E]" : "text-[#181A1D]"}`}>
            {isExamPrep && <span className="text-[#EAB308] mr-1">⚡</span>}
            {block.assigned?.title || "Study Session"}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getSubjectDotColor(subject)}`} />
            <span className="text-[10px] text-[#78716C] font-medium truncate">{subject}</span>
          </div>
          <p className="text-[10px] text-[#A8A29E] font-medium mt-1">
            {fmtTime12(block.start)}–{fmtTime12(block.end)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   REUSED DASHBOARD VIEW
   ========================================================================== */

function DashboardView({ 
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
  collegeScheduleCount = 0, 
  examScheduleCount = 0 
}) {
  const todayISO = toISODate(now);
  const completedStudyBlocks = timetable.filter((b) => b.type === "study" && b.completed).length;
  const hoursStudied = stats.hoursStudied || 2.3;
  const dailyTarget = student.dailyTargetHours || 4;
  const currentHour = now.getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const studentName = student?.name || 'Student';

  return (
    <div className="space-y-5">
      {/* Personalized Welcome Banner at the Top */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8]/60">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display font-black text-xl sm:text-2xl text-[#181A1D] tracking-tight">
              {timeGreeting}, {studentName}! 👋
            </h1>
            {student.summaryTag && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#181A1D] text-[#FDE047] text-[10px] font-black tracking-wide shadow-2xs">
                {student.summaryTag}
              </span>
            )}
          </div>
          <p className="text-xs text-[#78716C] font-medium">
            {student.courseName ? `Here's your academic plan for ${student.courseName}. ` : student.program ? `Here's your academic overview for ${student.program}. ` : ''}
            Let's stay focused and achieve your {dailyTarget}h daily study target today!
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-full bg-white/80 border border-[#ECE6DC] shadow-2xs text-xs font-bold text-[#181A1D] flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#EAB308]" />
            <span>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <button
            onClick={onEditProfile}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F8F6F1] border border-[#ECE6DC] text-xs font-bold text-[#181A1D] shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Edit Profile"
          >
            <Pencil className="w-3 h-3 text-[#78716C]" />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Hero Taupe Card with Glowing Orbs */}
        <div className="lg:col-span-7 bg-[#DDD7CC] rounded-[34px] p-6 sm:p-7 relative overflow-hidden shadow-xs border border-[#D0C9BD] flex flex-col justify-between min-h-[290px]">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h2 className="font-display font-extrabold text-[#1B1C20] text-base sm:text-lg tracking-tight">Your Study Sessions</h2>
              <p className="text-xs text-[#6B655E] font-medium">Results for Today</p>
            </div>
            <button onClick={() => setView("timetable")} className="w-8 h-8 rounded-full bg-[#181A1D] text-white flex items-center justify-center hover:bg-black transition-all cursor-pointer shadow-xs">
              <CalendarRange className="w-4 h-4 text-[#FACC15]" />
            </button>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#181A1D] text-white flex flex-col items-center justify-center shadow-lg -mr-6 z-20">
              <span className="font-display font-extrabold text-xs sm:text-sm text-white">{hoursStudied.toFixed(2)}</span>
              <span className="text-[9px] text-[#A6ADB8] uppercase tracking-wider font-semibold">hours</span>
            </div>
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-[#FACC15] via-[#FDE047] to-[#FEF08A] flex flex-col items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.5)] z-10">
              <span className="font-display font-extrabold text-base sm:text-xl text-[#1B1C20]">{Math.round(hoursStudied * 815)}</span>
              <span className="text-[10px] text-[#524B3D] font-bold">mastery score</span>
            </div>
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#FB7185] via-[#FDA4AF] to-[#FECDD3] flex flex-col items-center justify-center shadow-[0_0_35px_rgba(251,113,133,0.4)] -ml-7 z-20">
              <span className="font-display font-extrabold text-sm sm:text-base text-[#1B1C20]">{stats.completedTasks} / {stats.totalTasks}</span>
              <span className="text-[9px] text-[#6B212D] font-bold uppercase tracking-wider">tasks done</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] sm:text-[11px] font-semibold text-[#5A554E] flex-wrap relative z-10">
            <div className="flex items-center gap-1.5"><span className="w-4 h-1.5 rounded-full bg-[#FACC15]" /><span>Study mastery</span></div>
            <div className="flex items-center gap-1.5"><span className="w-4 h-1.5 rounded-full bg-[#FB7185]" /><span>Tasks completed</span></div>
            <div className="flex items-center gap-1.5"><span className="w-4 h-1.5 rounded-full bg-[#181A1D]" /><span>Activity time</span></div>
          </div>
        </div>

        {/* Right Dark Calendar */}
        <div className="lg:col-span-5 bg-[#181A1D] text-white rounded-[34px] p-6 sm:p-7 shadow-lg border border-[#2B2F36] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-white text-base">Your Training Days</h3>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#8F96A3] bg-[#262A30] px-3 py-1 rounded-full">
              <span>{now.toLocaleDateString(undefined, { month: 'long' })}</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#6D7482] mb-2">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>

          <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium">
            {Array.from({ length: 28 }).map((_, idx) => {
              const dayNum = idx + 1;
              const isToday = dayNum === now.getDate();
              const isCompleted = [1, 2, 4, 7, 8, 14, 17, 19, 23, 28].includes(dayNum);
              return (
                <div key={idx} className="flex items-center justify-center py-0.5">
                  <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isToday ? "bg-[#FACC15] text-[#181A1D] font-black shadow-md" : isCompleted ? "bg-[#282C33] text-white" : "text-[#8E95A2]"
                  }`}>
                    {dayNum}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#2A2E35] text-[10px] text-[#8E95A2]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FACC15]" /> Current day</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#282C33]" /> Done</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-slate-500" /> Scheduled</span>
          </div>
        </div>
      </div>

      {/* Habits & Target Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-[32px] p-5 sm:p-6 shadow-xs border border-[#ECE6DC] flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-extrabold text-[#181A1D] text-sm sm:text-base">Study Target for Today</h3>
              <p className="text-xs text-[#8E8880] font-medium mt-0.5">Keep your focus consistent</p>
              <button onClick={onEditProfile} className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181A1D] text-white text-[11px] font-bold cursor-pointer">
                <Pencil className="w-3 h-3 text-[#FACC15]" /> Change Goal
              </button>
            </div>
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#F4F1EB" strokeWidth="9" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#FA7268" strokeWidth="9" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * Math.min(100, (hoursStudied / dailyTarget) * 100)) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold text-[#8E8880] uppercase">Goal</span>
                <span className="font-display font-black text-base sm:text-lg text-[#181A1D]">{Math.round((hoursStudied / dailyTarget) * 8500) || 8500}</span>
                <span className="text-[9px] text-[#A8A29A]">pts</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-5 sm:p-6 shadow-xs border border-[#ECE6DC] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-[#181A1D] text-sm sm:text-base">Syllabus Mastery Plan</h3>
              <span className="font-display font-black text-xs text-[#181A1D]">{stats.completionRate || 68}% Completed</span>
            </div>
            <div className="relative pt-4 pb-1">
              <div className="w-full bg-[#F4F1EB] h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#181A1D] h-full rounded-full" style={{ width: `${Math.max(15, stats.completionRate || 68)}%` }} />
              </div>
              <div className="absolute top-0 -translate-y-1/2 -translate-x-1/2 bg-[#181A1D] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm" style={{ left: `${Math.max(20, Math.min(80, stats.completionRate || 68))}%` }}>
                {hoursStudied}h done
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-[34px] p-6 sm:p-7 shadow-xs border border-[#ECE6DC]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-extrabold text-[#181A1D] text-base">My Habits & Study Tasks</h3>
            <button onClick={onAddTask} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181A1D] text-white text-xs font-bold cursor-pointer">
              <span>Add New</span><span className="w-4 h-4 rounded-full bg-[#FACC15] text-[#181A1D] flex items-center justify-center font-black text-xs">+</span>
            </button>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 4).map((t, idx) => (
              <div key={t.id} className="p-3.5 rounded-2xl bg-[#F8F6F1] flex items-center justify-between gap-3 border border-[#EFE9DF]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full ${idx % 2 === 0 ? "bg-[#DDD7CB]" : "bg-[#181A1D] text-[#FACC15]"} flex items-center justify-center text-xs font-bold shrink-0`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${t.completed ? "line-through text-[#9E9890]" : "text-[#181A1D]"}`}>{t.title}</p>
                    <p className="text-[10px] text-[#8E8880] font-medium truncate">{t.subject} · {t.category || "Assignment"}</p>
                  </div>
                </div>
                <button onClick={() => toggleTask(t.id)} className="w-7 h-7 rounded-full flex items-center justify-center text-[#8E8880] hover:text-[#181A1D] cursor-pointer">
                  {t.completed ? <CheckCircle2 className="w-5 h-5 text-[#181A1D]" /> : <Circle className="w-5 h-5 text-[#C4BEB4]" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   TASKS & TOPICS & MODAL SUB-COMPONENTS
   ========================================================================== */

function TasksView({ tasks, subjectList, onAdd, onEdit, onDelete, onToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold text-[#181A1D]">Assignments & Tasks</h2>
        <button onClick={onAdd} className="bg-[#181A1D] hover:bg-black text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <Plus className="w-4 h-4 text-[#FACC15]" /> Add Task
        </button>
      </div>

      <div className="space-y-2.5">
        {filtered.map((t) => (
          <div key={t.id} className="p-4 rounded-[24px] bg-white border border-[#ECE6DC] flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <button onClick={() => onToggle(t.id)} className="cursor-pointer">
                {t.completed ? <CheckCircle2 className="w-5 h-5 text-[#181A1D]" /> : <Circle className="w-5 h-5 text-[#D6D3D1]" />}
              </button>
              <div>
                <p className={`text-xs sm:text-sm font-bold ${t.completed ? "line-through text-[#8E8880]" : "text-[#181A1D]"}`}>{t.title}</p>
                <p className="text-[11px] text-[#8E8880]">{t.subject} · Due {fmtDisplayDate(t.dueDate)} ({fmtTime12(t.dueTime)})</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(t)} className="p-1.5 rounded-full hover:bg-[#F8F6F1] text-[#8E8880]"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(t.id)} className="p-1.5 rounded-full hover:bg-[#FFF1F2] text-[#E11D48]"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicsView({ topics, subjectList, onAdd, onDelete, onToggle, availability, toggleSlot, onApplyPreset }) {
  const [form, setForm] = useState({ name: "", subject: "", difficulty: "Medium" });

  const submit = () => {
    if (!form.name.trim() || !form.subject.trim()) return;
    onAdd(form);
    setForm({ name: "", subject: "", difficulty: "Medium" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-extrabold text-[#181A1D] mb-3">Study Topics & Mastery</h2>
        <div className="p-4 rounded-[28px] bg-white border border-[#ECE6DC] mb-4 flex gap-3 flex-wrap items-end">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Topic / Concept name" className="flex-1 min-w-[200px] bg-[#F8F6F1] border border-[#ECE6DC] rounded-full px-4 py-2 text-xs text-[#181A1D]" />
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="w-40 bg-[#F8F6F1] border border-[#ECE6DC] rounded-full px-4 py-2 text-xs text-[#181A1D]" />
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="bg-[#F8F6F1] border border-[#ECE6DC] rounded-full px-4 py-2 text-xs text-[#181A1D]">
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
          <button onClick={submit} className="bg-[#181A1D] text-white px-5 py-2 rounded-full text-xs font-bold cursor-pointer flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-[#FACC15]" /> Add Topic
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {topics.map((t) => (
            <div key={t.id} className="p-3.5 rounded-[24px] bg-white border border-[#ECE6DC] flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => onToggle(t.id)} className="cursor-pointer">
                  {t.completed ? <CheckCircle2 className="w-5 h-5 text-[#181A1D]" /> : <Circle className="w-5 h-5 text-[#D6D3D1]" />}
                </button>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${t.completed ? "line-through text-[#8E8880]" : "text-[#181A1D]"}`}>{t.name}</p>
                  <p className="text-[10px] text-[#8E8880]">{t.subject} · {t.difficulty}</p>
                </div>
              </div>
              <button onClick={() => onDelete(t.id)} className="p-1 rounded-full text-[#8E8880] hover:text-[#E11D48]"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskModal({ editing, subjectList, onClose, onSave }) {
  const [form, setForm] = useState(() => editing || {
    title: "", subject: "", category: "Assignment", dueDate: toISODate(addDays(new Date(), 3)), dueTime: "18:00", priority: "Medium", estHours: 2,
  });
  const valid = form.title.trim() && form.subject.trim() && form.dueDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6 border border-[#ECE6DC] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F4F1EB]">
          <h3 className="font-display font-extrabold text-[#181A1D]">{editing ? "Edit Task" : "Add Event / Task"}</h3>
          <button onClick={onClose} className="text-[#8E8880] hover:text-[#181A1D]"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event / Task Title" className="w-full bg-[#F8F6F1] border border-[#ECE6DC] rounded-full px-4 py-2 text-xs text-[#181A1D]" />
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject / Topic" className="w-full bg-[#F8F6F1] border border-[#ECE6DC] rounded-full px-4 py-2 text-xs text-[#181A1D]" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-[#F8F6F1] border border-[#ECE6DC] rounded-full px-4 py-2 text-xs text-[#181A1D]" />
            <input type="time" value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} className="w-full bg-[#F8F6F1] border border-[#ECE6DC] rounded-full px-4 py-2 text-xs text-[#181A1D]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-[#F4F1EB]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-[#8E8880]">Cancel</button>
          <button disabled={!valid} onClick={() => onSave(form)} className="px-5 py-2 rounded-full bg-[#181A1D] text-white text-xs font-bold cursor-pointer">Save</button>
        </div>
      </div>
    </div>
  );
}

function NotificationDrawer({ alerts, onClose, setView }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-6 top-16 w-80 sm:w-96 max-h-96 overflow-y-auto rounded-3xl border border-[#ECE6DC] bg-white shadow-2xl z-50 p-2">
        <div className="px-4 py-3 border-b border-[#F4F1EB] flex items-center justify-between">
          <p className="font-display font-bold text-sm text-[#181A1D]">Reminders & Alerts</p>
          <button onClick={onClose} className="text-[#8E8880] hover:text-[#181A1D]"><X className="w-4 h-4" /></button>
        </div>
        <ul className="divide-y divide-[#F4F1EB] max-h-72 overflow-y-auto">
          {alerts.map((a) => (
            <li key={a.id} className="px-4 py-3 hover:bg-[#F8F6F1] text-xs">
              <p className="font-bold text-[#181A1D]">{a.title}</p>
              <p className="text-[11px] text-[#8E8880]">{a.subject} · {fmtDisplayDate(a.dueDate)} ({fmtTime12(a.dueTime)})</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
