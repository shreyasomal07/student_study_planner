import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LayoutDashboard, CheckSquare, BookOpen, BookOpenCheck, CalendarRange, Bell, Plus,
  Sparkles, CheckCircle2, Circle, Clock, Flame, TrendingUp, X, ChevronLeft,
  ChevronRight, ArrowUpDown, GraduationCap, Trash2, Pencil, Loader2,
  AlertTriangle, CalendarClock, Coffee, Target, BarChart3, Edit3, LogOut, User,
  Calendar, Search, Filter, Layers, Sun, Moon, Zap, Tag, Check, Award, School,
  Upload, FileText, MapPin, MoreHorizontal, ChevronDown, RotateCcw, Paperclip,
  Activity, Users, FileSpreadsheet, Settings, MessageSquare, CreditCard, FolderArchive,
  PieChart, Play, Pause, FastForward, Bot, ArrowRight, ArrowLeft
} from "lucide-react";
import PomodoroTimer from "./components/PomodoroTimer";
import ClassTimetableManager from "./components/ClassTimetableManager";
import ExamTimetableManager from "./components/ExamTimetableManager";
import DashboardNotesAndTodo from "./components/DashboardNotesAndTodo";
import AIChatScheduleAssistant from "./components/AIChatScheduleAssistant";
import { DAY_KEYS, DAY_LABELS, pad, toISODate, addDays, startOfDay, startOfWeek } from "./utils/dateUtils";

/* ============================================================================
   CONSTANTS & THEME TOKENS
   ========================================================================== */

const DAY_SHORT_LABELS = { Mon: "MONDAY", Tue: "TUESDAY", Wed: "WEDNESDAY", Thu: "THU", Fri: "FRIDAY", Sat: "SATURDAY", Sun: "SUNDAY" };
const GRID_HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 -> 22:00

const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };
const PRIORITY_STYLES = {
  High: "bg-vital-spark text-liminal-night border-vital-spark font-bold",
  Medium: "bg-rooted-strength/30 text-liminal-night border-rooted-strength font-semibold",
  Low: "bg-calm-awakening/25 text-inner-resolve border-calm-awakening/50 font-semibold",
};

const CATEGORIES = ["Assignment", "Exam Prep", "Project", "Homework", "Reading / Lab"];

/* ============================================================================
   HERO CONTENT CONSTANTS (Matching Reference Image Layout & Text)
   ========================================================================== */

const HERO_CONTENT = {
  titleLine1: "Study Smarter,",
  titleLine2: "Stress Less.",
  subtitle: "PLAN IT . FOCUS ON IT . ACE IT",
  cta: "BEGIN YOUR JOURNEY",
  supportingText: "Your AI-powered academic workspace. Build smart timetables, track tasks and exams, and stay in flow with focus sprints, all in one calm place."
};

function SharedTopBar({ 
  view, 
  setView, 
  tasksCount = 0, 
  classesCount = 0, 
  examsCount = 0, 
  now = new Date(), 
  onEditProfile, 
  onSignOut, 
  isHero = false 
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", badge: "HOME", isSpecial: false },
    { id: "timetable", label: "Timetable", badge: "AI", isSpecial: true },
    { id: "tasks", label: "Tasks", badge: String(tasksCount), isSpecial: false },
    { id: "classes", label: "Classes", badge: String(classesCount), isSpecial: false },
    { id: "exams", label: "Exams", badge: String(examsCount), isSpecial: false },
    { id: "pomodoro", label: "Focus Mode", badge: "TIMER", isSpecial: true },
  ];

  const chipBg = isHero
    ? "bg-wild-light/15 backdrop-blur-md border border-wild-light/25 text-wild-light shadow-xs"
    : "bg-steady-renewal/90 backdrop-blur-md border border-rooted-strength/50 text-liminal-night shadow-xs";

  const chipHoverBg = isHero
    ? "hover:bg-wild-light/25"
    : "hover:bg-wild-light";

  return (
    <div className="relative z-30 flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4 w-full">
      
      {/* Center/Left: Shared floating navbar with even spacing and NO dots */}
      <div className="w-full lg:w-auto flex justify-center lg:justify-start overflow-x-auto py-0.5 max-w-full custom-scrollbar">
        <nav className={`rounded-full p-1 sm:p-1.5 backdrop-blur-md transition-all flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-full ${
          isHero
            ? "bg-wild-light/15 border border-wild-light/25 shadow-lg text-wild-light"
            : "bg-steady-renewal/90 border border-rooted-strength/50 shadow-md text-liminal-night"
        }`}>
          {navItems.map((item) => {
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? isHero
                      ? "bg-vital-spark text-liminal-night shadow-md font-bold scale-[1.02]"
                      : "bg-liminal-night text-wild-light shadow-xs font-bold"
                    : isHero
                      ? "text-wild-light/85 hover:text-wild-light hover:bg-wild-light/15"
                      : "text-inner-resolve hover:text-liminal-night hover:bg-rooted-strength/20"
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? isHero
                      ? "bg-liminal-night text-wild-light font-bold"
                      : "bg-vital-spark text-liminal-night font-bold"
                    : isHero
                      ? "bg-wild-light/20 text-wild-light font-semibold"
                      : item.id === "exams"
                      ? "bg-blush-rose/25 text-liminal-night font-bold"
                      : item.isSpecial
                      ? "bg-calm-awakening/30 text-inner-resolve font-extrabold"
                      : "bg-rooted-strength/30 text-liminal-night font-semibold"
                }`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Date chip + Edit Profile + Logout */}
      <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap shrink-0">
        <div className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${chipBg}`}>
          <Calendar className="w-3.5 h-3.5 text-vital-spark" />
          <span className="hidden sm:inline">{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span className="sm:hidden">{now.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>
        </div>
        <button
          onClick={onEditProfile}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] ${chipBg} ${chipHoverBg}`}
          title="Edit Profile"
        >
          <Pencil className="w-3.5 h-3.5 text-vital-spark" />
          <span className="hidden sm:inline">Edit Profile</span>
        </button>
        <button
          onClick={onSignOut}
          className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-[1.02] ${chipBg} ${chipHoverBg}`}
          title="Log out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}

function GrowthStudentAnimation() {
  return (
    <div className="relative w-full max-w-[540px] sm:max-w-[620px] lg:max-w-[700px] xl:max-w-[780px] 2xl:max-w-[840px] mx-auto select-none flex items-center justify-center">
      <style>{`
        @keyframes floatGrowthAnimation {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.4deg); }
        }
        @keyframes glowGrowthAnimation {
          0%, 100% { opacity: 0.35; transform: scale(0.96); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-growth-float {
          animation: floatGrowthAnimation 5.5s ease-in-out infinite;
        }
        .animate-growth-glow {
          animation: glowGrowthAnimation 4s ease-in-out infinite;
        }
      `}</style>

      {/* Atmospheric ambient glow behind the artwork (NO BOX, soft radiant feather) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-vital-spark/25 via-blush-rose/20 to-calm-awakening/20 rounded-full blur-3xl pointer-events-none animate-growth-glow" />

      {/* Exact theme-calibrated growth student illustration without any box */}
      <img
        src="/growth-student-theme.png"
        alt="Student Academic Growth & Timetable Progress"
        className="relative z-10 w-full h-auto object-contain filter drop-shadow-[0_24px_50px_rgba(44,47,64,0.42)] animate-growth-float transition-transform duration-500 hover:scale-[1.02]"
      />
    </div>
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
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

function buildWeekSlots(availability = {}, weekStart, collegeSchedule = [], examSchedule = [], dailyTargetHours = 4) {
  const slots = [];
  const targetStudySlotsPerDay = Math.max(1, Math.min(8, Math.round(Number(dailyTargetHours) || 4)));

  for (let d = 0; d < 7; d++) {
    const date = addDays(weekStart, d);
    const dateISO = toISODate(date);
    const dayKey = DAY_KEYS[d];

    // NOTE: Classes are NOT added into the timetable (per user instruction: pure study timetable)

    // Extract Study Hours from user availability
    let userAvail = availability && Array.isArray(availability[dayKey]) ? [...availability[dayKey]] : [];
    if (userAvail.length === 0) {
      // Default preferred study windows: evening 17-21 or weekend mornings
      userAvail = (dayKey === "Sat" || dayKey === "Sun") ? [10, 11, 12, 14, 15, 16] : [17, 18, 19, 20, 21];
    }

    const hours = [...new Set(userAvail)].sort((a, b) => a - b);
    if (hours.length === 0) continue;

    const runs = [];
    let run = [hours[0]];
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] === hours[i - 1] + 1) run.push(hours[i]);
      else { runs.push(run); run = [hours[i]]; }
    }
    runs.push(run);

    let dayStudySlotsCount = 0;

    runs.forEach((r) => {
      let cursorMin = r[0] * 60;
      const endMin = (r[r.length - 1] + 1) * 60;
      while (cursorMin + 50 <= endMin && dayStudySlotsCount < targetStudySlotsPerDay) {
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
        dayStudySlotsCount++;
        cursorMin = blockEndMin;
        if (cursorMin + 10 <= endMin && dayStudySlotsCount < targetStudySlotsPerDay) {
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

function buildWorkQueue(tasks = [], topics = [], examSchedule = []) {
  // 1. Task & Assignment Items from the Tasks Section
  const taskItems = (tasks || [])
    .filter((t) => !t.completed)
    .map((t) => {
      const estHours = Number(t.estHours) || 2;
      const category = t.category || "Assignment";
      return {
        key: `task-${t.id}`,
        refId: t.id,
        type: "task",
        title: `${category === "Assignment" ? "📝 Assignment" : "📌 " + category}: ${t.title}`,
        rawTitle: t.title,
        subtitle: `${t.subject} · ${category}`,
        subject: t.subject || "General",
        priority: t.priority || "Medium",
        category: category,
        room: "Study Desk / Work Area",
        participants: ["Self"],
        remainingMin: Math.max(50, Math.round(estHours * 60)),
        deadline: parseDateTime(t.dueDate, t.dueTime),
        dueDate: t.dueDate,
        dueTime: t.dueTime,
      };
    });

  // 2. Self Study Topics & Chapters
  const topicItems = (topics || [])
    .filter((t) => !t.completed)
    .map((t) => ({
      key: `topic-${t.id}`,
      refId: t.id,
      type: "topic",
      title: `📚 Self Study: ${t.name}`,
      rawTitle: t.name,
      subtitle: `${t.subject} · Subject Deep Dive`,
      subject: t.subject || "General",
      priority: t.priority || (t.difficulty === "Hard" ? "High" : t.difficulty === "Medium" ? "Medium" : "Low"),
      difficulty: t.difficulty || "Medium",
      category: "Self Study",
      room: "Quiet Study Area",
      participants: ["Self"],
      remainingMin: t.totalSessions ? Math.max(50, (t.totalSessions - (t.sessionsDone || 0)) * 50) : (t.difficulty === "Hard" ? 250 : t.difficulty === "Medium" ? 150 : 100),
      deadline: null,
      dueDate: null,
      dueTime: null,
    }));

  return { taskItems, topicItems };
}

export { buildMockData, startOfWeek, toISODate, addDays, startOfDay, pad, DAY_KEYS, DAY_LABELS };

export function generateTimetable(tasks, topics, availability, weekStart, collegeSchedule = [], examSchedule = [], dailyTargetHours = 4) {
  const slots = buildWeekSlots(availability, weekStart, collegeSchedule, examSchedule, dailyTargetHours);
  const { taskItems, topicItems } = buildWorkQueue(tasks, topics, examSchedule);

  // Group study slots by date for balanced daily allocation
  const slotsByDate = {};
  slots.forEach((s) => {
    if (s.type !== "study") return;
    if (!slotsByDate[s.date]) slotsByDate[s.date] = [];
    slotsByDate[s.date].push(s);
  });

  const allTaskItems = taskItems.map(item => ({ ...item }));
  const allTopicItems = topicItems.map(item => ({ ...item }));

  const PRIORITY_SCORES = { High: 3, Medium: 2, Low: 1 };

  // For each day, guarantee a balanced mix of tasks/assignments and self-study sessions
  Object.keys(slotsByDate).sort().forEach((dateStr) => {
    const dayStudySlots = slotsByDate[dateStr];
    const dayItemUsage = {};
    let lastScheduledType = null;
    let lastScheduledItemKey = null;

    dayStudySlots.forEach((slot, slotIndex) => {
      const slotMoment = parseDateTime(slot.date, slot.start);
      const candidates = [];

      // 1. Candidate Tasks & Assignments (from Tasks section)
      allTaskItems.forEach((task) => {
        if (task.remainingMin <= 0) return;
        if (task.deadline && slotMoment >= task.deadline) return;
        let score = 90 + (PRIORITY_SCORES[task.priority] || 2) * 30;
        if (task.deadline) {
          const hoursUntil = (task.deadline.getTime() - slotMoment.getTime()) / (1000 * 3600);
          if (hoursUntil <= 24) score += 220; // Urgent due today / <24h!
          else if (hoursUntil <= 48) score += 140; // Due in <48h!
          else if (hoursUntil <= 96) score += 70;
        }
        if (task.priority === "High") score += 60;
        
        // Balanced rotation: if last slot was already a task, leave room for self study
        if (lastScheduledType === "task") score -= 45;
        if (lastScheduledItemKey === task.key) score -= 50;
        if ((dayItemUsage[task.key] || 0) >= 2) score -= 80;

        candidates.push({ item: task, score, type: "task" });
      });

      // 2. Candidate Self Study Sessions (Topics & Subject Practice)
      allTopicItems.forEach((topic) => {
        if (topic.remainingMin <= 0) return;
        let score = 70 + (PRIORITY_SCORES[topic.priority] || 2) * 25;
        if (topic.priority === "High") score += 40;
        if (topic.difficulty === "Hard") score += 30;
        
        // Boost self study if previous slot was task to balance the day
        if (lastScheduledType === "task") score += 35;
        if (lastScheduledItemKey === topic.key) score -= 45;
        if ((dayItemUsage[topic.key] || 0) >= 2) score -= 70;

        candidates.push({ item: topic, score, type: "topic" });
      });

      if (candidates.length === 0) {
        // Guaranteed dedicated self-study fallback
        const generalSubject = topics.length > 0 ? topics[slotIndex % topics.length].subject : "General";
        slot.assigned = {
          refId: null,
          itemType: "topic",
          title: `📚 Self Study: ${generalSubject} Core Concepts & Practice`,
          rawTitle: `Self Study: ${generalSubject}`,
          subtitle: `${generalSubject} · Dedicated Self Study`,
          subject: generalSubject,
          priority: "Medium",
          category: "Self Study",
          room: "Quiet Study Area",
        };
        lastScheduledType = "topic";
        lastScheduledItemKey = null;
        return;
      }

      // Sort candidate items by highest score
      candidates.sort((a, b) => b.score - a.score);
      const chosen = candidates[0].item;

      slot.assigned = {
        refId: chosen.refId,
        itemType: chosen.type,
        title: chosen.title,
        rawTitle: chosen.rawTitle || chosen.title,
        subtitle: chosen.subtitle,
        subject: chosen.subject,
        priority: chosen.priority,
        category: chosen.category,
        room: chosen.room,
        attachment: chosen.attachment,
        participants: chosen.participants,
        dueDate: chosen.dueDate,
        dueTime: chosen.dueTime
      };

      chosen.remainingMin -= 50;
      dayItemUsage[chosen.key] = (dayItemUsage[chosen.key] || 0) + 1;
      lastScheduledType = chosen.type;
      lastScheduledItemKey = chosen.key;
    });
  });

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
  const [selectedTimetableDate, setSelectedTimetableDate] = useState(() => toISODate(new Date()));
  const [activePomodoroSession, setActivePomodoroSession] = useState(null);
  const [celebrationToast, setCelebrationToast] = useState({ show: false, title: "", duration: 0 });
  const [notifOpen, setNotifOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
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
          dashboardScratchpad
        });
      }
    }, 300);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [tasks, topics, availability, collegeSchedule, examSchedule, events, timetable, lastGenerated, dashboardTodos, dashboardNotes, dashboardScratchpad]);

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
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      setTimetable((curr) => curr.map(b => {
        if (b.assigned?.refId === id && b.assigned?.itemType === "task") {
          return {
            ...b,
            assigned: {
              refId: null,
              itemType: "study",
              title: "Deep Focus & Self Study",
              rawTitle: "Deep Focus & Self Study",
              subtitle: "Subject Revision & Problem Practice",
              subject: "General",
              priority: "Medium",
              category: "Revision",
              room: "Quiet Study Area",
            }
          };
        }
        return b;
      }));
      return updated;
    });
  }, []);

  const toggleTask = useCallback((id) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      const willComplete = !target.completed;

      // Sync linked timetable blocks
      setTimetable((curr) => curr.map(b => {
        if (b.assigned?.refId === id && b.assigned?.itemType === "task") {
          return { ...b, completed: willComplete };
        }
        return b;
      }));

      if (willComplete) {
        if (taskRemovalTimers.current[id]) {
          clearTimeout(taskRemovalTimers.current[id]);
        }
        taskRemovalTimers.current[id] = setTimeout(() => {
          deleteTask(id);
        }, 15000);

        return prev.map((t) => (t.id === id ? { ...t, completed: true } : t));
      } else {
        if (taskRemovalTimers.current[id]) {
          clearTimeout(taskRemovalTimers.current[id]);
          delete taskRemovalTimers.current[id];
        }
        return prev.map((t) => (t.id === id ? { ...t, completed: false } : t));
      }
    });
  }, [deleteTask]);

  const saveTask = useCallback((taskData) => {
    setTasks((prev) => {
      let updated;
      if (taskData.id) {
        updated = prev.map((t) => (t.id === taskData.id ? { ...t, ...taskData } : t));
      } else {
        updated = [{ ...taskData, id: uid(), completed: false, sessionsDone: 0, totalSessions: taskData.totalSessions || 4 }, ...prev];
      }

      // Automatically re-generate timetable so the new task/assignment is scheduled into the Day Schedule
      if (availability && Object.keys(availability).length > 0) {
        const newTimetable = generateTimetable(
          updated,
          topics,
          availability,
          weekStart,
          collegeSchedule,
          examSchedule,
          student?.dailyTargetHours || 4
        );
        setTimetable(newTimetable);
        setLastGenerated(new Date().toISOString());
      }
      return updated;
    });
  }, [topics, availability, weekStart, collegeSchedule, examSchedule, student]);

  const addTopic = useCallback((topicData) => {
    setTopics((prev) => {
      const newTopic = { ...topicData, id: uid(), completed: false, sessionsDone: 0, totalSessions: topicData.totalSessions || 4 };
      const updated = [...prev, newTopic];
      if (availability && Object.keys(availability).length > 0) {
        const newTimetable = generateTimetable(
          tasks,
          updated,
          availability,
          weekStart,
          collegeSchedule,
          examSchedule,
          student?.dailyTargetHours || 4
        );
        setTimetable(newTimetable);
        setLastGenerated(new Date().toISOString());
      }
      return updated;
    });
  }, [tasks, availability, weekStart, collegeSchedule, examSchedule, student]);

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

      // Sync linked timetable blocks
      setTimetable((curr) => curr.map(b => {
        if (b.assigned?.refId === id && b.assigned?.itemType === "topic") {
          return { ...b, completed: willComplete };
        }
        return b;
      }));

      if (willComplete) {
        if (topicRemovalTimers.current[id]) {
          clearTimeout(topicRemovalTimers.current[id]);
        }
        topicRemovalTimers.current[id] = setTimeout(() => {
          deleteTopic(id);
        }, 15000);

        return prev.map((t) => (t.id === id ? { ...t, completed: true } : t));
      } else {
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

      // Sync linked task or topic
      if (target.assigned?.refId) {
        if (target.assigned.itemType === "task") {
          setTasks((curr) => curr.map((t) => (t.id === target.assigned.refId ? { ...t, completed: willComplete } : t)));
        } else if (target.assigned.itemType === "topic") {
          setTopics((curr) => curr.map((tp) => (tp.id === target.assigned.refId ? { ...tp, completed: willComplete, status: willComplete ? "Mastered" : "In Progress" } : tp)));
        }
      }

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
      const slots = generateTimetable(
        tasks, 
        topics, 
        availability, 
        weekStart, 
        collegeSchedule, 
        examSchedule, 
        student?.dailyTargetHours || 4
      );
      setTimetable(slots);
      setLastGenerated(new Date().toISOString());
      setGenerating(false);
    }, 600);
  }, [tasks, topics, availability, weekStart, collegeSchedule, examSchedule, student]);

  /* ---- Pomodoro Integration Handlers ---- */
  const handleStartPomodoroForSession = useCallback((block) => {
    const rawTitle = block.assigned?.title || "Study Session";
    const displayTitle = rawTitle.replace(/^Topic:\s*/i, "");
    setActivePomodoroSession({
      blockId: block.id,
      title: displayTitle,
      subject: block.assigned?.subject || "General",
      refId: block.assigned?.refId,
      itemType: block.assigned?.itemType || "topic"
    });
    setView("pomodoro"); // Switch directly to Focus Mode tab
  }, []);

  const handleFinishStudying = useCallback((sessionData, durationMins = 50) => {
    if (!sessionData) return;
    const topicTitle = typeof sessionData === "string" ? sessionData : (sessionData.title || "");
    const blockId = sessionData.blockId || (activePomodoroSession?.blockId);
    const refId = sessionData.refId || (activePomodoroSession?.refId);
    const itemType = sessionData.itemType || (activePomodoroSession?.itemType);

    // 1. Mark matching study block in timetable as completed
    setTimetable((prev) =>
      prev.map((b) => {
        if (blockId && b.id === blockId) {
          return { ...b, completed: true };
        }
        const bTitle = (b.assigned?.title || "").replace(/^Topic:\s*/i, "");
        if (topicTitle && bTitle.toLowerCase() === topicTitle.toLowerCase()) {
          return { ...b, completed: true };
        }
        return b;
      })
    );

    // 2. Mark task / topic as completed in database state
    if (refId) {
      if (itemType === "task") {
        setTasks((prev) => prev.map((t) => (t.id === refId ? { ...t, completed: true } : t)));
      } else if (itemType === "topic") {
        setTopics((prev) => prev.map((tp) => (tp.id === refId ? { ...tp, completed: true, status: "Mastered" } : tp)));
      }
    } else if (topicTitle) {
      setTasks((prev) =>
        prev.map((t) =>
          t.title.toLowerCase() === topicTitle.toLowerCase() || topicTitle.toLowerCase().includes(t.title.toLowerCase())
            ? { ...t, completed: true }
            : t
        )
      );
      setTopics((prev) =>
        prev.map((tp) =>
          tp.name.toLowerCase() === topicTitle.toLowerCase() || topicTitle.toLowerCase().includes(tp.name.toLowerCase())
            ? { ...tp, completed: true, status: "Mastered" }
            : tp
        )
      );
    }

    // 3. Show celebration toast
    setCelebrationToast({
      show: true,
      title: topicTitle || "Study Session",
      duration: durationMins
    });
    setTimeout(() => {
      setCelebrationToast((prev) => ({ ...prev, show: false }));
    }, 5000);
  }, [activePomodoroSession]);

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
    <div className="w-full min-h-screen bg-wild-light text-liminal-night font-sans antialiased flex flex-col">
      
      {/* ----------------- SHARED TOP BAR FOR NON-DASHBOARD VIEWS ----------------- */}
      {view !== "dashboard" && (
        <header className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 pt-5 sm:pt-8 pb-3">
          <SharedTopBar
            view={view}
            setView={setView}
            tasksCount={tasks.length}
            classesCount={collegeSchedule.length}
            examsCount={examSchedule.length}
            now={now}
            onEditProfile={onEditProfile}
            onSignOut={onSignOut}
            isHero={false}
          />
        </header>
      )}

      {/* MAIN CONTENT CANVAS */}
      <main className={`flex-1 w-full flex flex-col ${view !== "dashboard" ? "max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-4" : ""}`}>
        
        {/* ----------------- SCHEDULE / TIMETABLE VIEW (Single Day + Side-by-Side Pomodoro) ----------------- */}
        {view === "timetable" && (() => {
          const activeSelectedDate = selectedTimetableDate || toISODate(now);
          const selectedDateObj = new Date(`${activeSelectedDate}T00:00:00`);
          const selectedDayLabel = isNaN(selectedDateObj.getTime())
            ? "Today"
            : selectedDateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
          
          const selectedDayBlocks = timetable.filter(b => b.date === activeSelectedDate);
          const selectedStudyBlocks = selectedDayBlocks.filter(b => b.type === "study");
          const selectedTaskBlocks = selectedStudyBlocks.filter(b => b.assigned?.itemType === "task");
          const selectedSelfStudyBlocks = selectedStudyBlocks.filter(b => b.assigned?.itemType === "topic" || !b.assigned?.itemType);
          const totalStudyHoursPlanned = (selectedStudyBlocks.length * 50 / 60).toFixed(1);

          return (
            <div className="space-y-4 flex-1 flex flex-col min-w-0">
              
              {/* Celebration Toast Banner */}
              {celebrationToast.show && (
                <div className="p-3.5 rounded-2xl bg-calm-awakening/20 border border-calm-awakening/50 text-liminal-night text-xs sm:text-sm font-extrabold flex items-center justify-between shadow-md animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-calm-awakening text-wild-light flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-liminal-night">
                        Topic Mastered & Logged!
                      </p>
                      <p className="text-xs font-semibold text-inner-resolve">
                        Finished studying <strong className="text-liminal-night">"{celebrationToast.title}"</strong> · +{celebrationToast.duration}m logged to Study Analytics.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCelebrationToast(prev => ({ ...prev, show: false }))}
                    className="text-liminal-night hover:text-black font-black text-sm px-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Top Toolbar: Week Navigator Tabs & Action Buttons */}
              <div className="bg-white/80 backdrop-blur-md rounded-[28px] p-3.5 sm:p-4 border border-rooted-strength/30 shadow-xs space-y-3">
                
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-liminal-night text-vital-spark flex items-center justify-center shadow-xs">
                      <CalendarRange className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-liminal-night text-base sm:text-lg tracking-tight">
                        AI Daily Study Schedule
                      </h2>
                      <p className="text-[11px] text-liminal-night/70 font-medium">
                        Optimized for tasks, assignments & self-study with a {student?.dailyTargetHours || 4}h daily goal
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAiChatOpen(true)}
                      className="px-3.5 py-1.5 rounded-full bg-linear-to-r from-liminal-night via-inner-resolve to-liminal-night hover:from-liminal-night hover:to-inner-resolve text-wild-light text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all border border-vital-spark/40 group active:scale-95"
                      title="Ask AI to customize your schedule based on tasks, assignments or self study"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-vital-spark group-hover:rotate-12 transition-transform" />
                      <span>Customize with AI</span>
                    </button>

                    <button
                      onClick={() => setSelectedTimetableDate(toISODate(now))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                        activeSelectedDate === toISODate(now)
                          ? "bg-[#556574] text-vital-spark border-[#556574]"
                          : "bg-white hover:bg-wild-light text-liminal-night border-rooted-strength/30"
                      }`}
                    >
                      Jump to Today
                    </button>

                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="px-3.5 py-1.5 rounded-full bg-white border border-rooted-strength/30 hover:bg-wild-light text-xs font-bold text-liminal-night shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Regenerate Plan with AI"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 text-vital-spark ${generating ? "animate-spin" : ""}`} />
                      <span>{generating ? "Rebalancing..." : "Regenerate Plan"}</span>
                    </button>

                    <button
                      onClick={() => setTaskModal({ open: true, editing: null })}
                      className="bg-liminal-night hover:opacity-90 text-wild-light px-3.5 py-1.5 rounded-full font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-vital-spark" />
                      <span>Add Task</span>
                    </button>
                  </div>
                </div>

                {/* 7-Day Quick Switcher Bar */}
                <div className="grid grid-cols-7 gap-2 pt-1 border-t border-rooted-strength/30">
                  {DAY_KEYS.map((d, i) => {
                    const colDate = addDays(weekStart, i);
                    const colDateISO = toISODate(colDate);
                    const isSelected = colDateISO === activeSelectedDate;
                    const isToday = colDateISO === toISODate(now);
                    const dayBlocks = timetable.filter(b => b.date === colDateISO);
                    const studyCount = dayBlocks.filter(b => b.type === "study").length;
                    const taskCount = dayBlocks.filter(b => b.type === "study" && b.assigned?.itemType === "task").length;

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedTimetableDate(colDateISO)}
                        className={`p-2 sm:p-2.5 rounded-2xl text-center transition-all cursor-pointer border flex flex-col items-center justify-between ${
                          isSelected
                            ? "bg-[#556574] text-wild-light border-[#556574] shadow-xs scale-[1.02]"
                            : "bg-wild-light hover:bg-white border-rooted-strength/40 text-liminal-night"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                            isSelected ? "text-vital-spark" : "text-liminal-night/60"
                          }`}>
                            {d}
                          </span>
                          {isToday && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                              isSelected ? "bg-vital-spark text-liminal-night" : "bg-calm-awakening/20 text-calm-awakening font-extrabold"
                            }`}>
                              Today
                            </span>
                          )}
                        </div>

                        <span className={`text-sm sm:text-base font-bold my-0.5 ${
                          isSelected ? "text-wild-light" : "text-liminal-night"
                        }`}>
                          {colDate.getDate()}
                        </span>

                        {/* Micro indicators */}
                        <div className="flex items-center gap-1 mt-0.5">
                          {taskCount > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-vital-spark" title={`${taskCount} tasks/assignments`} />
                          )}
                          {studyCount > 0 && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-vital-spark" : "bg-calm-awakening"}`} title={`${studyCount} study sprints`} />
                          )}
                          {studyCount === 0 && (
                            <span className="text-[9px] text-liminal-night/40 font-medium">Rest</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SINGLE DAY STUDY & ASSIGNMENTS TIMELINE (Full-Width Clean Layout) */}
              <div className="w-full flex-1 flex flex-col space-y-4 min-w-0 overflow-y-auto pr-1">
                
                {/* Day Header Banner */}
                <div className="bg-steady-renewal rounded-none p-5 sm:p-6 border border-rooted-strength/40 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-liminal-night/70">
                        Day Schedule
                      </span>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-wild-light text-liminal-night border border-rooted-strength/40">
                        {activeSelectedDate === toISODate(now) ? "Today" : fmtDisplayDate(activeSelectedDate)}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-xl text-liminal-night mt-0.5">
                      {selectedDayLabel}
                    </h3>
                  </div>

                  {/* Quick stats pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-liminal-night bg-wild-light border border-rooted-strength/40 px-3.5 py-1.5 rounded-full shadow-2xs flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-calm-awakening" />
                      <span>{selectedStudyBlocks.length} Focus Sprints ({totalStudyHoursPlanned}h)</span>
                    </span>
                    {selectedTaskBlocks.length > 0 && (
                      <span className="text-xs font-semibold text-liminal-night bg-vital-spark/30 border border-vital-spark/60 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-liminal-night" />
                        <span>{selectedTaskBlocks.length} {selectedTaskBlocks.length === 1 ? 'Assignment' : 'Assignments / Tasks'}</span>
                      </span>
                    )}
                    {selectedSelfStudyBlocks.length > 0 && (
                      <span className="text-xs font-semibold text-calm-awakening bg-calm-awakening/20 border border-calm-awakening/40 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{selectedSelfStudyBlocks.length} Self Study {selectedSelfStudyBlocks.length === 1 ? 'Session' : 'Sessions'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline Session Cards */}
                <div className="space-y-3 flex-1">
                  {selectedDayBlocks.length === 0 ? (
                    <div className="bg-steady-renewal rounded-none p-8 border border-dashed border-rooted-strength/50 text-center flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-wild-light border border-rooted-strength/30 text-inner-resolve flex items-center justify-center shadow-xs">
                        <Coffee className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-liminal-night text-base">
                          No Sessions Scheduled for this Day
                        </h4>
                        <p className="text-xs text-liminal-night/70 mt-1 max-w-sm">
                          Enjoy your rest day or generate study sprints balanced for your homework tasks, assignments, and self-study topics.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerate}
                        className="px-5 py-2 rounded-full bg-liminal-night hover:opacity-90 text-wild-light text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-vital-spark" />
                        <span>Generate Study Sprints</span>
                      </button>
                    </div>
                  ) : (
                    selectedDayBlocks.map((block) => {
                      const isActivePomo = activePomodoroSession?.blockId === block.id;

                      if (block.type === "break") {
                        return (
                          <div key={block.id} className="py-2.5 px-4 rounded-2xl bg-wild-light/80 border border-rooted-strength/30 text-xs font-medium text-liminal-night/70 flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-2">
                              <Coffee className="w-4 h-4 text-inner-resolve" />
                              <span>Rest & Recharge Break (10m)</span>
                            </div>
                            <span className="text-[11px] font-semibold text-liminal-night/60">
                              {fmtTime12(block.start)} – {fmtTime12(block.end)}
                            </span>
                          </div>
                        );
                      }

                      // Study / Task / Self Study Block
                      const isTask = block.type === "task" || block.assigned?.itemType === "task";
                      const isTopic = block.assigned?.itemType === "topic" || !isTask;
                      const subject = block.assigned?.subject || "General";
                      const theme = getSubjectTheme(subject);
                      const rawTitle = block.assigned?.title || (isTask ? "Assignment Work" : "Self Study Session");
                      const displayTitle = rawTitle.replace(/^Topic:\s*/i, "").replace(/^📚\s*Self Study:\s*/i, "");
                      const category = block.assigned?.category || (isTask ? "Assignment" : "Self Study");
                      const priority = block.assigned?.priority || "Medium";
                      const dueDate = block.assigned?.dueDate;
                      const dueTime = block.assigned?.dueTime;

                      return (
                        <div
                          key={block.id}
                          className={`p-5 rounded-none border transition-all duration-200 relative ${
                            block.completed
                              ? "bg-steady-renewal/50 border-rooted-strength/30 opacity-75"
                              : isActivePomo
                              ? "bg-wild-light border-2 border-inner-resolve shadow-md ring-2 ring-inner-resolve/30"
                              : isTask
                              ? "bg-steady-renewal hover:bg-wild-light border-rooted-strength/40 shadow-xs hover:shadow-sm"
                              : "bg-steady-renewal hover:bg-wild-light border-rooted-strength/40 shadow-xs hover:shadow-sm"
                          }`}
                        >
                          {/* Top Row: Subject Badge + Type Tag + Deadline */}
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-wild-light border border-rooted-strength/40 text-liminal-night shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-inner-resolve" />
                                <span className="truncate max-w-[140px]">{subject}</span>
                              </span>

                              {isTask ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-vital-spark/30 text-liminal-night border border-vital-spark/50 flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-liminal-night" />
                                  <span>{category}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-calm-awakening/20 text-calm-awakening border border-calm-awakening/40 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  <span>Self Study</span>
                                </span>
                              )}

                              {priority === "High" && (
                                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-liminal-night text-wild-light">
                                  ⚡ Urgent
                                </span>
                              )}

                              {dueDate && isTask && (
                                <span className="text-[9.5px] font-medium px-2.5 py-0.5 rounded-full bg-wild-light text-liminal-night/70 border border-rooted-strength/40 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-rooted-strength" />
                                  <span>Due {fmtDisplayDate(dueDate)} {dueTime ? "@ " + dueTime : ""}</span>
                                </span>
                              )}
                            </div>

                            {isActivePomo && !block.completed && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-0.5 rounded-full bg-liminal-night text-wild-light shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-vital-spark animate-ping" />
                                <span>Studying in Focus Mode</span>
                              </span>
                            )}
                            {block.completed && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-0.5 rounded-full bg-calm-awakening/20 text-calm-awakening border border-calm-awakening/40">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>

                          {/* Task / Topic Title with Direct Toggle Checkbox */}
                          <div className="flex items-start gap-3 my-2.5">
                            <button
                              onClick={() => toggleBlockDone(block.id)}
                              className="mt-0.5 text-liminal-night/40 hover:text-liminal-night transition-colors cursor-pointer shrink-0"
                              title={block.completed ? "Mark incomplete" : "Mark complete"}
                            >
                              {block.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-calm-awakening" />
                              ) : (
                                <Circle className="w-5 h-5 text-rooted-strength hover:text-liminal-night" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-display font-bold text-sm sm:text-base leading-snug ${
                                block.completed ? "line-through text-liminal-night/40" : "text-liminal-night"
                              }`}>
                                {displayTitle}
                              </h4>
                              {block.assigned?.subtitle && block.assigned.subtitle !== subject && (
                                <p className="text-xs text-liminal-night/65 mt-0.5 font-normal truncate">
                                  {block.assigned.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Footer: Time + Start Pomodoro Action Button */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2.5 border-t border-rooted-strength/30">
                            <div className="flex items-center gap-2 text-xs font-semibold text-liminal-night/75">
                              <Clock className="w-3.5 h-3.5 text-inner-resolve" />
                              <span>{fmtTime12(block.start)} – {fmtTime12(block.end)}</span>
                              <span className="text-[11px] font-normal text-liminal-night/60">· 50m Focus Sprint</span>
                            </div>

                            {!block.completed ? (
                              <button
                                onClick={() => handleStartPomodoroForSession(block)}
                                className="px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs bg-liminal-night hover:opacity-90 text-wild-light active:scale-95"
                                title="Open in Focus Mode Pomodoro Timer"
                              >
                                <Play className="w-3 h-3 fill-current text-vital-spark" />
                                <span>{isTask ? "Work in Focus Mode" : "Start in Focus Mode"}</span>
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-calm-awakening flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Finished</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          );
        })()}

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
            onOpenAiChat={() => setAiChatOpen(true)}
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

        {/* ----------------- POMODORO TIMER VIEW ----------------- */}
        {view === "pomodoro" && (
          <div className="flex-1 min-w-0 overflow-y-auto">
            <PomodoroTimer 
              tasks={tasks}
              topics={topics}
              student={student}
              activeTopic={activePomodoroSession}
              onFinishStudying={handleFinishStudying}
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

      {/* Floating AI Schedule Assistant Launcher Button */}
      {!aiChatOpen && (
        <button
          onClick={() => setAiChatOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 bg-liminal-night hover:bg-liminal-night/95 text-wild-light p-2.5 sm:px-4 sm:py-3 rounded-full shadow-[0_12px_36px_rgba(12,94,138,0.35)] border border-vital-spark/60 flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer animate-in fade-in"
          title="Open AI Schedule Copilot"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-vital-spark text-liminal-night flex items-center justify-center font-black shadow-xs">
              <Sparkles className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-calm-awakening rounded-full border-2 border-liminal-night" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold tracking-tight text-wild-light flex items-center gap-1">
              <span>AI Copilot</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-vital-spark/30 text-vital-spark font-extrabold uppercase font-sans border border-vital-spark/40">
                Plan
              </span>
            </span>
            <span className="text-[10px] text-wild-light/70">Customize your schedule</span>
          </div>
        </button>
      )}

      {/* AI Schedule Assistant Modal/Drawer */}
      <AIChatScheduleAssistant
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        tasks={tasks}
        topics={topics}
        availability={availability}
        collegeSchedule={collegeSchedule}
        examSchedule={examSchedule}
        timetable={timetable}
        setTimetable={setTimetable}
        setAvailability={setAvailability}
        student={student}
        weekStart={weekStart}
        subjectList={subjectList}
        setView={setView}
        setSelectedTimetableDate={setSelectedTimetableDate}
      />

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
    bg: "bg-wild-light",
    border: "border-inner-resolve/30",
    hoverBorder: "hover:border-inner-resolve",
    tagBg: "bg-inner-resolve/15",
    tagText: "text-liminal-night font-semibold",
    accent: "#556574",
    dot: "bg-inner-resolve",
    lightText: "text-liminal-night"
  },
  ECA: {
    bg: "bg-wild-light",
    border: "border-rooted-strength/40",
    hoverBorder: "hover:border-inner-resolve",
    tagBg: "bg-steady-renewal",
    tagText: "text-liminal-night font-semibold",
    accent: "#2C2F40",
    dot: "bg-liminal-night",
    lightText: "text-liminal-night"
  },
  Calculus: {
    bg: "bg-wild-light",
    border: "border-vital-spark/40",
    hoverBorder: "hover:border-vital-spark",
    tagBg: "bg-vital-spark/25",
    tagText: "text-liminal-night font-semibold",
    accent: "#E06F32",
    dot: "bg-vital-spark",
    lightText: "text-liminal-night"
  },
  Physics: {
    bg: "bg-wild-light",
    border: "border-calm-awakening/40",
    hoverBorder: "hover:border-calm-awakening",
    tagBg: "bg-calm-awakening/20",
    tagText: "text-liminal-night font-semibold",
    accent: "#92A5A8",
    dot: "bg-calm-awakening",
    lightText: "text-liminal-night"
  },
  "Data Structures": {
    bg: "bg-wild-light",
    border: "border-inner-resolve/30",
    hoverBorder: "hover:border-inner-resolve",
    tagBg: "bg-inner-resolve/15",
    tagText: "text-liminal-night font-semibold",
    accent: "#556574",
    dot: "bg-inner-resolve",
    lightText: "text-liminal-night"
  },
  Marketing: {
    bg: "bg-wild-light",
    border: "border-calm-awakening/40",
    hoverBorder: "hover:border-calm-awakening",
    tagBg: "bg-calm-awakening/20",
    tagText: "text-liminal-night font-semibold",
    accent: "#92A5A8",
    dot: "bg-calm-awakening",
    lightText: "text-liminal-night"
  }
};

const FALLBACK_PALETTES = [
  {
    bg: "bg-wild-light",
    border: "border-inner-resolve/30",
    hoverBorder: "hover:border-inner-resolve",
    tagBg: "bg-inner-resolve/15",
    tagText: "text-liminal-night font-semibold",
    accent: "#556574",
    dot: "bg-inner-resolve"
  },
  {
    bg: "bg-wild-light",
    border: "border-rooted-strength/40",
    hoverBorder: "hover:border-liminal-night",
    tagBg: "bg-steady-renewal",
    tagText: "text-liminal-night font-semibold",
    accent: "#2C2F40",
    dot: "bg-liminal-night"
  },
  {
    bg: "bg-wild-light",
    border: "border-vital-spark/40",
    hoverBorder: "hover:border-vital-spark",
    tagBg: "bg-vital-spark/25",
    tagText: "text-liminal-night font-semibold",
    accent: "#E06F32",
    dot: "bg-vital-spark"
  },
  {
    bg: "bg-wild-light",
    border: "border-calm-awakening/40",
    hoverBorder: "hover:border-calm-awakening",
    tagBg: "bg-calm-awakening/20",
    tagText: "text-liminal-night font-semibold",
    accent: "#92A5A8",
    dot: "bg-calm-awakening"
  },
  {
    bg: "bg-wild-light",
    border: "border-rooted-strength/40",
    hoverBorder: "hover:border-inner-resolve",
    tagBg: "bg-wild-light",
    tagText: "text-liminal-night font-semibold",
    accent: "#C0A381",
    dot: "bg-rooted-strength"
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
      <div className="py-1 px-3 my-0.5 rounded-full bg-steady-renewal/80 border border-rooted-strength/40 text-[10px] font-semibold text-liminal-night flex items-center justify-center gap-1.5 shadow-2xs hover:bg-steady-renewal transition-colors whitespace-nowrap">
        <Coffee className="w-3 h-3 text-inner-resolve shrink-0" />
        <span>Break · {fmtTime12(block.start)}–{fmtTime12(block.end)}</span>
      </div>
    );
  }

  // Class (Lecture / Lab / Tutorial) - Harmonious Sky Blue
  if (block.type === "class") {
    const classType = block.assigned?.classType || "Lecture";
    const subject = block.assigned?.subject || "College";
    return (
      <div className="p-3 rounded-2xl bg-wild-light text-liminal-night border border-inner-resolve/30 shadow-2xs space-y-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs hover:border-inner-resolve">
        <div className="flex items-center justify-between gap-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-inner-resolve/15 text-liminal-night">
            <span className="w-1.5 h-1.5 rounded-full bg-inner-resolve" />
            <span className="truncate max-w-[85px]">{subject}</span>
          </span>
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-steady-renewal border border-rooted-strength/40 text-liminal-night shrink-0">
            {classType}
          </span>
        </div>
        <p className="text-[12px] font-bold text-liminal-night leading-snug line-clamp-2">
          {block.assigned?.title}
        </p>
        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-rooted-strength/30 text-[10.5px] font-medium text-liminal-night/70">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-inner-resolve shrink-0" />
            {fmtTime12(block.start)}–{fmtTime12(block.end)}
          </span>
          <span className="flex items-center gap-1 text-liminal-night/70 truncate">
            <MapPin className="w-3 h-3 text-calm-awakening shrink-0" />
            <span>{block.assigned?.room || "Room 101"}</span>
          </span>
        </div>
      </div>
    );
  }

  // Exam - Harmonious Editorial Pill
  if (block.type === "exam") {
    const subject = block.assigned?.subject || "Exam";
    return (
      <div className="p-3 rounded-2xl bg-wild-light text-liminal-night border border-liminal-night/30 shadow-2xs space-y-1.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs hover:border-liminal-night">
        <div className="flex items-center justify-between gap-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-steady-renewal text-liminal-night">
            <span className="w-1.5 h-1.5 rounded-full bg-liminal-night" />
            <span className="truncate max-w-[85px]">{subject}</span>
          </span>
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-liminal-night text-wild-light shrink-0">
            EXAM
          </span>
        </div>
        <p className="text-[12px] font-bold text-liminal-night leading-snug line-clamp-2">
          {block.assigned?.title}
        </p>
        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-rooted-strength/30 text-[10.5px] font-medium text-liminal-night/70">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-liminal-night shrink-0" />
            {fmtTime12(block.start)}–{fmtTime12(block.end)}
          </span>
          <span className="flex items-center gap-1 truncate text-liminal-night/70">
            <MapPin className="w-3 h-3 text-liminal-night shrink-0" />
            <span>{block.assigned?.room || "Exam Hall"}</span>
          </span>
        </div>
      </div>
    );
  }

  // Regular Study / Tasks / Topics
  const isTask = block.type === "task" || block.assigned?.itemType === "task";
  const isExamPrep = block.type === "exam_prep" || block.assigned?.itemType === "exam_prep";
  const isTopic = block.assigned?.itemType === "topic" || (!isTask && !isExamPrep);
  const subject = block.assigned?.subject || "General";
  const theme = getSubjectTheme(subject);
  
  // Clean up title: remove redundant "Topic: " prefix if present for clean readability
  const rawTitle = block.assigned?.title || (isTask ? "Assignment" : "Study Session");
  const displayTitle = rawTitle.replace(/^Topic:\s*/i, "");

  return (
    <div className={`p-3 rounded-2xl border transition-all duration-150 ${
      block.completed
        ? "bg-wild-light/60 border-rooted-strength/30 opacity-60"
        : `${theme.bg} ${theme.border} ${theme.hoverBorder} shadow-2xs hover:-translate-y-0.5 hover:shadow-xs`
    } space-y-1.5`}>
      {/* Top Header: Subject Badge + Type Tag */}
      <div className="flex items-center justify-between gap-1">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${theme.tagBg} ${theme.tagText}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
          <span className="truncate max-w-[85px]">{subject}</span>
        </span>

        {isExamPrep ? (
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-vital-spark text-liminal-night shrink-0">
            Prep
          </span>
        ) : isTask ? (
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-inner-resolve/20 text-liminal-night shrink-0">
            Task
          </span>
        ) : (
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-calm-awakening/20 text-calm-awakening shrink-0">
            Study
          </span>
        )}
      </div>

      {/* Card Content with Completion Toggle */}
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          className="mt-0.5 text-liminal-night/50 hover:text-liminal-night transition-colors cursor-pointer shrink-0"
          title={block.completed ? "Mark incomplete" : "Mark complete"}
        >
          {block.completed ? (
            <CheckCircle2 className="w-4 h-4 text-calm-awakening" />
          ) : (
            <Circle className="w-4 h-4 text-rooted-strength hover:text-liminal-night" />
          )}
        </button>
        <p className={`text-[12px] font-bold leading-snug line-clamp-2 ${
          block.completed ? "line-through text-liminal-night/50" : "text-liminal-night"
        }`}>
          {displayTitle}
        </p>
      </div>

      {/* Card Footer: Time & Duration */}
      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-rooted-strength/30 text-[10.5px] font-medium text-liminal-night/70">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-liminal-night/50 shrink-0" />
          <span>{fmtTime12(block.start)}–{fmtTime12(block.end)}</span>
        </div>
        <span className="text-[10px] text-liminal-night/60 font-semibold">50m</span>
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
    <div className="bg-steady-renewal text-liminal-night rounded-none p-5 sm:p-6 shadow-xs border border-rooted-strength/40 flex flex-col justify-between space-y-4">
      {/* Calendar Top Header with View Switcher & Add Event */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-rooted-strength/30">
          <div>
            <h3 className="font-display font-bold text-liminal-night text-base sm:text-lg flex items-center gap-2">
              <Calendar className="w-4 h-4 text-inner-resolve" />
              Academic Calendar & Events
            </h3>
            <p className="text-xs text-liminal-night/70">Exams, quizzes, assignments & custom event schedules</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Add Event Button */}
            <button
              onClick={() => setEventModal({ open: true, editing: null, defaultDate: selectedDateISO || toISODate(now) })}
              className="px-3 py-1.5 rounded-full bg-liminal-night hover:opacity-90 text-wild-light text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Add New Event"
            >
              <Plus className="w-3.5 h-3.5 text-vital-spark" />
              <span>Add Event</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-wild-light rounded-full p-1 border border-rooted-strength/40">
              <button
                onClick={() => setCalendarViewMode('grid')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  calendarViewMode === 'grid' ? 'bg-steady-renewal text-liminal-night font-bold shadow-xs' : 'text-liminal-night/60 hover:text-liminal-night'
                }`}
              >
                Calendar Grid
              </button>
              <button
                onClick={() => setCalendarViewMode('agenda')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  calendarViewMode === 'agenda' ? 'bg-steady-renewal text-liminal-night font-bold shadow-xs' : 'text-liminal-night/60 hover:text-liminal-night'
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
            <div className="flex items-center justify-between mt-3.5 mb-2.5 px-1">
              <span className="font-display font-bold text-sm text-liminal-night tracking-wide">
                {currentMonthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleJumpToday}
                  className="px-2.5 py-1 rounded-full bg-wild-light hover:bg-white text-[11px] font-semibold text-liminal-night border border-rooted-strength/40 transition-all cursor-pointer shadow-2xs"
                >
                  Today
                </button>
                <button
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-wild-light text-liminal-night/70 hover:text-liminal-night border border-rooted-strength/30 transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-wild-light text-liminal-night/70 hover:text-liminal-night border border-rooted-strength/30 transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-liminal-night/60 mb-1.5 uppercase tracking-wider">
              <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
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
                        ? "bg-liminal-night text-wild-light font-bold shadow-xs scale-105 z-10"
                        : isToday
                        ? "bg-calm-awakening/20 text-calm-awakening font-bold border border-calm-awakening/50"
                        : dayMeta
                        ? "bg-wild-light hover:bg-white text-liminal-night font-semibold border border-rooted-strength/40"
                        : "text-liminal-night/70 hover:bg-wild-light hover:text-liminal-night"
                    }`}
                  >
                    <span className="text-[11px] leading-none">{dayNum}</span>
                    
                    {/* Event Indicator Dots */}
                    {dayMeta && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {dayMeta.hasExam && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-vital-spark" : "bg-liminal-night"}`} title="Exam / Quiz" />
                        )}
                        {dayMeta.hasTask && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-wild-light" : "bg-calm-awakening"}`} title="Assignment / Task" />
                        )}
                        {dayMeta.hasEvent && (
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-vital-spark" : "bg-inner-resolve"}`} title="Event" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-rooted-strength/30 text-[10px] text-liminal-night/70 flex-wrap gap-2">
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-full bg-liminal-night" /> Exams & Quizzes</span>
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-full bg-calm-awakening" /> Assignments</span>
              <span className="flex items-center gap-1.5 font-medium"><span className="w-2 h-2 rounded-full bg-inner-resolve" /> Events</span>
            </div>
          </div>
        )}
      </div>

      {/* SELECTED DATE DETAILS (In Grid Mode) */}
      {calendarViewMode === 'grid' && (
        <div className="bg-wild-light rounded-2xl p-4 border border-rooted-strength/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-display font-bold text-xs sm:text-sm text-liminal-night flex items-center gap-1.5">
                <span>{selectedDateFormatted}</span>
                {selectedDateISO === todayISO && (
                  <span className="px-2 py-0.5 rounded-full bg-calm-awakening/20 border border-calm-awakening/40 text-calm-awakening text-[10px] font-bold uppercase">Today</span>
                )}
              </h4>
              <p className="text-[11px] text-liminal-night/65">
                {selectedEvents.length} scheduled item{selectedEvents.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-[10px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'exam', label: 'Exams' },
                { id: 'task', label: 'Tasks' },
                { id: 'event', label: 'Events' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-0.5 rounded-full font-semibold transition-all cursor-pointer ${
                    filterType === f.id
                      ? 'bg-liminal-night text-wild-light shadow-2xs font-bold'
                      : 'bg-steady-renewal text-liminal-night/70 hover:text-liminal-night border border-rooted-strength/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event Items List */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {selectedEvents.length === 0 ? (
              <div className="py-6 px-3 rounded-2xl bg-steady-renewal/50 border border-dashed border-rooted-strength/50 text-center flex flex-col items-center justify-center gap-1 text-liminal-night/60">
                <CheckCircle2 className="w-5 h-5 text-calm-awakening" />
                <p className="text-xs font-bold text-liminal-night">No Items on this Date</p>
                <p className="text-[11px] text-liminal-night/60">No exams, homework deadlines, or custom events scheduled.</p>
              </div>
            ) : (
              selectedEvents.map(evt => {
                if (evt.type === 'exam') {
                  return (
                    <div key={evt.id} className="p-3 rounded-2xl bg-steady-renewal border border-rooted-strength/40 flex items-start justify-between gap-2.5 shadow-2xs">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-liminal-night text-wild-light text-[9px] font-bold uppercase">
                            🚨 {evt.weightage}
                          </span>
                          <span className="text-xs font-bold text-liminal-night truncate">{evt.title}</span>
                        </div>
                        <p className="text-[11px] text-liminal-night/75 font-semibold">{evt.subject} · {evt.time}</p>
                        {evt.venue && <p className="text-[10px] text-liminal-night/60">📍 {evt.venue}</p>}
                        {evt.syllabus && <p className="text-[10px] text-liminal-night/70 italic truncate">Syllabus: {evt.syllabus}</p>}
                      </div>
                      <button
                        onClick={() => setView('exams')}
                        className="px-2.5 py-1 rounded-full bg-wild-light hover:bg-white border border-rooted-strength/40 text-liminal-night text-[10px] font-bold shrink-0 transition-all cursor-pointer shadow-2xs"
                      >
                        View
                      </button>
                    </div>
                  );
                }

                if (evt.type === 'task') {
                  return (
                    <div key={evt.id} className="p-3 rounded-2xl bg-steady-renewal border border-rooted-strength/40 flex items-center justify-between gap-2.5 shadow-2xs">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            evt.priority === 'High' ? 'bg-liminal-night text-wild-light border-liminal-night' : evt.priority === 'Medium' ? 'bg-vital-spark/30 text-liminal-night border-vital-spark' : 'bg-calm-awakening/20 text-calm-awakening border-calm-awakening/40'
                          }`}>
                            {evt.priority}
                          </span>
                          <span className={`text-xs font-bold truncate ${evt.completed ? 'line-through text-liminal-night/40' : 'text-liminal-night'}`}>
                            {evt.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-liminal-night/75 font-medium">{evt.subject} · {evt.time} · {evt.category}</p>
                      </div>
                      <button
                        onClick={() => toggleTask && toggleTask(evt.raw.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-liminal-night/60 hover:text-calm-awakening shrink-0 cursor-pointer"
                        title={evt.completed ? "Mark Incomplete" : "Mark Done"}
                      >
                        {evt.completed ? <CheckCircle2 className="w-5 h-5 text-calm-awakening" /> : <Circle className="w-5 h-5 text-liminal-night/40" />}
                      </button>
                    </div>
                  );
                }

                if (evt.type === 'event') {
                  return (
                    <div key={evt.id} className="p-3 rounded-2xl bg-steady-renewal border border-rooted-strength/40 flex items-start justify-between gap-2.5 transition-all shadow-2xs">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-inner-resolve/20 border border-inner-resolve/40 text-liminal-night text-[9px] font-bold uppercase">
                            {evt.categoryLabel}
                          </span>
                          <span className={`text-xs font-bold truncate ${evt.completed ? 'line-through text-liminal-night/40' : 'text-liminal-night'}`}>
                            {evt.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-liminal-night/75 font-medium">
                          {evt.time}{evt.venue ? ` · 📍 ${evt.venue}` : ''}
                        </p>
                        {evt.description && (
                          <p className="text-[10px] text-liminal-night/65 italic truncate">{evt.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => setEventModal({ open: true, editing: evt.raw, defaultDate: evt.date })}
                          className="w-7 h-7 rounded-xl bg-wild-light hover:bg-white text-liminal-night/70 hover:text-liminal-night border border-rooted-strength/30 flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs"
                          title="Edit Event"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent && onDeleteEvent(evt.raw.id)}
                          className="w-7 h-7 rounded-xl bg-wild-light hover:bg-white text-liminal-night/70 hover:text-rose-600 border border-rooted-strength/30 flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onToggleEvent && onToggleEvent(evt.raw.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-liminal-night/60 hover:text-inner-resolve cursor-pointer"
                          title={evt.completed ? "Mark Incomplete" : "Mark Done"}
                        >
                          {evt.completed ? <CheckCircle2 className="w-5 h-5 text-inner-resolve" /> : <Circle className="w-5 h-5 text-liminal-night/40" />}
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
        <div className="bg-wild-light rounded-2xl p-4 border border-rooted-strength/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-xs sm:text-sm text-liminal-night flex items-center gap-2">
              <Clock className="w-4 h-4 text-inner-resolve" />
              Chronological Upcoming Deadlines, Milestones & Events
            </h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-steady-renewal border border-rooted-strength/40 text-liminal-night/75">{allUpcomingItems.length} Total</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {allUpcomingItems.length === 0 ? (
              <div className="py-8 px-4 rounded-2xl bg-steady-renewal/50 border border-dashed border-rooted-strength/50 text-center flex flex-col items-center justify-center gap-1.5 text-liminal-night/60">
                <CheckCircle2 className="w-6 h-6 text-calm-awakening" />
                <p className="text-xs font-bold text-liminal-night">No Upcoming Items in Your Planner</p>
                <p className="text-[11px] text-liminal-night/60">Add exams, assignments, or events to automatically view them here.</p>
              </div>
            ) : (
              allUpcomingItems.map(item => {
                const relativeLabel = getRelativeDaysLabel(item.date);
                const isExam = item.type === 'exam';
                const isEvent = item.type === 'event';

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isExam
                        ? 'bg-steady-renewal border-vital-spark/60'
                        : isEvent
                        ? 'bg-steady-renewal border-inner-resolve/40'
                        : item.completed
                        ? 'bg-steady-renewal/50 border-rooted-strength/30 opacity-60'
                        : 'bg-steady-renewal border-rooted-strength/40'
                    } flex items-center justify-between gap-3 shadow-2xs`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          isExam ? 'bg-liminal-night text-wild-light' : isEvent ? 'bg-inner-resolve/20 text-liminal-night' : item.isQuiz ? 'bg-vital-spark/30 text-liminal-night' : 'bg-calm-awakening/20 text-calm-awakening'
                        }`}>
                          {isExam ? `🚨 ${item.badge}` : isEvent ? `${item.badge}` : item.isQuiz ? `⚡ ${item.badge}` : `📝 ${item.badge}`}
                        </span>

                        <span className={`text-xs font-bold truncate ${item.completed ? 'line-through text-liminal-night/40' : 'text-liminal-night'}`}>
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-liminal-night/70 flex-wrap">
                        {item.subject && <span className="font-semibold text-liminal-night">{item.subject}</span>}
                        {item.subject && <span>•</span>}
                        <span className="text-liminal-night/80 font-medium">{fmtDisplayDate(item.date)} ({item.time})</span>
                        {item.venue && (
                          <>
                            <span>•</span>
                            <span className="text-liminal-night/70">📍 {item.venue}</span>
                          </>
                        )}
                        {item.description && (
                          <>
                            <span>•</span>
                            <span className="italic text-liminal-night/60 truncate">{item.description}</span>
                          </>
                        )}
                        {item.syllabus && (
                          <>
                            <span>•</span>
                            <span className="italic text-liminal-night/60 truncate">Syllabus: {item.syllabus}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        relativeLabel === 'Today' ? 'bg-vital-spark text-liminal-night font-extrabold shadow-2xs' :
                        relativeLabel === 'Tomorrow' ? 'bg-inner-resolve/20 text-liminal-night border border-inner-resolve/40' : 'bg-wild-light text-liminal-night/70 border border-rooted-strength/40'
                      }`}>
                        {relativeLabel}
                      </span>

                      {isEvent && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEventModal({ open: true, editing: item.raw, defaultDate: item.date })}
                            className="w-7 h-7 rounded-xl bg-wild-light hover:bg-white text-liminal-night/70 hover:text-liminal-night border border-rooted-strength/30 flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs"
                            title="Edit Event"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent && onDeleteEvent(item.raw.id)}
                            className="w-7 h-7 rounded-xl bg-wild-light hover:bg-white text-liminal-night/70 hover:text-rose-600 border border-rooted-strength/30 flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleEvent && onToggleEvent(item.raw.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-liminal-night/60 hover:text-inner-resolve cursor-pointer"
                            title={item.completed ? "Mark Incomplete" : "Mark Done"}
                          >
                            {item.completed ? <CheckCircle2 className="w-5 h-5 text-inner-resolve" /> : <Circle className="w-5 h-5 text-liminal-night/40" />}
                          </button>
                        </div>
                      )}

                      {item.type === 'task' && (
                        <button
                          onClick={() => toggleTask && toggleTask(item.raw.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-liminal-night/60 hover:text-calm-awakening cursor-pointer"
                          title={item.completed ? "Mark Incomplete" : "Mark Done"}
                        >
                          {item.completed ? <CheckCircle2 className="w-5 h-5 text-calm-awakening" /> : <Circle className="w-5 h-5 text-liminal-night/40" />}
                        </button>
                      )}

                      {isExam && (
                        <button
                          onClick={() => setView('exams')}
                          className="px-3 py-1 rounded-full bg-liminal-night text-wild-light text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
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
   STUDY ANALYTICS & COMPLETED TASKS PANEL (With Study Hours Pie Chart)
   ========================================================================== */

function StudyAnalyticsPanel({
  tasks = [],
  topics = [],
  timetable = [],
  student,
  subjectList = [],
  toggleTask,
  onAddTask,
  setView
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'completed' | 'subjects'
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Completed items
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const pendingTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTopics = useMemo(() => topics.filter(t => t.completed), [topics]);
  const completedBlocks = useMemo(() => timetable.filter(b => b.type === 'study' && b.completed), [timetable]);

  // Total completed study hours calculation (from completed tasks + study sessions)
  const completedHoursFromTasks = useMemo(() => {
    return completedTasks.reduce((acc, t) => acc + (Number(t.estHours) || 2), 0);
  }, [completedTasks]);

  const completedHoursFromBlocks = useMemo(() => {
    return completedBlocks.reduce((acc, b) => acc + (b.duration ? b.duration / 60 : 1.5), 0);
  }, [completedBlocks]);

  // Overall completed study hours (rounded to 1 decimal place)
  const completedHours = useMemo(() => {
    const total = Math.max(completedHoursFromTasks, completedHoursFromBlocks);
    return Math.round(total * 10) / 10;
  }, [completedHoursFromTasks, completedHoursFromBlocks]);

  // Target hours (weekly goal based on student's daily target)
  const dailyTarget = student?.dailyTargetHours || 4;
  const weeklyTarget = dailyTarget * 7;
  const remainingHours = Math.max(0, Math.round((weeklyTarget - completedHours) * 10) / 10);
  const goalProgress = weeklyTarget > 0 ? Math.min(100, Math.round((completedHours / weeklyTarget) * 100)) : 0;

  // Subject-wise hours breakdown
  const SUBJECT_COLORS = [
    '#2C2F40', // Liminal Night
    '#556574', // Inner Resolve
    '#92A5A8', // Calm Awakening
    '#E06F32', // Vital Spark
    '#C0A381', // Rooted Strength
    '#ECE0C9', // Steady Renewal
    '#788C8F', // Soft Slate
    '#A88B69', // Muted Bronze
  ];

  const subjectBreakdown = useMemo(() => {
    const map = {};
    // Aggregate from completed tasks
    completedTasks.forEach(t => {
      const s = t.subject || 'General Studies';
      if (!map[s]) map[s] = { subject: s, hours: 0, count: 0 };
      map[s].hours += Number(t.estHours) || 2;
      map[s].count += 1;
    });
    // Aggregate from completed timetable blocks
    completedBlocks.forEach(b => {
      const s = b.subject || 'General Studies';
      if (!map[s]) map[s] = { subject: s, hours: 0, count: 0 };
      map[s].hours += b.duration ? b.duration / 60 : 1.5;
      map[s].count += 1;
    });

    const items = Object.values(map).map((item, idx) => ({
      ...item,
      hours: Math.round(item.hours * 10) / 10,
      color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
    }));

    return items.sort((a, b) => b.hours - a.hours);
  }, [completedTasks, completedBlocks]);

  // SVG Pie/Donut calculations
  const donutRadius = 65;
  const circumference = 2 * Math.PI * donutRadius; // ~408.41

  const chartSlices = useMemo(() => {
    if (completedHours === 0) {
      return [];
    }

    const totalBase = Math.max(weeklyTarget, completedHours);
    let currentOffset = 0;

    const slices = subjectBreakdown.map((item) => {
      const portion = item.hours / totalBase;
      const dashLength = portion * circumference;
      const offset = -currentOffset;
      currentOffset += dashLength;
      const pct = Math.round((item.hours / (completedHours || 1)) * 100);

      return {
        ...item,
        portion,
        dashLength,
        offset,
        pct
      };
    });

    // Add remaining goal slice if target not fully met
    if (remainingHours > 0) {
      const portion = remainingHours / totalBase;
      const dashLength = portion * circumference;
      const offset = -currentOffset;
      slices.push({
        subject: 'Remaining Target',
        hours: remainingHours,
        color: '#ECE0C9',
        isRemaining: true,
        portion,
        dashLength,
        offset,
        pct: Math.round((remainingHours / totalBase) * 100)
      });
    }

    return slices;
  }, [subjectBreakdown, completedHours, weeklyTarget, remainingHours, circumference]);

  // Filtered completed tasks list
  const filteredCompletedTasks = useMemo(() => {
    return completedTasks.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (t.title || '').toLowerCase().includes(q) || (t.subject || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [completedTasks, searchQuery]);

  return (
    <div className="bg-steady-renewal text-liminal-night rounded-none p-5 sm:p-6 shadow-xs border border-rooted-strength/40 flex flex-col justify-between space-y-4 h-full">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-rooted-strength/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-inner-resolve/20 text-liminal-night flex items-center justify-center font-bold shadow-2xs">
              <PieChart className="w-4 h-4 text-inner-resolve" />
            </div>
            <div>
              <h3 className="font-display font-bold text-liminal-night text-base flex items-center gap-2">
                Study Analytics
              </h3>
              <p className="text-xs text-liminal-night/70">Completed study hours & tasks performance</p>
            </div>
          </div>

          {/* View Toggle Tabs */}
          <div className="flex items-center bg-wild-light rounded-full p-1 border border-rooted-strength/40">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overview' ? 'bg-liminal-night text-wild-light font-bold shadow-xs' : 'text-liminal-night/60 hover:text-liminal-night'
              }`}
            >
              Hours Chart
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'completed' ? 'bg-liminal-night text-wild-light font-bold shadow-xs' : 'text-liminal-night/60 hover:text-liminal-night'
              }`}
            >
              Completed ({completedTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'subjects' ? 'bg-liminal-night text-wild-light font-bold shadow-xs' : 'text-liminal-night/60 hover:text-liminal-night'
              }`}
            >
              Subjects
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & STUDY HOURS PIE CHART */}
        {activeTab === 'overview' && (
          <div className="mt-4 space-y-4">
            {/* Donut Chart Card */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-wild-light border border-rooted-strength/40 rounded-2xl p-4 shadow-2xs">
              
              {/* Left Column: Donut Pie Chart */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center relative py-1">
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                    {/* Background Track Circle */}
                    <circle
                      cx="90"
                      cy="90"
                      r={donutRadius}
                      fill="none"
                      stroke="#ECE0C9"
                      strokeWidth="18"
                    />

                    {/* Render Donut Slices */}
                    {chartSlices.map((slice, idx) => (
                      <circle
                        key={idx}
                        cx="90"
                        cy="90"
                        r={donutRadius}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={hoveredSlice === slice.subject ? 22 : 18}
                        strokeDasharray={`${slice.dashLength} ${circumference}`}
                        strokeDashoffset={slice.offset}
                        className="transition-all duration-500 cursor-pointer"
                        onMouseEnter={() => setHoveredSlice(slice.subject)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    ))}
                  </svg>

                  {/* Inner Center Badge */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-2xl font-bold font-display text-liminal-night tracking-tight">
                      {completedHours}
                      <span className="text-xs font-semibold text-calm-awakening ml-0.5">h</span>
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-liminal-night/60">
                      Completed
                    </span>
                    <span className="text-[9px] font-semibold text-calm-awakening bg-calm-awakening/15 px-2 py-0.5 rounded-full mt-0.5">
                      {goalProgress}% Goal
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Goal Stats & Legend */}
              <div className="sm:col-span-7 space-y-3">
                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-steady-renewal border border-rooted-strength/40 rounded-xl p-2 text-center shadow-2xs">
                    <p className="text-[9px] font-bold text-liminal-night/60 uppercase">Studied</p>
                    <p className="text-xs sm:text-sm font-bold text-liminal-night">{completedHours}h</p>
                  </div>
                  <div className="bg-steady-renewal border border-rooted-strength/40 rounded-xl p-2 text-center shadow-2xs">
                    <p className="text-[9px] font-bold text-liminal-night/60 uppercase">Goal</p>
                    <p className="text-xs sm:text-sm font-bold text-liminal-night">{weeklyTarget}h</p>
                  </div>
                  <div className="bg-steady-renewal border border-rooted-strength/40 rounded-xl p-2 text-center shadow-2xs">
                    <p className="text-[9px] font-bold text-liminal-night/60 uppercase">Left</p>
                    <p className="text-xs sm:text-sm font-bold text-liminal-night/70">{remainingHours}h</p>
                  </div>
                </div>

                {/* Subject Hours Legend */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-liminal-night/70">
                    Hours by Subject
                  </p>
                  {subjectBreakdown.length === 0 ? (
                    <p className="text-xs text-liminal-night/60 py-1">
                      Check off tasks or finish study sessions to see subject distribution.
                    </p>
                  ) : (
                    <div className="max-h-[85px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {subjectBreakdown.map((item) => (
                        <div
                          key={item.subject}
                          onMouseEnter={() => setHoveredSlice(item.subject)}
                          onMouseLeave={() => setHoveredSlice(null)}
                          className={`flex items-center justify-between text-xs p-1 rounded-lg transition-all ${
                            hoveredSlice === item.subject ? 'bg-steady-renewal' : 'bg-steady-renewal/50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-semibold text-liminal-night truncate text-[11px]">{item.subject}</span>
                          </div>
                          <span className="text-[10.5px] font-semibold text-liminal-night/70 shrink-0">
                            {item.hours}h ({Math.round((item.hours / (completedHours || 1)) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: FULL COMPLETED TASKS LIST */}
        {activeTab === 'completed' && (
          <div className="space-y-2.5 mt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-liminal-night flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-calm-awakening" />
                All Completed Tasks ({filteredCompletedTasks.length})
              </span>
              {completedTasks.length > 0 && (
                <span className="text-[10px] text-liminal-night/60 font-medium">
                  Click checkmark to toggle
                </span>
              )}
            </div>

            {completedTasks.length > 3 && (
              <div className="relative">
                <Search className="w-3 h-3 text-liminal-night/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter completed tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-wild-light border border-rooted-strength/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-liminal-night placeholder-liminal-night/40 focus:outline-none focus:border-liminal-night"
                />
              </div>
            )}

            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {completedTasks.length === 0 ? (
                <div className="bg-wild-light border border-dashed border-rooted-strength/50 rounded-2xl p-6 text-center space-y-2 my-2">
                  <div className="w-10 h-10 rounded-full bg-steady-renewal text-calm-awakening flex items-center justify-center mx-auto shadow-2xs">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-liminal-night">No Completed Tasks Yet</p>
                  <p className="text-[11px] text-liminal-night/70 max-w-xs mx-auto">
                    Check off tasks and assignments as you finish them to track completed history.
                  </p>
                  {pendingTasks.length > 0 && setView && (
                    <button
                      onClick={() => setView('tasks')}
                      className="mt-2 px-4 py-1.5 rounded-full bg-liminal-night text-wild-light text-xs font-bold transition-all cursor-pointer shadow-xs hover:opacity-90"
                    >
                      View {pendingTasks.length} Pending Tasks
                    </button>
                  )}
                </div>
              ) : filteredCompletedTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-liminal-night/60">
                  No completed tasks match "{searchQuery}"
                </div>
              ) : (
                filteredCompletedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-2xl bg-wild-light hover:bg-white border border-rooted-strength/40 flex items-center justify-between gap-2.5 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => toggleTask && toggleTask(t.id)}
                        className="text-calm-awakening hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                        title="Mark as pending / undo"
                      >
                        <CheckCircle2 className="w-4 h-4 fill-calm-awakening/20" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-liminal-night line-through opacity-75 truncate">
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-liminal-night/60">
                          <span className="font-semibold text-liminal-night">{t.subject}</span>
                          {t.category && <span>· {t.category}</span>}
                          {t.dueDate && <span>· Due {fmtShortDate(t.dueDate)}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.priority && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          t.priority === 'High' ? 'bg-liminal-night text-wild-light border-liminal-night' :
                          t.priority === 'Medium' ? 'bg-vital-spark/30 text-liminal-night border-vital-spark' :
                          'bg-calm-awakening/20 text-calm-awakening border-calm-awakening/40'
                        }`}>
                          {t.priority}
                        </span>
                      )}
                      {t.estHours && (
                        <span className="text-[10px] text-liminal-night/70 font-medium bg-steady-renewal px-2 py-0.5 rounded-full border border-rooted-strength/40">
                          {t.estHours}h
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SUBJECT BREAKDOWN */}
        {activeTab === 'subjects' && (
          <div className="space-y-3 mt-4 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
            <span className="text-xs font-bold text-liminal-night flex items-center gap-1.5 mb-1">
              <BookOpenCheck className="w-3.5 h-3.5 text-inner-resolve" />
              Subject Hours & Tasks Completion
            </span>

            {subjectBreakdown.length === 0 ? (
              <p className="text-xs text-liminal-night/60 py-8 text-center bg-wild-light/50 rounded-2xl border border-dashed border-rooted-strength/40">No study hours recorded across subjects yet.</p>
            ) : (
              subjectBreakdown.map((item) => {
                const pct = completedHours > 0 ? Math.round((item.hours / completedHours) * 100) : 0;
                return (
                  <div key={item.subject} className="bg-wild-light p-3 rounded-2xl border border-rooted-strength/40 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-liminal-night flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        {item.subject}
                      </span>
                      <span className="text-liminal-night/70 font-medium text-[11px]">
                        {item.hours} hours ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-rooted-strength/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
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
  onUpdateDashboardScratchpad,
  onOpenAiChat
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
    <div className="w-full flex flex-col">
      {/* ----------------- FULL-BLEED EDITORIAL HERO SECTION (Matching Reference Layout) ----------------- */}
      <section className="w-full min-h-[100dvh] rounded-none relative overflow-hidden bg-gradient-to-br from-[#2C2F40] via-[#3E4756] to-[#4A5866] text-wild-light flex flex-col justify-between p-5 sm:p-8 lg:p-12 shadow-[0_20px_60px_rgba(44,47,64,0.22)]">
        
        {/* Soft atmospheric gradient accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#556574]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#2C2F40]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/10 pointer-events-none" />

        {/* 1. TOP ROW: Shared Top Bar component (floating over hero) */}
        <SharedTopBar
          view={view}
          setView={setView}
          tasksCount={tasks.length}
          classesCount={collegeSchedule.length}
          examsCount={examSchedule.length}
          now={now}
          onEditProfile={onEditProfile}
          onSignOut={onSignOut}
          isHero={true}
        />

        {/* 2. MAIN HERO BODY (Left Editorial Text + Right Arch Panel with 3D Books) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-6 sm:py-8 lg:py-4">
          
          {/* Left Column: Huge 2-Line Title, Subtitle, CTA Button & Stat Chips */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start">
            
            {/* Huge Bold Two-Line Title with Increased Font Size */}
            <div className="space-y-1 sm:space-y-2">
              <h1 className="font-serif font-normal sm:font-medium text-6xl sm:text-7xl md:text-8xl lg:text-[106px] xl:text-[122px] 2xl:text-[134px] text-wild-light leading-[0.94] sm:leading-[0.92] tracking-tight drop-shadow-sm">
                {HERO_CONTENT.titleLine1}
              </h1>
              <h1 className="font-serif font-normal sm:font-medium text-6xl sm:text-7xl md:text-8xl lg:text-[106px] xl:text-[122px] 2xl:text-[134px] text-wild-light leading-[0.94] sm:leading-[0.92] tracking-tight drop-shadow-sm">
                {HERO_CONTENT.titleLine2}
              </h1>
            </div>

            {/* PLAN IT . FOCUS ON IT . ACE IT Subtitle */}
            <p className="text-xs sm:text-sm md:text-base font-bold tracking-[0.24em] text-vital-spark uppercase mt-5 sm:mt-6 mb-7 sm:mb-9">
              {HERO_CONTENT.subtitle}
            </p>

            {/* Pill CTA Button (BEGIN YOUR JOURNEY →) */}
            <button
              onClick={() => setView("timetable")}
              className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-vital-spark text-liminal-night text-xs sm:text-[13px] font-bold uppercase tracking-widest shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer group"
            >
              <span>{HERO_CONTENT.cta}</span>
              <ArrowRight className="w-4 h-4 text-liminal-night transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            {/* Bottom-left Curved Panel holding Stat Chips */}
            <div className="pt-6 sm:pt-8">
              <div className="bg-wild-light/15 backdrop-blur-md border border-wild-light/25 rounded-3xl p-2 sm:p-3 inline-flex flex-wrap items-center gap-2 sm:gap-2.5 shadow-lg">
                <div className="px-3 py-1.5 rounded-full bg-wild-light/20 border border-wild-light/30 text-wild-light font-medium text-xs flex items-center gap-1.5 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-vital-spark" />
                  <span>Goal: <strong>{student?.dailyTargetHours || 4}h daily</strong></span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-calm-awakening/40 border border-calm-awakening/60 text-wild-light font-semibold text-xs flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-wild-light" />
                  <span>{tasks.filter(t => t.completed).length} Tasks Done</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-blush-rose/25 border border-blush-rose/45 text-wild-light font-semibold text-xs flex items-center gap-1.5 shadow-2xs">
                  <Target className="w-3.5 h-3.5 text-blush-rose" />
                  <span>{examSchedule.length} Exam Milestones</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: New Growth Student Animation occupying all the empty space without any box */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center lg:justify-end w-full">
            <GrowthStudentAnimation />
          </div>

        </div>

        {/* Subtle Bottom Ambient Label */}
        <div className="w-full text-center pb-1">
          <span className="text-[10px] font-bold tracking-widest text-wild-light/40 uppercase">
            STUDENT ACADEMIC WORKSPACE
          </span>
        </div>

      </section>

      {/* Main Dashboard Canvas: Upcoming Alerts & Academic Calendar */}
      <div className="max-w-[1720px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-8 space-y-6">
        {upcomingAlerts.length > 0 && (
          <div className="bg-steady-renewal rounded-none p-5 sm:p-6 shadow-xs border border-rooted-strength/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-liminal-night flex items-center gap-2">
                <Bell className="w-4 h-4 text-inner-resolve" />
                Upcoming Next 7 Days
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-wild-light border border-rooted-strength/40 text-liminal-night/80">{upcomingAlerts.length} Critical Items</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingAlerts.map(alt => (
                <div key={alt.id} className="p-3.5 rounded-2xl bg-wild-light border border-rooted-strength/40 flex items-center justify-between gap-2.5 shadow-2xs hover:border-inner-resolve/40 transition-all">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-liminal-night truncate">{alt.title}</p>
                    <p className="text-[11px] text-liminal-night/65 font-medium">{fmtDisplayDate(alt.date)} {alt.time ? `· ${alt.time}` : ''}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    alt.kind === 'exam' ? 'bg-liminal-night text-wild-light shadow-2xs' : 'bg-vital-spark text-liminal-night border border-vital-spark font-extrabold'
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

        {/* Responsive Grid: Academic Calendar (left) & Study Analytics (right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          <div className="xl:col-span-7 flex flex-col">
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
              onAddTask={onAddTask}
              setView={setView}
            />
          </div>

          <div className="xl:col-span-5 flex flex-col">
            <StudyAnalyticsPanel
              tasks={tasks}
              topics={topics}
              timetable={timetable}
              student={student}
              subjectList={subjectList}
              toggleTask={toggleTask}
              onAddTask={onAddTask}
              setView={setView}
            />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rooted-strength/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display font-bold text-lg sm:text-xl text-liminal-night tracking-tight">Assignments & Tasks</h2>
            <span className="text-xs font-bold text-liminal-night bg-steady-renewal px-3 py-0.5 rounded-full border border-rooted-strength/40 shadow-2xs">
              {stats.pending} pending · {stats.completed} done
            </span>
          </div>
          <p className="text-xs text-liminal-night/70 font-medium">
            Track your homework, projects, and upcoming assignment deadlines
          </p>
        </div>

        <button
          onClick={onAdd}
          className="bg-liminal-night hover:bg-liminal-night/90 text-wild-light px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-vital-spark" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-wild-light text-inner-resolve flex items-center justify-center shrink-0 border border-rooted-strength/30">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-liminal-night/60 uppercase tracking-wider">Pending</p>
            <p className="text-sm font-bold text-liminal-night">{stats.pending} tasks</p>
          </div>
        </div>

        <div className="p-3.5 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-vital-spark/40 text-liminal-night flex items-center justify-center shrink-0 border border-vital-spark/50">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-liminal-night/60 uppercase tracking-wider">High Priority</p>
            <p className="text-sm font-bold text-liminal-night">{stats.highPriority} urgent</p>
          </div>
        </div>

        <div className="p-3.5 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-wild-light text-liminal-night flex items-center justify-center shrink-0 border border-rooted-strength/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-liminal-night/60 uppercase tracking-wider">Est. Workload</p>
            <p className="text-sm font-bold text-liminal-night">{stats.totalEstHours.toFixed(1)} hrs</p>
          </div>
        </div>

        <div className="p-3.5 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-calm-awakening/20 text-calm-awakening flex items-center justify-center shrink-0 border border-calm-awakening/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-liminal-night/60 uppercase tracking-wider">Completed</p>
            <p className="text-sm font-bold text-liminal-night">{stats.completed} finished</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-liminal-night/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments or subjects..."
            className="w-full bg-wild-light border border-rooted-strength/40 rounded-full pl-8.5 pr-3 py-1.5 text-xs text-liminal-night placeholder:text-liminal-night/40 focus:outline-none focus:border-liminal-night"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-liminal-night/50 hover:text-liminal-night">
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
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === tab.id
                  ? "bg-liminal-night text-wild-light shadow-xs"
                  : "bg-wild-light hover:bg-steady-renewal text-liminal-night border border-rooted-strength/40"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {subjects.length > 0 && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-wild-light hover:bg-steady-renewal border border-rooted-strength/40 text-liminal-night rounded-full px-3 py-1 text-xs font-bold cursor-pointer focus:outline-none"
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
          <div className="py-12 px-4 rounded-none bg-steady-renewal/50 border border-dashed border-rooted-strength/60 text-center flex flex-col items-center justify-center gap-2 text-liminal-night/60">
            <CheckSquare className="w-8 h-8 text-liminal-night/40" />
            <p className="text-xs font-bold text-liminal-night">No tasks found</p>
            <p className="text-[11px] text-liminal-night/60 font-medium">Try changing your search or filter, or click "Add Task" to create one.</p>
          </div>
        ) : (
          filtered.map((t) => {
            const theme = getSubjectTheme(t.subject);
            const isPriorityHigh = t.priority === "High";

            return (
              <div
                key={t.id}
                className={`p-3.5 sm:p-4 rounded-none border transition-all duration-150 ${
                  t.completed
                    ? "bg-wild-light/60 border-rooted-strength/30 opacity-60"
                    : `${theme.bg} ${theme.border} ${theme.hoverBorder} shadow-2xs hover:-translate-y-0.5 hover:shadow-xs`
                } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => onToggle(t.id)}
                    className="mt-0.5 sm:mt-0 text-liminal-night/40 hover:text-liminal-night transition-colors cursor-pointer shrink-0"
                    title={t.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {t.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-calm-awakening" />
                    ) : (
                      <Circle className="w-5 h-5 text-rooted-strength hover:text-liminal-night" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${theme.tagBg} ${theme.tagText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                        <span>{t.subject || "General"}</span>
                      </span>

                      {t.category && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-steady-renewal text-liminal-night border border-rooted-strength/40">
                          {t.category}
                        </span>
                      )}

                      {isPriorityHigh && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-vital-spark text-liminal-night border border-vital-spark flex items-center gap-1">
                          <Zap className="w-3 h-3" /> High Priority
                        </span>
                      )}
                    </div>

                    <p className={`text-xs sm:text-sm font-bold leading-snug ${
                      t.completed ? "line-through text-liminal-night/50" : "text-liminal-night"
                    }`}>
                      {t.title}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-medium text-liminal-night/70 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-inner-resolve" />
                        <span>Due {fmtDisplayDate(t.dueDate)} {t.dueTime ? `(${fmtTime12(t.dueTime)})` : ""}</span>
                      </span>
                      {t.estHours && (
                        <span className="flex items-center gap-1 text-liminal-night/60">
                          <Clock className="w-3 h-3 text-liminal-night/50" />
                          <span>~{t.estHours}h required</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-rooted-strength/20 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => onEdit(t)}
                    className="p-2 rounded-full hover:bg-steady-renewal text-liminal-night/70 hover:text-liminal-night transition-colors cursor-pointer"
                    title="Edit task"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="p-2 rounded-full hover:bg-steady-renewal text-liminal-night/70 hover:text-liminal-night transition-colors cursor-pointer"
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
  const [form, setForm] = useState({ name: "", subject: "", difficulty: "Medium", priority: "Medium" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
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
    const highPriority = topics.filter((t) => (t.priority === "High" || t.difficulty === "Hard") && !t.completed).length;
    const inProgress = total - completed;
    const masteryRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, hard, highPriority, inProgress, masteryRate };
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
      // Filter by priority
      if (priorityFilter !== "all") {
        const p = t.priority || (t.difficulty === "Hard" ? "High" : "Medium");
        if (p !== priorityFilter) return;
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
  }, [topics, searchQuery, difficultyFilter, priorityFilter, activeSubjectFilter]);

  const submit = (e) => {
    e?.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) return;
    onAdd(form);
    setForm({ name: "", subject: "", difficulty: "Medium", priority: "Medium" });
    setShowAddForm(false);
  };

  const openAddForSubject = (subj) => {
    setForm({ name: "", subject: subj, difficulty: "Medium", priority: "Medium" });
    setShowAddForm(true);
  };

  return (
    <div className="space-y-5 w-full">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rooted-strength/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display font-bold text-lg sm:text-xl text-liminal-night tracking-tight">Study Topics & Priorities</h2>
            <span className="text-xs font-bold text-liminal-night bg-steady-renewal px-3 py-0.5 rounded-full border border-rooted-strength/40 shadow-2xs">
              {stats.completed} of {stats.total} Mastered ({stats.masteryRate}%)
            </span>
          </div>
          <p className="text-xs text-liminal-night/70 font-medium">
            Syllabus breakdown, study priority ratings, concept difficulty, and automated AI revision scheduling
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-liminal-night hover:bg-liminal-night/90 text-wild-light px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-vital-spark" />
          <span>{showAddForm ? "Close Form" : "Add Topic"}</span>
        </button>
      </div>

      {/* KPI Mastery Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-wild-light text-inner-resolve flex items-center justify-center shrink-0 border border-rooted-strength/30">
            <BookOpenCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-liminal-night/60 uppercase tracking-wider">Total Syllabus</p>
            <p className="text-sm font-bold text-liminal-night">{stats.total} concepts</p>
          </div>
        </div>

        <div className="p-3.5 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-vital-spark/40 text-liminal-night flex items-center justify-center shrink-0 border border-vital-spark/50">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-liminal-night/60 uppercase tracking-wider">High Priority</p>
            <p className="text-sm font-bold text-liminal-night">{stats.highPriority} core topics</p>
          </div>
        </div>

        <div className="p-3.5 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-wild-light text-liminal-night flex items-center justify-center shrink-0 border border-rooted-strength/30">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-liminal-night/60 uppercase tracking-wider">In Revision</p>
            <p className="text-sm font-bold text-liminal-night">{stats.inProgress} to review</p>
          </div>
        </div>

        <div className="p-3.5 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-calm-awakening/20 text-calm-awakening flex items-center justify-center shrink-0 border border-calm-awakening/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-liminal-night/60 uppercase tracking-wider">Mastered</p>
            <p className="text-sm font-bold text-liminal-night">{stats.completed} solid</p>
          </div>
        </div>
      </div>

      {/* Slide-out / Collapsible Add Topic Form */}
      {showAddForm && (
        <form onSubmit={submit} className="p-4 sm:p-5 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-xs space-y-3 transition-all animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-rooted-strength/30">
            <span className="font-bold text-xs text-liminal-night">New Concept / Syllabus Topic</span>
            <span className="text-[11px] text-liminal-night/60 font-medium">Will automatically queue into your weekly study plan by priority</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            <div className="sm:col-span-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Topic / Concept (e.g. MOSFETs, Chain Rule)"
                className="w-full bg-wild-light border border-rooted-strength/40 rounded-full px-4 py-2 text-xs text-liminal-night placeholder:text-liminal-night/40 focus:outline-none focus:border-liminal-night"
                autoFocus
              />
            </div>

            <div className="sm:col-span-3">
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Subject (e.g. EDC, Calculus)"
                className="w-full bg-wild-light border border-rooted-strength/40 rounded-full px-4 py-2 text-xs text-liminal-night placeholder:text-liminal-night/40 focus:outline-none focus:border-liminal-night"
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
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-wild-light border border-rooted-strength/40 rounded-full px-3 py-2 text-xs font-bold text-liminal-night focus:outline-none cursor-pointer"
                title="Study Priority"
              >
                <option value="High">🔥 High Priority</option>
                <option value="Medium">⚡ Med Priority</option>
                <option value="Low">🌱 Low Priority</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full bg-wild-light border border-rooted-strength/40 rounded-full px-3 py-2 text-xs font-bold text-liminal-night focus:outline-none cursor-pointer"
              >
                <option value="Easy">Easy (1h)</option>
                <option value="Medium">Med (2h)</option>
                <option value="Hard">Hard (3h)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-1.5">
              <button
                type="submit"
                disabled={!form.name.trim() || !form.subject.trim()}
                className="w-full bg-liminal-night hover:bg-liminal-night/90 text-wild-light py-2 rounded-full text-xs font-bold cursor-pointer shadow-sm transition-all disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-2 text-liminal-night/50 hover:text-liminal-night cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-none bg-steady-renewal border border-rooted-strength/40 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-liminal-night/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts or subjects..."
            className="w-full bg-wild-light border border-rooted-strength/40 rounded-full pl-8.5 pr-3 py-1.5 text-xs text-liminal-night placeholder:text-liminal-night/40 focus:outline-none focus:border-liminal-night"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-liminal-night/50 hover:text-liminal-night">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={activeSubjectFilter}
            onChange={(e) => setActiveSubjectFilter(e.target.value)}
            className="bg-wild-light hover:bg-steady-renewal border border-rooted-strength/40 text-liminal-night rounded-full px-3 py-1 text-xs font-bold cursor-pointer focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {distinctSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-wild-light hover:bg-steady-renewal border border-rooted-strength/40 text-liminal-night rounded-full px-3 py-1 text-xs font-bold cursor-pointer focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="High">🔥 High Priority</option>
            <option value="Medium">⚡ Med Priority</option>
            <option value="Low">🌱 Low Priority</option>
          </select>

          {[
            { id: "all", label: "All Difficulties" },
            { id: "Hard", label: "Hard" },
            { id: "Medium", label: "Medium" },
            { id: "Easy", label: "Easy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDifficultyFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                difficultyFilter === tab.id
                  ? "bg-liminal-night text-wild-light shadow-xs"
                  : "bg-wild-light hover:bg-steady-renewal text-liminal-night border border-rooted-strength/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Subject Modules */}
      {Object.keys(groupedBySubject).length === 0 ? (
        <div className="py-12 px-4 rounded-none bg-steady-renewal/50 border border-dashed border-rooted-strength/60 text-center flex flex-col items-center justify-center gap-2 text-liminal-night/60">
          <BookOpenCheck className="w-8 h-8 text-liminal-night/40" />
          <p className="text-xs font-bold text-liminal-night">No syllabus topics found</p>
          <p className="text-[11px] text-liminal-night/60 font-medium">Click "Add Topic" above to begin structuring your revision topics.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedBySubject).map(([subj, items]) => {
            const theme = getSubjectTheme(subj);
            const subjCompleted = items.filter((i) => i.completed).length;
            const subjPct = Math.round((subjCompleted / items.length) * 100);

            return (
              <div key={subj} className="rounded-none bg-steady-renewal border border-rooted-strength/40 p-4 sm:p-5 shadow-2xs space-y-3.5">
                {/* Subject Header */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-rooted-strength/30">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold ${theme.tagBg} ${theme.tagText}`}>
                      <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                      <span>{subj}</span>
                    </span>
                    <span className="text-xs font-semibold text-liminal-night/70">
                      {subjCompleted} of {items.length} Mastered
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-24 bg-wild-light h-2 rounded-full overflow-hidden border border-rooted-strength/30">
                        <div className="h-full bg-calm-awakening rounded-full transition-all duration-300" style={{ width: `${subjPct}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-liminal-night/70">{subjPct}%</span>
                    </div>

                    <button
                      onClick={() => openAddForSubject(subj)}
                      className="text-[11px] font-bold text-liminal-night bg-wild-light hover:bg-steady-renewal border border-rooted-strength/40 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-inner-resolve" />
                      <span>Add Topic</span>
                    </button>
                  </div>
                </div>

                {/* Concepts Grid for this Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((t) => {
                    const difficultyBadge =
                      t.difficulty === "Hard" ? "bg-liminal-night text-wild-light font-bold" :
                      t.difficulty === "Medium" ? "bg-steady-renewal text-liminal-night border border-rooted-strength/40 font-bold" :
                      "bg-wild-light text-liminal-night border border-rooted-strength/40 font-bold";

                    const topicPriority = t.priority || (t.difficulty === "Hard" ? "High" : "Medium");
                    const priorityBadge = 
                      topicPriority === "High" ? "bg-vital-spark text-liminal-night border border-vital-spark font-extrabold" :
                      topicPriority === "Low" ? "bg-calm-awakening/20 text-calm-awakening border border-calm-awakening/30 font-bold" :
                      "bg-inner-resolve/20 text-liminal-night border border-inner-resolve/30 font-bold";

                    const estTime = t.difficulty === "Hard" ? "3.0h" : t.difficulty === "Medium" ? "2.0h" : "1.0h";

                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-2xl border transition-all duration-150 ${
                          t.completed
                            ? "bg-wild-light/60 border-rooted-strength/30 opacity-60"
                            : `${theme.bg} ${theme.border} ${theme.hoverBorder} shadow-2xs hover:-translate-y-0.5 hover:shadow-xs`
                        } flex items-center justify-between gap-3`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            onClick={() => onToggle(t.id)}
                            className="text-liminal-night/40 hover:text-liminal-night transition-colors cursor-pointer shrink-0"
                            title={t.completed ? "Mark incomplete" : "Mark mastered"}
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-calm-awakening" />
                            ) : (
                              <Circle className="w-4 h-4 text-rooted-strength hover:text-liminal-night" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold leading-snug truncate ${
                              t.completed ? "line-through text-liminal-night/50" : "text-liminal-night"
                            }`}>
                              {t.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className={`text-[9.5px] px-2 py-0.5 rounded-full ${priorityBadge}`}>
                                {topicPriority === "High" ? "🔥 High" : topicPriority === "Low" ? "🌱 Low" : "⚡ Med"}
                              </span>
                              <span className={`text-[9.5px] px-2 py-0.5 rounded-full ${difficultyBadge}`}>
                                {t.difficulty}
                              </span>
                              <span className="text-[10.5px] font-medium text-liminal-night/60 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-liminal-night/40" />
                                <span>~{estTime}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onDelete(t.id)}
                          className="p-1.5 rounded-full text-liminal-night/50 hover:text-liminal-night hover:bg-steady-renewal transition-colors cursor-pointer shrink-0"
                          title="Delete topic"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-liminal-night/30 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-wild-light rounded-3xl shadow-2xl p-6 border border-rooted-strength/40 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-rooted-strength/30">
          <h3 className="font-display font-bold text-base text-liminal-night">
            {editing ? "Edit Task / Event" : "Add Task, Assignment or Quiz"}
          </h3>
          <button onClick={onClose} className="text-liminal-night/50 hover:text-liminal-night transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title (e.g. Calculus Quiz 1, Physics Problem Set 4)"
            className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-4 py-2.5 text-xs text-liminal-night placeholder:text-liminal-night/40 focus:outline-none focus:border-liminal-night font-medium"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Subject (e.g. Calculus)"
              className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-4 py-2 text-xs text-liminal-night placeholder:text-liminal-night/40 focus:outline-none focus:border-liminal-night font-medium"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-3 py-2 text-xs text-liminal-night font-bold focus:outline-none cursor-pointer"
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
              <label className="text-[10px] font-bold text-liminal-night/60 ml-2 block mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-3 py-2 text-xs text-liminal-night font-bold focus:outline-none cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-liminal-night/60 ml-2 block mb-1">Due Time</label>
              <input
                type="time"
                value={form.dueTime}
                onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-3 py-2 text-xs text-liminal-night font-bold focus:outline-none cursor-pointer"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-3 py-2 text-xs text-liminal-night font-bold focus:outline-none cursor-pointer"
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
              className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-4 py-2 text-xs text-liminal-night font-bold focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-rooted-strength/30">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-liminal-night/70 hover:text-liminal-night cursor-pointer">Cancel</button>
          <button disabled={!valid} onClick={() => onSave(form)} className="px-5 py-2 rounded-full bg-liminal-night hover:bg-liminal-night/90 text-wild-light text-xs font-bold cursor-pointer shadow-sm transition-all disabled:opacity-50">Save</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-liminal-night/30 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-wild-light rounded-3xl shadow-2xl p-6 border border-rooted-strength/40 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-rooted-strength/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-steady-renewal text-liminal-night flex items-center justify-center font-bold border border-rooted-strength/40">
              <Calendar className="w-4 h-4 text-inner-resolve" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-liminal-night">
                {editing ? "Edit Calendar Event" : "Add Calendar Event"}
              </h3>
              <p className="text-[11px] text-liminal-night/60 font-medium">Hackathons, fests, club meets, workshops & more</p>
            </div>
          </div>
          <button onClick={onClose} className="text-liminal-night/50 hover:text-liminal-night transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-liminal-night/60 ml-2 block mb-1">Event Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. 24h AI Hackathon, Robotics Club Meet, Cultural Fest"
              className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-4 py-2 text-xs text-liminal-night font-medium focus:outline-none focus:border-liminal-night"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-liminal-night/60 ml-2 block mb-1">Event Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-3 py-2 text-xs text-liminal-night font-bold focus:outline-none cursor-pointer"
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
              <label className="text-[10px] font-bold text-liminal-night/60 ml-2 block mb-1">Event Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-3 py-2 text-xs text-liminal-night font-bold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-liminal-night/60 ml-2 block mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime || ""}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-3 py-2 text-xs text-liminal-night font-bold focus:outline-none cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-liminal-night/60 ml-2 block mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime || ""}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-3 py-2 text-xs text-liminal-night font-bold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-liminal-night/60 ml-2 block mb-1">Venue / Location</label>
            <input
              value={form.venue || ""}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g. Main Auditorium, Lab 402, Online Zoom"
              className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-full px-4 py-2 text-xs text-liminal-night font-medium focus:outline-none focus:border-liminal-night"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-liminal-night/60 ml-2 block mb-1">Description / Notes (Optional)</label>
            <textarea
              rows={2}
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Bring laptop & ID card, team registration link: ..."
              className="w-full bg-steady-renewal border border-rooted-strength/40 rounded-2xl px-4 py-2 text-xs text-liminal-night font-medium focus:outline-none focus:border-liminal-night resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-rooted-strength/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-bold text-liminal-night/70 hover:text-liminal-night hover:bg-steady-renewal transition-all cursor-pointer"
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
            className="px-5 py-2 rounded-full bg-liminal-night hover:bg-liminal-night/90 disabled:opacity-50 text-wild-light text-xs font-bold shadow-md transition-all cursor-pointer"
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
      <div className="absolute right-6 top-16 w-80 sm:w-96 max-h-96 overflow-y-auto rounded-3xl border border-rooted-strength/40 bg-wild-light shadow-2xl z-50 p-2 text-liminal-night">
        <div className="px-4 py-3 border-b border-rooted-strength/30 flex items-center justify-between">
          <p className="font-display font-bold text-sm text-liminal-night">Reminders & Alerts</p>
          <button onClick={onClose} className="text-liminal-night/50 hover:text-liminal-night"><X className="w-4 h-4" /></button>
        </div>
        <ul className="divide-y divide-rooted-strength/20 max-h-72 overflow-y-auto">
          {alerts.map((a) => (
            <li key={a.id} className="px-4 py-3 hover:bg-steady-renewal text-xs transition-colors rounded-xl">
              <p className="font-bold text-liminal-night">{a.title}</p>
              <p className="text-[11px] text-liminal-night/65 font-medium">{a.subject} · {fmtDisplayDate(a.dueDate)} ({fmtTime12(a.dueTime)})</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
