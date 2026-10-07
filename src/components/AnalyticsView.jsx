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

export default function AnalyticsView({ 
  tasks = [], 
  topics = [], 
  timetable = [], 
  student = {}, 
  subjectList = [] 
}) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeTopics = Array.isArray(topics) ? topics : [];
  const safeTimetable = Array.isArray(timetable) ? timetable : [];
  const safeStudent = student || {};

  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter((t) => t?.completed).length;
  const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalTopics = safeTopics.length;
  const completedTopics = safeTopics.filter((t) => t?.completed).length;
  const topicCompletionRate = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Study hours this week from completed blocks + tasks
  const studyBlocks = safeTimetable.filter((b) => b?.type === 'study');
  const completedStudyBlocks = studyBlocks.filter((b) => b?.completed);
  const scheduledHours = Math.round(((studyBlocks.length * 50) / 60) * 10) / 10;
  const completedHours = Math.round(((completedStudyBlocks.length * 50) / 60) * 10) / 10;
  const dailyTarget = Number(safeStudent.dailyTargetHours) || 4;
  const weeklyGoalHours = dailyTarget * 7;
  const goalProgress = weeklyGoalHours ? Math.min(100, Math.round((completedHours / weeklyGoalHours) * 100)) : 0;

  // Subject breakdown calculations
  const subjectHours = {};
  studyBlocks.forEach((b) => {
    if (b?.assigned && b.assigned.subject) {
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
  const highPriority = safeTasks.filter((t) => t?.priority === 'High');
  const medPriority = safeTasks.filter((t) => t?.priority === 'Medium');
  const lowPriority = safeTasks.filter((t) => t?.priority === 'Low');

  const highDone = highPriority.filter((t) => t?.completed).length;
  const medDone = medPriority.filter((t) => t?.completed).length;
  const lowDone = lowPriority.filter((t) => t?.completed).length;

  // Calculate real consecutive days streak from completed study blocks and tasks
  const streakDays = React.useMemo(() => {
    const completedDates = new Set();
    safeTimetable.forEach((b) => {
      if (b?.completed && b?.date) completedDates.add(b.date);
    });
    safeTasks.forEach((t) => {
      if (t?.completed && t?.dueDate) completedDates.add(t.dueDate);
    });
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(checkDate);
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (completedDates.has(iso)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [safeTimetable, safeTasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-theme-text flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-theme-text" />
            Study Progress & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-theme-muted">
            Track your consistency, subject allocation, and assignment resolution rate.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B4C6A6] text-theme-text text-xs font-bold shadow-xs">
          <Flame className="w-4 h-4 text-theme-accent-green fill-theme-accent-green" />
          <span>{streakDays > 0 ? `${streakDays}-Day Study Streak Active! 🔥` : '0-Day Streak (Start studying today!) 🔥'}</span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[30px] border border-theme-border bg-theme-card p-5 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-text flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-extrabold text-theme-text">{completedHours}h <span className="text-xs text-theme-muted font-normal">/ {scheduledHours}h</span></p>
          <p className="text-xs text-theme-muted mt-0.5 font-medium">Study Time Logged</p>
          <div className="w-full bg-theme-bg rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-[#B4C6A6] h-2 rounded-full transition-all" style={{ width: `${scheduledHours ? (completedHours / scheduledHours) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="rounded-[30px] border border-theme-border bg-theme-card p-5 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-accent-blue flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-extrabold text-theme-text">{taskCompletionRate}%</p>
          <p className="text-xs text-theme-muted mt-0.5 font-medium">{completedTasks} of {totalTasks} Tasks Done</p>
          <div className="w-full bg-theme-bg rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-theme-accent-blue h-2 rounded-full transition-all" style={{ width: `${taskCompletionRate}%` }} />
          </div>
        </div>

        <div className="rounded-[30px] border border-theme-border bg-theme-card p-5 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-accent-blue flex items-center justify-center mb-3">
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-extrabold text-theme-text">{topicCompletionRate}%</p>
          <p className="text-xs text-theme-muted mt-0.5 font-medium">{completedTopics} of {totalTopics} Topics Revised</p>
          <div className="w-full bg-theme-bg rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-theme-accent-green h-2 rounded-full transition-all" style={{ width: `${topicCompletionRate}%` }} />
          </div>
        </div>

        <div className="rounded-[30px] border border-theme-border bg-theme-card p-5 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-theme-bg text-theme-text flex items-center justify-center mb-3">
            <Target className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-extrabold text-theme-text">{goalProgress}%</p>
          <p className="text-xs text-theme-muted mt-0.5 font-medium">Weekly Goal ({weeklyGoalHours}h)</p>
          <div className="w-full bg-theme-bg rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-theme-accent-blue h-2 rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        
        {/* Subject-Wise Time Allocation */}
        <div className="rounded-[32px] border border-theme-border bg-theme-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-extrabold text-theme-text text-sm sm:text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-theme-text" />
              Subject Time Distribution
            </h3>
            <span className="text-xs text-theme-muted font-bold">{subjectStats.length} Subjects</span>
          </div>

          {subjectStats.length === 0 ? (
            <p className="text-xs text-theme-muted py-6 text-center">Generate a timetable to view subject time analytics.</p>
          ) : (
            <div className="space-y-3.5">
              {subjectStats.map((item, idx) => (
                <div key={item.subject}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-theme-text">{item.subject}</span>
                    <span className="text-theme-muted font-semibold">{item.hours}h ({item.percent}%)</span>
                  </div>
                  <div className="w-full bg-theme-bg rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        idx === 0 ? 'bg-[#B4C6A6]' : idx === 1 ? 'bg-theme-accent-green' : idx === 2 ? 'bg-theme-accent-blue' : 'bg-theme-accent-blue'
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
        <div className="rounded-[32px] border border-theme-border bg-theme-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-extrabold text-theme-text text-sm sm:text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-theme-accent-green" />
              Priority-Based Task Completion
            </h3>
            <span className="text-xs text-theme-muted font-bold">{completedTasks}/{totalTasks} Done</span>
          </div>

          <div className="space-y-3">
            {/* High Priority */}
            <div className="p-3.5 rounded-2xl border border-theme-accent-green bg-theme-bg">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-theme-text flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B4C6A6]" />
                  High Priority Tasks
                </span>
                <span className="text-theme-text font-bold">{highDone} of {highPriority.length} completed</span>
              </div>
              <div className="w-full bg-theme-card rounded-full h-2 overflow-hidden">
                <div className="bg-[#B4C6A6] h-2 rounded-full transition-all" style={{ width: `${highPriority.length ? (highDone / highPriority.length) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Medium Priority */}
            <div className="p-3.5 rounded-2xl border border-theme-accent-green-light bg-theme-bg">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-theme-accent-blue flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-theme-accent-blue" />
                  Medium Priority Tasks
                </span>
                <span className="text-theme-text font-bold">{medDone} of {medPriority.length} completed</span>
              </div>
              <div className="w-full bg-theme-card rounded-full h-2 overflow-hidden">
                <div className="bg-theme-accent-blue h-2 rounded-full transition-all" style={{ width: `${medPriority.length ? (medDone / medPriority.length) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Low Priority */}
            <div className="p-3.5 rounded-2xl border border-theme-accent-green-light bg-theme-bg">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-theme-accent-blue flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-theme-accent-blue" />
                  Low Priority Tasks
                </span>
                <span className="text-theme-text font-bold">{lowDone} of {lowPriority.length} completed</span>
              </div>
              <div className="w-full bg-theme-card rounded-full h-2 overflow-hidden">
                <div className="bg-theme-accent-blue h-2 rounded-full transition-all" style={{ width: `${lowPriority.length ? (lowDone / lowPriority.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI Recommendations */}
      <div className="rounded-[32px] border border-theme-border bg-[#B4C6A6] text-theme-text p-6">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-[#B4C6A6] text-theme-accent-green shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-extrabold text-theme-text text-sm sm:text-base">
              AI Study Optimization Insights
            </h4>
            <p className="text-xs sm:text-sm text-theme-muted mt-1 leading-relaxed">
              Based on your {safeStudent.dailyTargetHours || 4}h daily target, your study schedule is distributed evenly with 10-minute rest intervals. You have scheduled <strong>{scheduledHours} hours</strong> of focused study across the week.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-theme-text">
              <span className="px-3 py-1 rounded-full bg-[#B4C6A6]"> Balanced Routine</span>
              <span className="px-3 py-1 rounded-full bg-[#B4C6A6]">️ Pomodoro Paced</span>
              <span className="px-3 py-1 rounded-full bg-[#B4C6A6]">🎯 Exam Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
