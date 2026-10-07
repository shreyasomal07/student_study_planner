import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Bot, Send, MessageSquare, RotateCcw, Check, CheckCircle2,
  X, ChevronDown, ChevronUp, Maximize2, Minimize2, Zap, Calendar,
  Clock, Target, BookOpen, Award, AlertCircle, ArrowRight, Flame,
  SlidersHorizontal, Layers, Lightbulb, Trash2, ShieldCheck, CornerDownLeft
} from 'lucide-react';
import { addDays, toISODate, startOfWeek, DAY_KEYS } from '../StudentPlanner';

/* ============================================================================
   AI TIMETABLE SYNTHESIZER & INTENT PARSER
   ========================================================================== */

/**
 * Intelligent NLP parser that extracts student intent from natural language
 */
export function parseAIStudentPrompt(prompt, context) {
  const text = prompt.toLowerCase().trim();
  const { subjectList = [], examSchedule = [], topics = [], collegeSchedule = [], student = {} } = context;

  // 1. Detect target subjects mentioned in prompt
  const detectedSubjects = subjectList.filter((subj) =>
    text.includes(subj.toLowerCase())
  );

  // Check for common subject synonyms if not exact
  const subjectAliases = {
    math: ['mathematics', 'calculus', 'algebra', 'maths', 'geometry', 'stats', 'statistics'],
    physics: ['mechanics', 'thermodynamics', 'optics', 'electromagnetism'],
    chemistry: ['organic', 'inorganic', 'physical chem'],
    cs: ['computer science', 'programming', 'coding', 'data structures', 'algorithms', 'python', 'java', 'dsa', 'web dev', 'os', 'operating systems', 'dbms', 'networks'],
    biology: ['bio', 'botany', 'zoology', 'genetics'],
    english: ['literature', 'grammar', 'essay']
  };

  subjectList.forEach((subj) => {
    const sLower = subj.toLowerCase();
    for (const [key, aliases] of Object.entries(subjectAliases)) {
      if (sLower.includes(key)) {
        if (aliases.some((al) => text.includes(al)) && !detectedSubjects.includes(subj)) {
          detectedSubjects.push(subj);
        }
      }
    }
  });

  // 2. Detect Exam Intent
  const hasExamIntent = /exam|finals|midterm|test|quiz|assessment|paper/i.test(text);
  const matchedExams = examSchedule.filter((ex) => {
    const exSubj = (ex.subject || '').toLowerCase();
    const exTitle = (ex.title || '').toLowerCase();
    return (
      detectedSubjects.some((ds) => ds.toLowerCase() === exSubj) ||
      (exSubj && text.includes(exSubj)) ||
      (exTitle && text.includes(exTitle))
    );
  });

  // 3. Detect Time-of-Day Preferences
  let timePreference = null;
  if (/evening|after 5|after 4|after 6|night|night owl|post college|after college/i.test(text)) {
    timePreference = 'evening';
  } else if (/morning|early|8 am|9 am|10 am/i.test(text)) {
    timePreference = 'morning';
  } else if (/afternoon|noon|post lunch|12 pm|2 pm/i.test(text)) {
    timePreference = 'afternoon';
  }

  // 4. Detect Day Specifics
  let targetDay = null;
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayAbbrs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  if (/today/i.test(text)) {
    targetDay = 'Today';
  } else if (/tomorrow/i.test(text)) {
    targetDay = 'Tomorrow';
  } else {
    dayNames.forEach((dName, idx) => {
      if (text.includes(dName)) {
        targetDay = dayAbbrs[idx];
      }
    });
  }

  // 5. Detect Intensity / Target Hours
  let customTargetHours = null;
  const hoursMatch = text.match(/(\d+)\s*(hour|hr|hours|hrs)/i);
  if (hoursMatch) {
    const parsed = parseInt(hoursMatch[1], 10);
    if (parsed >= 1 && parsed <= 12) {
      customTargetHours = parsed;
    }
  } else if (/intense|sprint|grind|heavy|boost/i.test(text)) {
    customTargetHours = Math.min(8, (student.dailyTargetHours || 4) + 2);
  } else if (/light|relaxed|chill|easy|quick/i.test(text)) {
    customTargetHours = Math.max(2, (student.dailyTargetHours || 4) - 1);
  }

  // 6. Detect Difficulty Focus
  let difficultyFocus = null;
  if (/hard|difficult|complex|challenging|weak/i.test(text)) {
    difficultyFocus = 'Hard';
  } else if (/easy|basics|quick wins/i.test(text)) {
    difficultyFocus = 'Easy';
  }

  // 7. Detect Rest / Free up day request
  const isFreeDayRequest = /free up|clear|cancel|no study|rest day|day off|leave free/i.test(text);

  return {
    detectedSubjects,
    hasExamIntent: hasExamIntent || matchedExams.length > 0,
    matchedExams,
    timePreference,
    targetDay,
    customTargetHours,
    difficultyFocus,
    isFreeDayRequest,
  };
}

/**
 * Custom Timetable Generator incorporating AI custom preferences
 */
export function generateAICustomTimetable({
  tasks = [],
  topics = [],
  availability = {},
  weekStart,
  collegeSchedule = [],
  examSchedule = [],
  student = {},
  preferences = {}
}) {
  const {
    detectedSubjects = [],
    hasExamIntent = false,
    matchedExams = [],
    timePreference = null,
    targetDay = null,
    customTargetHours = null,
    difficultyFocus = null,
    isFreeDayRequest = false
  } = preferences;

  const baseDailyTarget = customTargetHours || student.dailyTargetHours || 4;
  const days = DAY_KEYS; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const now = new Date();
  const todayISO = toISODate(now);

  // Clone and adapt availability based on time-of-day preferences
  const customAvailability = {};
  days.forEach((dayKey, i) => {
    const colDate = addDays(weekStart, i);
    const colDateISO = toISODate(colDate);
    const isTargetDate = 
      (targetDay === 'Today' && colDateISO === todayISO) ||
      (targetDay === 'Tomorrow' && colDateISO === toISODate(addDays(now, 1))) ||
      (targetDay === dayKey);

    if (isFreeDayRequest && isTargetDate) {
      customAvailability[dayKey] = []; // Clear study slots for this day
      return;
    }

    let defaultHours = [17, 18, 19, 20]; // Default evening
    if (dayKey === 'Sat' || dayKey === 'Sun') {
      defaultHours = [10, 11, 12, 14, 15, 16];
    }

    if (timePreference === 'evening') {
      defaultHours = [17, 18, 19, 20, 21];
    } else if (timePreference === 'morning') {
      defaultHours = [8, 9, 10, 11, 12];
    } else if (timePreference === 'afternoon') {
      defaultHours = [13, 14, 15, 16, 17];
    }

    customAvailability[dayKey] = (availability[dayKey] && availability[dayKey].length > 0)
      ? availability[dayKey]
      : defaultHours;
  });

  // Build Weighted Work Queue for AI
  const queue = [];

  // A. If exam intent or matched exams exist, prioritize exam revision topics with high weight
  const examSubjects = matchedExams.map((e) => e.subject).filter(Boolean);
  const prioritizedSubjectSet = new Set([...detectedSubjects, ...examSubjects]);

  // Add exam prep sprints
  examSchedule.forEach((exam) => {
    const isMatched = matchedExams.some((m) => m.id === exam.id) || detectedSubjects.includes(exam.subject);
    const priorityWeight = isMatched ? 500 : (hasExamIntent ? 300 : 100);

    queue.push({
      refId: exam.id,
      type: 'exam_prep',
      title: `⚡ Final Prep: ${exam.title || exam.subject}`,
      subtitle: `${exam.subject} · Mock Tests & Key Formulas`,
      subject: exam.subject || 'Exam',
      priority: 'High',
      category: 'Exam Sprint',
      room: exam.room || 'Exam Prep Center',
      remainingMin: isMatched ? 150 : 100,
      deadline: exam.date ? new Date(`${exam.date}T23:59:59`) : null,
      aiScore: priorityWeight + 100
    });
  });

  // B. Add Topics with AI weighting
  topics.forEach((topic) => {
    if (topic.completed && topic.status === 'Mastered') return;

    let score = 50;
    const isSubjectMatch = prioritizedSubjectSet.has(topic.subject);
    if (isSubjectMatch) score += 200;

    if (difficultyFocus === 'Hard' && topic.difficulty === 'Hard') score += 100;
    else if (topic.difficulty === 'Hard') score += 40;
    else if (topic.difficulty === 'Medium') score += 20;

    if (topic.status === 'In Progress') score += 30;

    const remainingMin = topic.difficulty === 'Hard' ? 250 : topic.difficulty === 'Medium' ? 150 : 100;

    queue.push({
      refId: topic.id,
      type: 'topic',
      title: `Topic: ${topic.name}`,
      subtitle: topic.subject,
      subject: topic.subject,
      priority: score > 150 ? 'High' : 'Medium',
      category: 'Deep Study',
      room: 'Main Library / Desk',
      remainingMin: isSubjectMatch ? remainingMin + 50 : remainingMin,
      deadline: null,
      aiScore: score
    });
  });

  // C. Add Tasks & Assignments
  tasks.forEach((task) => {
    if (task.completed) return;
    let score = 40;
    if (prioritizedSubjectSet.has(task.subject)) score += 160;
    if (task.priority === 'High') score += 70;
    
    const taskDueDateStr = task.dueDate || task.deadline;
    let taskDeadlineObj = null;
    if (taskDueDateStr) {
      const cleanDate = typeof taskDueDateStr === 'string' && taskDueDateStr.includes('T') ? taskDueDateStr.split('T')[0] : taskDueDateStr;
      const cleanTime = task.dueTime || "23:59";
      taskDeadlineObj = new Date(`${cleanDate}T${cleanTime}:00`);
      if (!isNaN(taskDeadlineObj.getTime())) {
        const daysLeft = (taskDeadlineObj.getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (daysLeft <= 1) score += 180; // Urgent due today/tomorrow
        else if (daysLeft <= 3) score += 100;
        else if (daysLeft <= 6) score += 50;
      }
    }

    const category = task.category || "Assignment";
    const estHours = Number(task.estHours) || (task.estimatedMinutes ? task.estimatedMinutes / 60 : 1.5);

    queue.push({
      refId: task.id,
      type: 'task',
      title: `${category === "Assignment" ? "📝 Assignment" : "📌 " + category}: ${task.title}`,
      rawTitle: task.title,
      subtitle: `${task.subject} · ${category}`,
      subject: task.subject || 'General',
      priority: task.priority || 'Medium',
      category: category,
      room: 'Study Desk / Library',
      remainingMin: Math.max(50, Math.round(estHours * 60)),
      deadline: taskDeadlineObj,
      dueDate: task.dueDate || (task.deadline ? String(task.deadline).split('T')[0] : null),
      dueTime: task.dueTime || null,
      aiScore: score
    });
  });

  // Sort queue by AI priority score descending, then deadline
  queue.sort((a, b) => {
    if (a.deadline && b.deadline) {
      const diff = a.deadline.getTime() - b.deadline.getTime();
      if (Math.abs(diff) < 24 * 3600 * 1000) {
        return b.aiScore - a.aiScore;
      }
      return diff;
    }
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    return b.aiScore - a.aiScore;
  });

  // Helper: check time clash with college lectures
  const isTimeClashing = (dateISO, dayKey, hour) => {
    const slotStartMin = hour * 60;
    const slotEndMin = hour * 60 + 50;

    return collegeSchedule.some((cls) => {
      if (cls.day !== dayKey) return false;
      const [sh, sm] = (cls.startTime || '09:00').split(':').map(Number);
      const [eh, em] = (cls.endTime || '10:00').split(':').map(Number);
      const clsStartMin = sh * 60 + (sm || 0);
      const clsEndMin = eh * 60 + (em || 0);
      return slotStartMin < clsEndMin && slotEndMin > clsStartMin;
    });
  };

  const slots = [];
  let qIndex = 0;

  // Generate slots for each day in week (pure study, tasks, assignments and self study)
  days.forEach((dayKey, dayIdx) => {
    const colDate = addDays(weekStart, dayIdx);
    const colDateISO = toISODate(colDate);

    // 1. Insert Scheduled Exams (optional key academic dates)
    const dayExams = examSchedule.filter((e) => e.date === colDateISO);
    dayExams.forEach((exam) => {
      slots.push({
        id: `ai-exam-${colDateISO}-${exam.id}`,
        date: colDateISO,
        day: dayKey,
        start: exam.startTime || '09:00',
        end: exam.endTime || '12:00',
        type: 'exam',
        completed: false,
        assigned: {
          title: exam.title || `${exam.subject} Exam`,
          subject: exam.subject,
          room: exam.room || 'Examination Center'
        }
      });
    });

    // 3. Insert Balanced Study Sprints
    const dayAvailHours = customAvailability[dayKey] || [];
    let dayStudySprintsCount = 0;
    const maxSprintsForDay = Math.ceil(baseDailyTarget * 1.15);

    dayAvailHours.forEach((hour) => {
      if (dayStudySprintsCount >= maxSprintsForDay) return;
      if (isTimeClashing(colDateISO, dayKey, hour)) return;

      const startStr = `${String(hour).padStart(2, '0')}:00`;
      const endStr = `${String(hour).padStart(2, '0')}:50`;

      // Find best matching item in queue
      while (qIndex < queue.length && queue[qIndex].remainingMin <= 0) {
        qIndex++;
      }

      let chosenIndex = -1;
      for (let i = qIndex; i < queue.length; i++) {
        const item = queue[i];
        if (item.remainingMin <= 0) continue;
        if (item.deadline) {
          const slotMoment = new Date(`${colDateISO}T${startStr}:00`);
          if (slotMoment > item.deadline) continue;
        }
        chosenIndex = i;
        break;
      }

      let assignedData = null;
      if (chosenIndex !== -1) {
        const item = queue[chosenIndex];
        assignedData = {
          refId: item.refId,
          itemType: item.type,
          title: item.title,
          subtitle: item.subtitle,
          subject: item.subject,
          priority: item.priority,
          category: item.category,
          room: item.room
        };
        item.remainingMin -= 50;
      } else {
        // Fallback session
        const fallbackSubj = detectedSubjects[0] || (topics[0]?.subject) || 'General Study';
        assignedData = {
          refId: null,
          itemType: 'study',
          title: `Focus Sprint: ${fallbackSubj} Practice`,
          subtitle: `${fallbackSubj} · Core Review & Practice`,
          subject: fallbackSubj,
          priority: 'Medium',
          category: 'Revision',
          room: 'Quiet Study Space'
        };
      }

      slots.push({
        id: `ai-study-${colDateISO}-${startStr}`,
        date: colDateISO,
        day: dayKey,
        start: startStr,
        end: endStr,
        type: 'study',
        completed: false,
        assigned: assignedData
      });

      // 10-minute break slot
      slots.push({
        id: `ai-break-${colDateISO}-${endStr}`,
        date: colDateISO,
        day: dayKey,
        start: endStr,
        end: `${String(hour + 1).padStart(2, '0')}:00`,
        type: 'break',
        completed: false,
        assigned: {
          title: 'Rest & Recharge Break',
          category: 'Break'
        }
      });

      dayStudySprintsCount++;
    });
  });

  // Sort slots chronologically per day
  slots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.start.localeCompare(b.start);
  });

  return {
    slots,
    appliedPreferences: preferences,
    stats: {
      totalStudySprints: slots.filter((s) => s.type === 'study').length,
      studyHours: (slots.filter((s) => s.type === 'study').length * 50 / 60).toFixed(1),
      prioritizedSubjects: detectedSubjects,
      targetDay: targetDay || 'Full Week',
      examFocusCount: matchedExams.length
    }
  };
}

/* ============================================================================
   AI CHAT SCHEDULE ASSISTANT COMPONENT
   ========================================================================== */

export default function AIChatScheduleAssistant({
  tasks = [],
  topics = [],
  availability = {},
  collegeSchedule = [],
  examSchedule = [],
  timetable = [],
  setTimetable,
  setAvailability,
  student = {},
  weekStart,
  subjectList = [],
  setView,
  setSelectedTimetableDate,
  isOpen,
  onClose
}) {
  const [messages, setMessages] = useState(() => [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Hello **${student?.name || 'Student'}**! ✨ I'm your **AI Schedule Copilot**.\n\nTell me how you'd like to customize your study plan. For example:\n- *"Prioritize Mathematics and Physics for my exam on Friday"*\n- *"Schedule 3 intense revision sprints for today in the evening"*\n- *"Free up tomorrow afternoon and move study sessions to the morning"*\n- *"Balance study time evenly across all my topics"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionPlan: null,
      applied: false
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isProcessing]);

  // Quick Preset Prompts
  const quickPrompts = [
    { label: '⚡ Prioritize Exam Topics', prompt: 'Prioritize upcoming exams and schedule high-intensity revision sprints for this week.' },
    { label: '🎯 Focus on Math & Physics', prompt: 'Allocate 70% of study time to Mathematics and Physics, starting with the hardest topics.' },
    { label: '🌙 Evening Study Schedule', prompt: 'Shift all study sessions to the evening after 5 PM so I have free daytime for college lectures.' },
    { label: '🚀 Intensive 3-Hour Sprint Today', prompt: 'Create an intensive 3-hour study sprint for today focused on my pending tasks.' },
    { label: '⚖️ Balance All Subjects', prompt: 'Distribute study hours evenly across all active subjects with zero subject starvation.' },
    { label: '☕ Light Day Tomorrow', prompt: 'Make tomorrow a light 2-hour revision day and distribute the rest of the hours to other days.' }
  ];

  const handleSendMessage = (textToSend = inputPrompt) => {
    const query = textToSend.trim();
    if (!query || isProcessing) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;

    const userMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: timeNow,
      actionPlan: null,
      applied: false
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsProcessing(true);

    // AI schedule analysis & generation
    setTimeout(() => {
      const context = {
        subjectList,
        examSchedule,
        topics,
        collegeSchedule,
        student
      };

      const parsedIntent = parseAIStudentPrompt(query, context);
      const customResult = generateAICustomTimetable({
        tasks,
        topics,
        availability,
        weekStart,
        collegeSchedule,
        examSchedule,
        student,
        preferences: parsedIntent
      });

      // Construct AI Friendly Explanation
      let aiExplanation = `I've personalized your study schedule based on your request: **"${query}"**\n\n`;

      if (parsedIntent.hasExamIntent || parsedIntent.matchedExams.length > 0) {
        aiExplanation += `🎓 **Exam Optimization**: Prioritized exam sprint topics for **${parsedIntent.detectedSubjects.join(', ') || 'upcoming exams'}** to maximize retention before test dates.\n`;
      }

      if (parsedIntent.detectedSubjects.length > 0) {
        aiExplanation += `📚 **Subject Weighting**: Boosted **${parsedIntent.detectedSubjects.join(' & ')}** to prime study slots with 50-minute deep focus intervals.\n`;
      }

      if (parsedIntent.timePreference) {
        aiExplanation += `⏰ **Time Preference**: Adjusted study blocks to **${parsedIntent.timePreference}** hours around your college lectures.\n`;
      }

      if (parsedIntent.customTargetHours) {
        aiExplanation += `🎯 **Target Hours**: Set daily volume to **${parsedIntent.customTargetHours}h** per day.\n`;
      }

      if (parsedIntent.isFreeDayRequest) {
        aiExplanation += `🌴 **Rest Day**: Cleared study commitments for **${parsedIntent.targetDay || 'the requested period'}**.\n`;
      }

      aiExplanation += `\n**Plan Summary:** Planned **${customResult.stats.totalStudySprints} study sprints** (${customResult.stats.studyHours} total study hours) balanced with 10-minute rest intervals.`;

      const aiMsgId = `ai-${Date.now()}`;
      const aiResponse = {
        id: aiMsgId,
        sender: 'ai',
        text: aiExplanation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPlan: {
          slots: customResult.slots,
          stats: customResult.stats,
          intent: parsedIntent
        },
        applied: false
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 700);
  };

  const handleApplyActionPlan = (msgId, actionPlan) => {
    if (!actionPlan?.slots) return;

    // Apply new slots to timetable state
    setTimetable(actionPlan.slots);

    // Mark message as applied
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );

    // If a specific target day was modified, navigate to it in timetable
    if (actionPlan.intent?.targetDay === 'Today') {
      setSelectedTimetableDate(toISODate(new Date()));
    } else if (actionPlan.intent?.targetDay === 'Tomorrow') {
      setSelectedTimetableDate(toISODate(addDays(new Date(), 1)));
    }

    // Play subtle pleasant chime if supported
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const nowTime = audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(f, nowTime + idx * 0.1);
        gain.gain.setValueAtTime(0.15, nowTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, nowTime + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(nowTime + idx * 0.1);
        osc.stop(nowTime + idx * 0.1 + 0.45);
      });
    } catch {}
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg-welcome-reset',
        sender: 'ai',
        text: `Chat history cleared! 🌟 What schedule adjustment or exam prioritization would you like to make next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPlan: null,
        applied: false
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 flex flex-col shadow-2xl bg-[#181A1D] border border-[#373A40] text-white overflow-hidden ${
        isExpanded
          ? 'inset-4 sm:inset-10 rounded-[32px]'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[92vw] sm:w-[460px] h-[580px] sm:h-[640px] rounded-[28px]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="p-4 sm:p-4.5 bg-[#121316] border-b border-[#2C2E33] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl bg-[#FACC15] text-[#181A1D] flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] border-2 border-[#181A1D] rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white tracking-tight">
                AI Schedule Copilot
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FEF08A]/10 text-[#FACC15] border border-[#FACC15]/20 uppercase">
                Active AI
              </span>
            </div>
            <p className="text-[11px] text-[#A8A29A]">
              Personalized for exams, college hours & daily goals
            </p>
          </div>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[#A8A29A] hover:text-white transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[#A8A29A] hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-[#A8A29A] hover:text-white transition-colors cursor-pointer"
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-[#181A1D]/95">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                isAi ? 'items-start' : 'items-end justify-end'
              }`}
            >
              {isAi && (
                <div className="w-7 h-7 rounded-xl bg-[#282B30] text-[#FACC15] flex items-center justify-center shrink-0 mt-0.5 border border-[#3A3E45]">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2.5 ${
                  isAi
                    ? 'bg-[#22252A] border border-[#32363D] text-[#ECE6DC]'
                    : 'bg-[#FACC15] text-[#181A1D] font-medium ml-auto shadow-md'
                }`}
              >
                {/* Formatted Text Content */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text.split('\n').map((line, idx) => {
                    // Check bold markdown formatting **text**
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                        {parts.map((part, pIdx) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <strong key={pIdx} className={isAi ? 'text-[#FACC15] font-extrabold' : 'font-extrabold text-black'}>
                                {part.slice(2, -2)}
                              </strong>
                            );
                          }
                          if (part.startsWith('*') && part.endsWith('*')) {
                            return (
                              <em key={pIdx} className={isAi ? 'text-[#E5E0D8]' : 'text-black'}>
                                {part.slice(1, -1)}
                              </em>
                            );
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>

                {/* AI Plan Proposal Card & Apply Button */}
                {isAi && msg.actionPlan && (
                  <div className="mt-3 p-3 rounded-xl bg-[#181A1D] border border-[#373A40] space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-[#2C2E33] pb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#FACC15] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Proposed AI Schedule</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#2A2E35] text-[#ECE6DC]">
                        {msg.actionPlan.stats?.totalStudySprints || 0} Sprints ({msg.actionPlan.stats?.studyHours || 0}h)
                      </span>
                    </div>

                    {/* Tags breakdown */}
                    <div className="flex flex-wrap gap-1.5">
                      {msg.actionPlan.stats?.prioritizedSubjects?.map((subj) => (
                        <span key={subj} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FEF08A]/10 text-[#FACC15] border border-[#FACC15]/20">
                          🎯 {subj}
                        </span>
                      ))}
                      {msg.actionPlan.stats?.examFocusCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30">
                          ⚡ Exam Priority
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#25282E] text-[#A8A29A]">
                        {msg.actionPlan.stats?.targetDay}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {msg.applied ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-[#065F46]/40 border border-[#10B981]/40 text-[#34D399] font-extrabold text-xs flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          <span>Applied to Timetable!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApplyActionPlan(msg.id, msg.actionPlan)}
                          className="w-full py-2 px-3 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#181A1D] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                        >
                          <Check className="w-4 h-4" />
                          <span>Apply Changes to Schedule</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setView('timetable');
                          if (msg.actionPlan?.intent?.targetDay === 'Today') {
                            setSelectedTimetableDate(toISODate(new Date()));
                          }
                        }}
                        className="py-2 px-3 rounded-xl bg-[#2A2E35] hover:bg-[#32363D] text-[#ECE6DC] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0"
                        title="View in Timetable tab"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#FACC15]" />
                      </button>
                    </div>
                  </div>
                )}

                <div className={`text-[10px] font-medium text-right ${isAi ? 'text-[#857F76]' : 'text-[#5A554E]'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2.5 text-xs text-[#A8A29A] p-2 animate-pulse">
            <div className="w-6 h-6 rounded-lg bg-[#282B30] text-[#FACC15] flex items-center justify-center border border-[#3A3E45]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>AI Copilot is analyzing subjects & synthesizing your schedule...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-3.5 py-2 bg-[#141518] border-t border-[#282B30] overflow-x-auto flex gap-2 shrink-0 scrollbar-none">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={isProcessing}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#202227] hover:bg-[#2A2D33] text-[#D8D2C7] hover:text-[#FACC15] border border-[#32353C] whitespace-nowrap cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Bottom Input Box */}
      <div className="p-3.5 bg-[#121316] border-t border-[#2C2E33] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-[#1E2024] rounded-2xl p-1.5 border border-[#373A40] focus-within:border-[#FACC15] focus-within:ring-1 focus-within:ring-[#FACC15]/40 transition-all"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask AI to customize your schedule or prioritize exams..."
            disabled={isProcessing}
            className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder-[#78716C] focus:outline-none disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isProcessing}
            className="w-8 h-8 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] disabled:bg-[#32353C] disabled:text-[#666] text-[#181A1D] flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
            title="Send prompt to AI"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-[#6B655E] text-center mt-1.5">
          Ask to prioritize exams, balance subjects, shift hours, or clear rest days.
        </p>
      </div>
    </div>
  );
}
