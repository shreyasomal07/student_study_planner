import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, Sparkles, Bell, Coffee, Target } from 'lucide-react';

export default function PomodoroTimer({ onSessionComplete }) {
  const [mode, setMode] = useState('focus'); // focus (25 or 50) | break (5 or 10)
  const [preset, setPreset] = useState(25); // 25 or 50
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(() => {
    try {
      return parseInt(localStorage.getItem('study_planner_pomodoro_count') || '0', 10);
    } catch {
      return 0;
    }
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(preset * 60);
    setIsRunning(false);
  }, [preset, mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  const handleTimerComplete = () => {
    try {
      // Play web audio chime
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}

    if (mode === 'focus') {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);
      localStorage.setItem('study_planner_pomodoro_count', String(newCount));
      if (onSessionComplete) {
        onSessionComplete(preset);
      }
      alert('🎉 Focus session completed! Great job. Time for a quick break!');
      setMode('break');
      setPreset(5);
    } else {
      alert('☕ Break finished! Ready for the next study session?');
      setMode('focus');
      setPreset(25);
    }
  };

  const toggleRun = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(preset * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((preset * 60 - timeLeft) / (preset * 60)) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 relative overflow-hidden">
      {/* Background progress bar */}
      <div 
        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
        style={{ width: `${progressPercent}%` }}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-display font-semibold text-slate-800 text-sm">Focus Pomodoro</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-500" />
          {sessionsCompleted} completed
        </span>
      </div>

      {/* Mode selectors */}
      <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100/80 rounded-xl mb-4 text-xs font-medium">
        <button
          onClick={() => { setMode('focus'); setPreset(25); }}
          className={`px-3 py-1 rounded-lg transition-all ${
            mode === 'focus' && preset === 25 ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          25m Focus
        </button>
        <button
          onClick={() => { setMode('focus'); setPreset(50); }}
          className={`px-3 py-1 rounded-lg transition-all ${
            mode === 'focus' && preset === 50 ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          50m Deep Study
        </button>
        <button
          onClick={() => { setMode('break'); setPreset(5); }}
          className={`px-3 py-1 rounded-lg transition-all ${
            mode === 'break' && preset === 5 ? 'bg-white text-emerald-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          5m Break
        </button>
        <button
          onClick={() => { setMode('break'); setPreset(15); }}
          className={`px-3 py-1 rounded-lg transition-all ${
            mode === 'break' && preset === 15 ? 'bg-white text-emerald-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          15m Long Break
        </button>
      </div>

      {/* Countdown Clock Display */}
      <div className="text-center my-3">
        <div className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-slate-800 tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <p className="text-xs text-slate-400 mt-1 capitalize font-medium">
          {mode === 'focus' ? '🎯 Stay in the zone' : '☕ Relax and recharge'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={toggleRun}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-95'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
        </button>
        <button
          onClick={resetTimer}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
          title="Reset Timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
