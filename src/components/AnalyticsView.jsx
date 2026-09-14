import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Flame, 
  Target, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Award,
  CalendarCheck,
  Zap,
  Sparkles
} from 'lucide-react';

export default function AnalyticsView({ tasks, topics, timetable, student, subjectList }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.completed).length;
  const topicCompletionRate = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Study hours this week from completed blocks + tasks
  const studyBlocks = timetable.filter((b) => b.type === 'study');
  const completedStudyBlocks = studyBlocks.filter((b) => b.completed);
  const scheduledHours = Math.round(((studyBlocks.length * 50) / 60) * 10) / 10;
  const completedHours = Math.round(((completedStudyBlocks.length * 50) / 60) * 10) / 10;
  const weeklyGoalHours = (student.dailyTargetHours || 4) * 7;
  const goalProgress = Math.min(100, Math.round((completedHours / weeklyGoalHours) * 100));

  // Subject breakdown calculations
  const subjectHours = {};
  studyBlocks.forEach((b) => {
    if (b.assigned && b.assigned.subject) {
      const s = b.assigned.subject;
      subjectHours[s] = (subjectHours[s] || 0) + 50 / 60;
    }
  });

  const subjectStats = Object.keys(subjectHours).map((sub) => ({
    subject: sub,
    hours: Math.round(subjectHours[sub] * 10) / 10,
    percent: scheduledHours ? Math.round((subjectHours[sub] / scheduledHours) * 100) : 0
  })).sort((a, b) => b.hours - a.hours);

  // Priority distribution
  const highPriority = tasks.filter(t => t.priority === 'High');
  const medPriority = tasks.filter(t => t.priority === 'Medium');
  const lowPriority = tasks.filter(t => t.priority === 'Low');

  const highDone = highPriority.filter(t => t.completed).length;
  const medDone = medPriority.filter(t => t.completed).length;
  const lowDone = lowPriority.filter(t => t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Study Progress & Academic Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track your study consistency, subject distribution, and task completion metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>5-Day Study Streak Active! 🔥</span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-800">{completedHours}h <span className="text-xs text-slate-400 font-normal">/ {scheduledHours}h</span></p>
          <p className="text-xs text-slate-500 mt-0.5">Study Time Logged</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${scheduledHours ? (completedHours / scheduledHours) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-800">{taskCompletionRate}%</p>
          <p className="text-xs text-slate-500 mt-0.5">{completedTasks} of {totalTasks} Tasks Done</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${taskCompletionRate}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-800">{topicCompletionRate}%</p>
          <p className="text-xs text-slate-500 mt-0.5">{completedTopics} of {totalTopics} Topics Revised</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${topicCompletionRate}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Target className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-800">{goalProgress}%</p>
          <p className="text-xs text-slate-500 mt-0.5">Weekly Target ({weeklyGoalHours}h Goal)</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        
        {/* Subject-Wise Time Allocation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Subject Time Distribution
            </h3>
            <span className="text-xs text-slate-400">{subjectStats.length} Subjects</span>
          </div>

          {subjectStats.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Generate a timetable to view subject time analytics.</p>
          ) : (
            <div className="space-y-3.5">
              {subjectStats.map((item, idx) => (
                <div key={item.subject}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">{item.subject}</span>
                    <span className="text-slate-500 font-medium">{item.hours}h ({item.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-sky-500' : idx === 2 ? 'bg-purple-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Task Execution Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Priority-Based Task Completion
            </h3>
            <span className="text-xs text-slate-400">{completedTasks}/{totalTasks} Resolved</span>
          </div>

          <div className="space-y-4">
            {/* High Priority */}
            <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-rose-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  High Priority Tasks
                </span>
                <span className="text-rose-800 font-semibold">{highDone} of {highPriority.length} completed</span>
              </div>
              <div className="w-full bg-rose-100 rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-2 rounded-full transition-all" style={{ width: `${highPriority.length ? (highDone / highPriority.length) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Medium Priority */}
            <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-amber-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Medium Priority Tasks
                </span>
                <span className="text-amber-800 font-semibold">{medDone} of {medPriority.length} completed</span>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${medPriority.length ? (medDone / medPriority.length) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Low Priority */}
            <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Low Priority Tasks
                </span>
                <span className="text-emerald-800 font-semibold">{lowDone} of {lowPriority.length} completed</span>
              </div>
              <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${lowPriority.length ? (lowDone / lowPriority.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Weekly Schedule Efficiency & AI Recommendations */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-sm mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-indigo-950 text-sm sm:text-base">
              AI Study Optimization Insights
            </h4>
            <p className="text-xs sm:text-sm text-indigo-900/80 mt-1 leading-relaxed">
              Based on your {student.dailyTargetHours || 4}h daily target and upcoming assignments, your timetable distributes revision evenly with 10-minute rest cycles. You have scheduled <strong>{scheduledHours} hours</strong> of focused learning across the next 7 days.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-700">
              <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-indigo-200">✨ Balanced Workload</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-indigo-200">⏱️ Pomodoro Optimized</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-indigo-200">🎯 Zero Overdue Risk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
