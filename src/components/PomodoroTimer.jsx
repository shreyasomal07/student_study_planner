import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Flame, Sparkles, Bell, Coffee, Target, 
  ArrowRight, ArrowLeft, ChevronLeft, CheckCircle2, Volume2, VolumeX, FastForward,
  BookOpen, Clock, Award, ShieldCheck, ChevronRight, SlidersHorizontal,
  Zap, Compass, Info, Check
} from 'lucide-react';

/* ============================================================================
   WEB AUDIO SOUND ENGINE (Chimes & Notifications)
   ========================================================================== */

function playChime(isStudyComplete = true) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    if (isStudyComplete) {
      // Pleasant Ascending Triad: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.5Hz)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.65);
      });
    } else {
      // Gentle Break Over Chime: G5 (783.99Hz) -> E5 (659.25Hz) -> C5 (523.25Hz)
      const freqs = [783.99, 659.25, 523.25];
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.15 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.7);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.75);
      });
    }
  } catch (e) {
    console.log('Audio not supported', e);
  }
}

/* ============================================================================
   PRESETS & DEFAULTS
   ========================================================================== */

const PRESETS = [
  { label: '25 / 5 Classic', study: 25, break: 5, tag: 'Standard' },
  { label: '50 / 10 Deep Work', study: 50, break: 10, tag: 'High Focus' },
  { label: '45 / 15 Power', study: 45, break: 15, tag: 'Extended' },
  { label: '30 / 5 Sprint', study: 30, break: 5, tag: 'Quick' },
];

export default function PomodoroTimer({ 
  tasks = [], 
  topics = [], 
  student = {}, 
  onSessionComplete,
  activeTopic = null,
  onFinishStudying = null
}) {
  // Always default to setup & topics page when opening the Pomodoro tab unless activeTopic is provided
  const [isSessionActive, setIsSessionActive] = useState(() => !!activeTopic);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [finishSuccessMessage, setFinishSuccessMessage] = useState(null);

  const userKey = (student?.username || student?.name || 'user').toLowerCase().replace(/\s+/g, '_');

  // Settings: Study Duration and Break Duration in minutes
  const [studyMinutes, setStudyMinutes] = useState(() => {
    try {
      const saved = localStorage.getItem(`study_planner_pomo_${userKey}_study_mins`);
      return saved ? parseInt(saved, 10) : 25;
    } catch {
      return 25;
    }
  });

  const [breakMinutes, setBreakMinutes] = useState(() => {
    try {
      const saved = localStorage.getItem(`study_planner_pomo_${userKey}_break_mins`);
      return saved ? parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  const [selectedTaskTitle, setSelectedTaskTitle] = useState(() => {
    if (activeTopic) {
      return typeof activeTopic === 'string' ? activeTopic : (activeTopic.title || '');
    }
    return '';
  });

  // Active Timer State
  const [mode, setMode] = useState('study'); // 'study' | 'break'
  const [timeLeft, setTimeLeft] = useState(() => studyMinutes * 60);
  const [isRunning, setIsRunning] = useState(() => !!activeTopic);
  const [cycleCount, setCycleCount] = useState(1);
  const [totalStudySecondsToday, setTotalStudySecondsToday] = useState(() => {
    try {
      return parseInt(localStorage.getItem(`study_planner_pomo_${userKey}_today_seconds`) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [completedSessionsCount, setCompletedSessionsCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem(`study_planner_pomo_${userKey}_pomodoro_count`) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [sessionLogs, setSessionLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(`study_planner_pomo_${userKey}_logs`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-sync state when active user changes
  useEffect(() => {
    try {
      const savedSecs = parseInt(localStorage.getItem(`study_planner_pomo_${userKey}_today_seconds`) || '0', 10);
      const savedCount = parseInt(localStorage.getItem(`study_planner_pomo_${userKey}_pomodoro_count`) || '0', 10);
      const savedLogs = localStorage.getItem(`study_planner_pomo_${userKey}_logs`);
      setTotalStudySecondsToday(savedSecs);
      setCompletedSessionsCount(savedCount);
      setSessionLogs(savedLogs ? JSON.parse(savedLogs) : []);
    } catch (e) {}
  }, [userKey]);

  const intervalRef = useRef(null);

  // Sync if parent passes new activeTopic
  useEffect(() => {
    if (activeTopic) {
      const title = typeof activeTopic === 'string' ? activeTopic : (activeTopic.title || '');
      setSelectedTaskTitle(title);
      setIsSessionActive(true);
      setIsEditingSettings(false);
      setMode('study');
      setTimeLeft(studyMinutes * 60);
      setIsRunning(true);
    }
  }, [activeTopic]);

  // Sync timer default duration when studyMinutes or breakMinutes changes while in setup view
  useEffect(() => {
    if (!isSessionActive) {
      if (mode === 'study') {
        setTimeLeft(studyMinutes * 60);
      } else {
        setTimeLeft(breakMinutes * 60);
      }
    }
  }, [studyMinutes, breakMinutes, mode, isSessionActive]);

  // Main Timer Interval & Automatic Alternation Logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // TIME REACHED 00:00 -> AUTO SWITCH
            handleTimerComplete();
            return 0;
          }
          // Increment total study seconds today if in study mode
          if (mode === 'study') {
            setTotalStudySecondsToday((sec) => {
              const updated = sec + 1;
              try {
                localStorage.setItem(`study_planner_pomo_${userKey}_today_seconds`, String(updated));
              } catch {}
              return updated;
            });
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, studyMinutes, breakMinutes, cycleCount, userKey]);

  // Handle Finished Studying (User manually marks topic finished in Pomodoro)
  const handleFinishStudying = () => {
    playChime(true);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentTopicTitle = selectedTaskTitle || (activeTopic && typeof activeTopic === 'object' ? activeTopic.title : activeTopic) || 'Focused Study Session';

    // Increment completed sessions count
    const newCount = completedSessionsCount + 1;
    setCompletedSessionsCount(newCount);
    try {
      localStorage.setItem(`study_planner_pomo_${userKey}_pomodoro_count`, String(newCount));
    } catch {}

    // Calculate elapsed or completed study minutes
    const elapsedSeconds = mode === 'study' ? Math.max(300, (studyMinutes * 60) - timeLeft) : (studyMinutes * 60);
    const addedStudyMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    setTotalStudySecondsToday((sec) => {
      const updated = sec + elapsedSeconds;
      try {
        localStorage.setItem(`study_planner_pomo_${userKey}_today_seconds`, String(updated));
      } catch {}
      return updated;
    });

    // Session log
    const newLog = {
      id: Math.random().toString(36).slice(2, 9),
      type: 'study',
      duration: addedStudyMinutes,
      task: currentTopicTitle,
      time: timeNow,
      status: 'completed'
    };
    setSessionLogs((prev) => {
      const updated = [newLog, ...prev.slice(0, 8)];
      try { localStorage.setItem(`study_planner_pomo_${userKey}_logs`, JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (onFinishStudying) {
      onFinishStudying(activeTopic || { title: currentTopicTitle }, addedStudyMinutes);
    }
    if (onSessionComplete) {
      onSessionComplete(addedStudyMinutes);
    }

    setFinishSuccessMessage(`🎉 Finished "${currentTopicTitle}"! Logged ${addedStudyMinutes}m to Study Analytics.`);
    setTimeout(() => setFinishSuccessMessage(null), 5000);

    // Auto switch to break mode so student can relax
    setMode('break');
    setTimeLeft(breakMinutes * 60);
    setIsRunning(true);
  };

  // Automatic transition between Study and Break
  const handleTimerComplete = useCallback(() => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (mode === 'study') {
      // 1. Finished Study -> Auto switch to Break
      playChime(true);
      const newCount = completedSessionsCount + 1;
      setCompletedSessionsCount(newCount);
      localStorage.setItem(`study_planner_pomo_${userKey}_pomodoro_count`, String(newCount));

      // Append log
      const newLog = {
        id: Math.random().toString(36).slice(2, 9),
        type: 'study',
        duration: studyMinutes,
        task: selectedTaskTitle || 'Focused Study Session',
        time: timeNow
      };
      setSessionLogs((prev) => {
        const updated = [newLog, ...prev.slice(0, 8)];
        try { localStorage.setItem(`study_planner_pomo_${userKey}_logs`, JSON.stringify(updated)); } catch {}
        return updated;
      });

      if (onSessionComplete) {
        onSessionComplete(studyMinutes);
      }

      // Automatically transition to BREAK mode and restart countdown immediately
      setMode('break');
      setTimeLeft(breakMinutes * 60);
      setIsRunning(true); // Continuous automatic flow

    } else {
      // 2. Finished Break -> Auto switch back to Study
      playChime(false);
      setCycleCount((c) => c + 1);

      // Append log
      const newLog = {
        id: Math.random().toString(36).slice(2, 9),
        type: 'break',
        duration: breakMinutes,
        task: 'Recharge & Stretch',
        time: timeNow
      };
      setSessionLogs((prev) => {
        const updated = [newLog, ...prev.slice(0, 8)];
        try { localStorage.setItem(`study_planner_pomo_${userKey}_logs`, JSON.stringify(updated)); } catch {}
        return updated;
      });

      // Automatically transition back to STUDY mode and restart countdown immediately
      setMode('study');
      setTimeLeft(studyMinutes * 60);
      setIsRunning(true); // Continuous automatic flow
    }
  }, [mode, studyMinutes, breakMinutes, completedSessionsCount, selectedTaskTitle, onSessionComplete, userKey]);

  // Controls
  const togglePlay = () => setIsRunning(!isRunning);

  const resetSession = () => {
    setIsRunning(false);
    setMode('study');
    setTimeLeft(studyMinutes * 60);
  };

  const skipCurrentPhase = () => {
    if (window.confirm(`Skip current ${mode === 'study' ? 'Study' : 'Break'} session?`)) {
      if (mode === 'study') {
        setMode('break');
        setTimeLeft(breakMinutes * 60);
      } else {
        setMode('study');
        setCycleCount((c) => c + 1);
        setTimeLeft(studyMinutes * 60);
      }
    }
  };

  const handleStartFromSetup = () => {
    try {
      localStorage.setItem(`study_planner_pomo_${userKey}_study_mins`, String(studyMinutes));
      localStorage.setItem(`study_planner_pomo_${userKey}_break_mins`, String(breakMinutes));
    } catch {}
    setIsSessionActive(true);
    setIsEditingSettings(false);
    setMode('study');
    setTimeLeft(studyMinutes * 60);
    setIsRunning(true);
  };

  const applyPreset = (preset) => {
    setStudyMinutes(preset.study);
    setBreakMinutes(preset.break);
  };

  // Math for Circular Progress Ring
  const totalCurrentSeconds = mode === 'study' ? studyMinutes * 60 : breakMinutes * 60;
  const progressRatio = Math.max(0, Math.min(1, (totalCurrentSeconds - timeLeft) / (totalCurrentSeconds || 1)));
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  const totalHoursToday = (totalStudySecondsToday / 3600).toFixed(1);
  const dailyTarget = student?.dailyTargetHours || 4;
  const targetPercent = Math.min(100, Math.round(((totalStudySecondsToday / 3600) / dailyTarget) * 100));

  /* =========================================================================
     VIEW 1: SETUP & TOPIC SELECTION SCREEN (Full Width)
     ========================================================================= */
  if (!isSessionActive || isEditingSettings) {
    return (
      <div className="w-full space-y-5 py-1 animate-in fade-in duration-300">
        
        {/* Full-Width Top Hero Card */}
        <div className="w-full bg-[#DDD7CC] rounded-[34px] p-6 sm:p-7 relative overflow-hidden shadow-xs border border-[#D0C9BD] flex flex-col justify-between">
          <div className="flex items-center justify-between relative z-10 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#181A1D] text-[#FACC15] flex items-center justify-center shadow-md">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-[#181A1D] text-lg sm:text-xl tracking-tight">
                  Pomodoro Focus Setup
                </h2>
                <p className="text-xs text-[#6B655E] font-medium">
                  Set your study sprint, break intervals, and select your study topic
                </p>
              </div>
            </div>
            {isSessionActive && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsSessionActive(false);
                    setIsEditingSettings(false);
                    setIsRunning(false);
                    setTimeLeft(studyMinutes * 60);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white text-xs font-bold text-[#E11D48] border border-[#FECDD3] cursor-pointer shadow-2xs transition-all"
                >
                  End Session
                </button>
                <button
                  onClick={() => setIsEditingSettings(false)}
                  className="px-4 py-1.5 rounded-full bg-[#181A1D] hover:bg-black text-xs font-bold text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Return to Timer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FACC15]" />
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-[#5A554E] font-medium leading-relaxed max-w-2xl relative z-10">
            Customize your study intervals. Once started, the timer will automatically transition between 
            <strong className="text-[#181A1D]"> Study ({studyMinutes}m) ➔ Break ({breakMinutes}m) ➔ Study ({studyMinutes}m)</strong> with zero clicks required.
          </p>

          {/* Quick Presets Row */}
          <div className="mt-5 pt-4 border-t border-[#C8C1B3] relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B655E] mb-2.5">
              Popular Presets
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESETS.map((p) => {
                const isSelected = studyMinutes === p.study && breakMinutes === p.break;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#181A1D] text-white border-[#181A1D] shadow-md scale-[1.01]'
                        : 'bg-white/80 hover:bg-white border-[#D0C9BD] text-[#181A1D]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold opacity-70 block">{p.tag}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#FACC15]" />}
                    </div>
                    <span className="text-xs font-black block mt-0.5">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full-Width Two-Column Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Sliders & Subject Linker */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* 1. Study Duration Picker */}
              <div className="bg-white p-5 rounded-[28px] border border-[#ECE6DC] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#181A1D] text-[#FACC15] flex items-center justify-center">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <label className="text-xs font-extrabold text-[#181A1D]">
                      Study Duration
                    </label>
                  </div>
                  <span className="text-sm font-black text-[#181A1D] bg-[#F8F6F1] px-3 py-0.5 rounded-full border border-[#ECE6DC]">
                    {studyMinutes} min
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8880]">
                  Focus duration before break
                </p>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={studyMinutes}
                  onChange={(e) => setStudyMinutes(Number(e.target.value))}
                  className="w-full accent-[#181A1D] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] font-bold text-[#A8A29E]">
                  <span>5m</span>
                  <span>25m (Std)</span>
                  <span>50m (Deep)</span>
                  <span>90m</span>
                </div>
              </div>

              {/* 2. Break Duration Picker */}
              <div className="bg-white p-5 rounded-[28px] border border-[#ECE6DC] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#FB7185] text-white flex items-center justify-center">
                      <Coffee className="w-3.5 h-3.5" />
                    </div>
                    <label className="text-xs font-extrabold text-[#181A1D]">
                      Break Duration
                    </label>
                  </div>
                  <span className="text-sm font-black text-[#181A1D] bg-[#F8F6F1] px-3 py-0.5 rounded-full border border-[#ECE6DC]">
                    {breakMinutes} min
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8880]">
                  Rest duration between study cycles
                </p>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="w-full accent-[#FB7185] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] font-bold text-[#A8A29E]">
                  <span>1m</span>
                  <span>5m (Std)</span>
                  <span>15m</span>
                  <span>30m</span>
                </div>
              </div>

            </div>

            {/* Interactive Topic / Chapter Linker */}
            <div className="bg-white p-5 rounded-[28px] border border-[#ECE6DC] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#181A1D] flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#EAB308]" />
                  What topic are you studying?
                </label>
                {selectedTaskTitle && (
                  <button
                    onClick={() => setSelectedTaskTitle('')}
                    className="text-[10px] font-bold text-[#FB7185] hover:underline cursor-pointer"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {/* Quick Select Chips from Student Topics & Tasks */}
              {(topics.length > 0 || tasks.length > 0) && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] block">
                    Quick Pick From Your Courses & Tasks:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {topics.map((tp) => {
                      const topicLabel = `${tp.subject}: ${tp.name}`;
                      const isSelected = selectedTaskTitle === topicLabel;
                      return (
                        <button
                          key={tp.id}
                          type="button"
                          onClick={() => setSelectedTaskTitle(topicLabel)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#181A1D] text-[#FACC15] shadow-sm'
                              : 'bg-[#F8F6F1] hover:bg-[#EBE6DF] text-[#181A1D] border border-[#ECE6DC]'
                          }`}
                        >
                          <span>{tp.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                            isSelected ? 'bg-[#2B2F36] text-[#FACC15]' : 'bg-[#E5DFD5] text-[#6B655E]'
                          }`}>
                            {tp.subject}
                          </span>
                        </button>
                      );
                    })}

                    {tasks.filter(t => !t.completed).map((t) => {
                      const isSelected = selectedTaskTitle === t.title;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTaskTitle(t.title)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#181A1D] text-[#FACC15] shadow-sm'
                              : 'bg-[#F8F6F1] hover:bg-[#EBE6DF] text-[#181A1D] border border-[#ECE6DC]'
                          }`}
                        >
                          <span>{t.title}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#FECDD3] text-[#E11D48] font-bold">
                            Task
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dropdown & Custom Text Input */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <select
                  value={selectedTaskTitle}
                  onChange={(e) => setSelectedTaskTitle(e.target.value)}
                  className="w-full sm:w-1/2 bg-[#F8F6F1] border border-[#ECE6DC] rounded-2xl px-3.5 py-2.5 text-xs text-[#181A1D] font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">-- Or choose from list --</option>
                  {topics.map(tp => (
                    <option key={tp.id} value={`${tp.subject}: ${tp.name}`}>{tp.subject} — {tp.name}</option>
                  ))}
                  {tasks.filter(t => !t.completed).map(t => (
                    <option key={t.id} value={t.title}>Task: {t.title} ({t.subject})</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Or type custom topic / chapter..."
                  value={selectedTaskTitle}
                  onChange={(e) => setSelectedTaskTitle(e.target.value)}
                  className="w-full sm:w-1/2 bg-[#F8F6F1] border border-[#ECE6DC] rounded-2xl px-3.5 py-2.5 text-xs text-[#181A1D] font-medium focus:outline-none"
                />
              </div>

              {selectedTaskTitle && (
                <div className="p-2.5 rounded-xl bg-[#FEFCE8] border border-[#FEF08A] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold text-[#CA8A04]">Selected Topic:</span>
                    <span className="font-bold text-[#181A1D]">{selectedTaskTitle}</span>
                  </div>
                  <Check className="w-4 h-4 text-[#CA8A04]" />
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Workflow Summary Card & Action Button */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            <div className="bg-[#181A1D] text-white rounded-[28px] p-6 shadow-md border border-[#2B2F36] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A6ADB8]">
                  Continuous Cycle Plan
                </span>
                <span className="text-xs font-black text-[#FACC15] bg-[#262A30] px-2.5 py-0.5 rounded-full">
                  Looping
                </span>
              </div>

              {/* Visual Flow diagram */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#242830] border border-[#313640]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                    <span className="font-bold">1. Study Sprint</span>
                  </div>
                  <span className="font-extrabold text-[#FACC15]">{studyMinutes} mins</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#242830] border border-[#313640]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
                    <span className="font-bold">2. Rest & Recharge</span>
                  </div>
                  <span className="font-extrabold text-[#FB7185]">{breakMinutes} mins</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#242830] border border-[#313640]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                    <span className="font-bold">3. Next Study Sprint</span>
                  </div>
                  <span className="font-extrabold text-[#FACC15]">{studyMinutes} mins</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#8E95A2] pt-1">
                <Zap className="w-3.5 h-3.5 text-[#FACC15] shrink-0" />
                <span>Audio chimes will alert you on every phase switch.</span>
              </div>
            </div>

            {/* Start CTA Button */}
            <button
              onClick={handleStartFromSetup}
              className="w-full bg-[#181A1D] hover:bg-black text-white p-4 rounded-[24px] font-extrabold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <span>Start Pomodoro Session ({studyMinutes}m / {breakMinutes}m)</span>
              <ArrowRight className="w-4 h-4 text-[#FACC15]" />
            </button>

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================================
     VIEW 2: ACTIVE POMODORO FOCUS DASHBOARD (Full Width & Balanced)
     ========================================================================= */
  return (
    <div className="w-full space-y-5">
      
      {/* Top Main Focus Hero & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Big Glowing Focus Timer Card */}
        <div className="lg:col-span-7 bg-[#DDD7CC] rounded-[36px] p-6 sm:p-8 relative overflow-hidden shadow-xs border border-[#D0C9BD] flex flex-col justify-between min-h-[460px]">
          
          {/* Top Bar inside Card */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#181A1D] text-[#FACC15] flex items-center justify-center shadow-sm">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-[#181A1D] text-base sm:text-lg tracking-tight">
                  Focus Pomodoro
                </h2>
                <p className="text-[11px] text-[#6B655E] font-medium">
                  Continuous alternating study cycle
                </p>
              </div>
            </div>

            {/* Current Mode Badge */}
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs ${
                mode === 'study' 
                  ? 'bg-[#181A1D] text-[#FACC15]' 
                  : 'bg-[#FB7185] text-white'
              }`}>
                {mode === 'study' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-ping" />
                    <span>STUDY MODE · Cycle #{cycleCount}</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-3.5 h-3.5 text-white" />
                    <span>BREAK TIME · Recharge</span>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsEditingSettings(true)}
                className="px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-[#181A1D] border border-[#D0C9BD] flex items-center gap-1 text-xs font-bold cursor-pointer shadow-2xs transition-all hover:border-[#181A1D]"
                title="Back to Setup & Timings"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>
          </div>

          {/* Success Banner if Finished */}
          {finishSuccessMessage && (
            <div className="my-2 p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200 relative z-20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>{finishSuccessMessage}</span>
              </div>
              <button
                onClick={() => setFinishSuccessMessage(null)}
                className="text-[#065F46] hover:text-black text-xs font-black cursor-pointer px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Central Circular Animated Timer Ring */}
          <div className="relative my-6 flex flex-col items-center justify-center z-10">
            
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              
              {/* Glowing Background Glow Filter */}
              <div className={`absolute inset-4 rounded-full filter blur-2xl opacity-40 transition-all duration-700 ${
                mode === 'study' ? 'bg-[#FACC15]' : 'bg-[#FB7185]'
              }`} />

              <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 250 250">
                {/* Track circle */}
                <circle
                  cx="125"
                  cy="125"
                  r="110"
                  fill="none"
                  stroke="#C8C1B3"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Active progress stroke */}
                <circle
                  cx="125"
                  cy="125"
                  r="110"
                  fill="none"
                  stroke={mode === 'study' ? '#181A1D' : '#FB7185'}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Inner Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B655E] mb-1">
                  {mode === 'study' ? '🎯 FOCUS TIME' : '☕ BREAK TIME'}
                </span>
                
                {/* Big numbers */}
                <div className="text-5xl sm:text-6xl font-black font-display text-[#181A1D] tracking-tight tabular-nums drop-shadow-xs">
                  {formattedMinutes}:{formattedSeconds}
                </div>

                {/* Subtitle status */}
                <p className="text-[11px] font-bold text-[#5A554E] mt-1 max-w-[200px] truncate">
                  {selectedTaskTitle || (mode === 'study' ? `${studyMinutes}m Study Sprint` : `${breakMinutes}m Relaxation`)}
                </p>
              </div>

            </div>

          </div>

          {/* Bottom Action Controls Row */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 relative z-10 pt-2">
            
            {/* Start / Pause Main Capsule */}
            <button
              onClick={togglePlay}
              className={`px-6 sm:px-7 py-3 rounded-full font-black text-xs sm:text-sm tracking-wide shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                isRunning 
                  ? 'bg-white hover:bg-[#F8F6F1] text-[#181A1D] border border-[#D0C9BD]' 
                  : 'bg-[#181A1D] hover:bg-black text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current text-[#FB7185]" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-[#FACC15]" />
                  <span>{timeLeft === (mode === 'study' ? studyMinutes * 60 : breakMinutes * 60) ? 'Start Session' : 'Resume'}</span>
                </>
              )}
            </button>

            {/* Finished Studying Action Button */}
            <button
              onClick={handleFinishStudying}
              className="px-5 sm:px-6 py-3 rounded-full font-extrabold text-xs sm:text-sm tracking-wide bg-[#10B981] hover:bg-[#059669] text-white shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              title="Mark this study topic as completed and log to analytics"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Finished Studying</span>
            </button>

            {/* Skip Phase */}
            <button
              onClick={skipCurrentPhase}
              className="p-3 rounded-full bg-white/80 hover:bg-white text-[#181A1D] border border-[#D0C9BD] cursor-pointer shadow-2xs transition-all"
              title="Skip to next phase"
            >
              <FastForward className="w-4 h-4" />
            </button>

            {/* Reset / Stop */}
            <button
              onClick={resetSession}
              className="p-3 rounded-full bg-white/80 hover:bg-white text-[#181A1D] border border-[#D0C9BD] cursor-pointer shadow-2xs transition-all"
              title="Reset timer to beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Change Timings Settings */}
            <button
              onClick={() => setIsEditingSettings(true)}
              className="px-3.5 py-3 rounded-full bg-white/80 hover:bg-white text-xs font-bold text-[#181A1D] border border-[#D0C9BD] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
              title="Configure durations"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8E8880]" />
              <span>{studyMinutes}m / {breakMinutes}m</span>
            </button>

          </div>

        </div>

        {/* Right Column: Dark Training & Focus Analytics (Matching Home Page) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          
          {/* Dark Overview Card */}
          <div className="bg-[#181A1D] text-white rounded-[34px] p-6 sm:p-7 shadow-lg border border-[#2B2F36] space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-base">
                Today's Focus Streak
              </h3>
              <span className="text-xs font-bold text-[#FACC15] bg-[#282C33] px-3 py-1 rounded-full flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-[#FACC15]" />
                {completedSessionsCount} Sessions
              </span>
            </div>

            {/* Meter circles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-[#242830] p-4 rounded-2xl border border-[#313640]">
                <span className="text-[10px] text-[#8E95A2] font-semibold uppercase">Focus Time Today</span>
                <p className="font-display font-black text-xl text-white mt-1">
                  {totalHoursToday} <span className="text-xs font-normal text-[#8E95A2]">hrs</span>
                </p>
                <div className="w-full bg-[#181A1D] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#FACC15] h-full rounded-full" style={{ width: `${targetPercent}%` }} />
                </div>
              </div>

              <div className="bg-[#242830] p-4 rounded-2xl border border-[#313640]">
                <span className="text-[10px] text-[#8E95A2] font-semibold uppercase">Daily Goal</span>
                <p className="font-display font-black text-xl text-[#FB7185] mt-1">
                  {targetPercent}% <span className="text-xs font-normal text-[#8E95A2]">of {dailyTarget}h</span>
                </p>
                <div className="w-full bg-[#181A1D] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#FB7185] h-full rounded-full" style={{ width: `${targetPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Auto-Cycling Notice */}
            <div className="bg-[#242830]/80 p-3.5 rounded-2xl border border-[#313640] flex items-center gap-3 text-xs text-[#A6ADB8]">
              <div className="w-6 h-6 rounded-full bg-[#FACC15]/20 text-[#FACC15] flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span>
                Auto-alternating is <strong>ON</strong>. The break will trigger automatically when study completes.
              </span>
            </div>

          </div>

          {/* Quick Tasks & Focus Log Card */}
          <div className="bg-white rounded-[32px] p-5 sm:p-6 shadow-xs border border-[#ECE6DC] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-extrabold text-sm text-[#181A1D]">
                Focus Session Log
              </h4>
              <span className="text-[10px] font-bold text-[#8E8880]">Today</span>
            </div>

            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {sessionLogs.length === 0 ? (
                <p className="text-xs text-[#A8A29E] text-center py-4">No completed sprints yet today.</p>
              ) : (
                sessionLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE6DC] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${log.type === 'study' ? 'bg-[#EAB308]' : 'bg-[#FB7185]'}`} />
                      <span className="font-bold text-[#181A1D] truncate max-w-[160px]">{log.task}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#8E8880] font-semibold">
                      <span>{log.duration}m</span>
                      <span>·</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
