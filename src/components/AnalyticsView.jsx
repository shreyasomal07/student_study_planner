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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-steady-renewal p-5 sm:p-6 rounded-none border border-rooted-strength/40 shadow-xs">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-liminal-night flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-inner-resolve" />
            Study Progress & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-liminal-night/70 mt-0.5">
            Track your consistency, subject allocation, and assignment resolution rate.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-calm-awakening/20 border border-calm-awakening/40 text-liminal-night text-xs font-bold shadow-xs">
          <Flame className="w-4 h-4 text-calm-awakening fill-calm-awakening" />
          <span>{streakDays > 0 ? `${streakDays}-Day Study Streak Active! 🔥` : '0-Day Streak (Start studying today!) 🔥'}</span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-none border border-rooted-strength/40 bg-steady-renewal p-5 shadow-xs hover:border-inner-resolve/40 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-wild-light text-inner-resolve border border-rooted-strength/30 flex items-center justify-center mb-3 shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-liminal-night">{completedHours}h <span className="text-xs text-liminal-night/60 font-normal">/ {scheduledHours}h</span></p>
          <p className="text-xs text-liminal-night/70 mt-0.5 font-medium">Study Time Logged</p>
          <div className="w-full bg-rooted-strength/30 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-calm-awakening h-2 rounded-full transition-all duration-500" style={{ width: `${scheduledHours ? (completedHours / scheduledHours) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="rounded-none border border-rooted-strength/40 bg-steady-renewal p-5 shadow-xs hover:border-inner-resolve/40 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-wild-light text-inner-resolve border border-rooted-strength/30 flex items-center justify-center mb-3 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-liminal-night">{taskCompletionRate}%</p>
          <p className="text-xs text-liminal-night/70 mt-0.5 font-medium">{completedTasks} of {totalTasks} Tasks Done</p>
          <div className="w-full bg-rooted-strength/30 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-liminal-night h-2 rounded-full transition-all duration-500" style={{ width: `${taskCompletionRate}%` }} />
          </div>
        </div>

        <div className="rounded-none border border-rooted-strength/40 bg-steady-renewal p-5 shadow-xs hover:border-inner-resolve/40 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-wild-light text-calm-awakening border border-rooted-strength/30 flex items-center justify-center mb-3 shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-liminal-night">{topicCompletionRate}%</p>
          <p className="text-xs text-liminal-night/70 mt-0.5 font-medium">{completedTopics} of {totalTopics} Topics Revised</p>
          <div className="w-full bg-rooted-strength/30 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-calm-awakening h-2 rounded-full transition-all duration-500" style={{ width: `${topicCompletionRate}%` }} />
          </div>
        </div>

        <div className="rounded-none border border-rooted-strength/40 bg-steady-renewal p-5 shadow-xs hover:border-inner-resolve/40 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-wild-light text-vital-spark border border-rooted-strength/30 flex items-center justify-center mb-3 shadow-xs">
            <Target className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold text-liminal-night">{goalProgress}%</p>
          <p className="text-xs text-liminal-night/70 mt-0.5 font-medium">Weekly Goal ({weeklyGoalHours}h)</p>
          <div className="w-full bg-rooted-strength/30 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-vital-spark h-2 rounded-full transition-all duration-500" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        
        {/* Subject-Wise Time Allocation */}
        <div className="rounded-none border border-rooted-strength/40 bg-steady-renewal p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-liminal-night text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-inner-resolve" />
              Subject Time Distribution
            </h3>
            <span className="text-xs text-liminal-night/70 font-semibold px-2.5 py-0.5 rounded-full bg-wild-light border border-rooted-strength/40">{subjectStats.length} Subjects</span>
          </div>

          {subjectStats.length === 0 ? (
            <p className="text-xs text-liminal-night/60 py-8 text-center bg-wild-light/50 rounded-2xl border border-dashed border-rooted-strength/40">Generate a timetable to view subject time analytics.</p>
          ) : (
            <div className="space-y-3.5">
              {subjectStats.map((item, idx) => (
                <div key={item.subject}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-liminal-night">{item.subject}</span>
                    <span className="text-liminal-night/70 font-medium">{item.hours}h ({item.percent}%)</span>
                  </div>
                  <div className="w-full bg-rooted-strength/30 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-calm-awakening' : idx === 1 ? 'bg-inner-resolve' : idx === 2 ? 'bg-vital-spark' : 'bg-liminal-night'
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
        <div className="rounded-none border border-rooted-strength/40 bg-steady-renewal p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-liminal-night text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-calm-awakening" />
              Priority-Based Task Completion
            </h3>
            <span className="text-xs text-liminal-night/70 font-semibold px-2.5 py-0.5 rounded-full bg-wild-light border border-rooted-strength/40">{completedTasks}/{totalTasks} Done</span>
          </div>

          <div className="space-y-3">
            {/* High Priority */}
            <div className="p-4 rounded-2xl border border-rooted-strength/40 bg-wild-light/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-liminal-night flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-liminal-night" />
                  High Priority Tasks
                </span>
                <span className="text-liminal-night font-bold">{highDone} of {highPriority.length} completed</span>
              </div>
              <div className="w-full bg-rooted-strength/30 rounded-full h-2 overflow-hidden">
                <div className="bg-liminal-night h-2 rounded-full transition-all duration-500" style={{ width: `${highPriority.length ? (highDone / highPriority.length) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Medium Priority */}
            <div className="p-4 rounded-2xl border border-rooted-strength/40 bg-wild-light/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-liminal-night flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-vital-spark" />
                  Medium Priority Tasks
                </span>
                <span className="text-liminal-night font-bold">{medDone} of {medPriority.length} completed</span>
              </div>
              <div className="w-full bg-rooted-strength/30 rounded-full h-2 overflow-hidden">
                <div className="bg-vital-spark h-2 rounded-full transition-all duration-500" style={{ width: `${medPriority.length ? (medDone / medPriority.length) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Low Priority */}
            <div className="p-4 rounded-2xl border border-rooted-strength/40 bg-wild-light/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-liminal-night flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-calm-awakening" />
                  Low Priority Tasks
                </span>
                <span className="text-liminal-night font-bold">{lowDone} of {lowPriority.length} completed</span>
              </div>
              <div className="w-full bg-rooted-strength/30 rounded-full h-2 overflow-hidden">
                <div className="bg-calm-awakening h-2 rounded-full transition-all duration-500" style={{ width: `${lowPriority.length ? (lowDone / lowPriority.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI Recommendations */}
      <div className="rounded-none border border-rooted-strength/40 bg-steady-renewal p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-calm-awakening/20 border border-calm-awakening/40 text-calm-awakening shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-calm-awakening" />
          </div>
          <div>
            <h4 className="font-display font-bold text-liminal-night text-base">
              AI Study Optimization Insights
            </h4>
            <p className="text-xs sm:text-sm text-liminal-night/75 mt-1 leading-relaxed">
              Based on your {safeStudent.dailyTargetHours || 4}h daily target, your study schedule is distributed evenly with 10-minute rest intervals. You have scheduled <strong>{scheduledHours} hours</strong> of focused study across the week.
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-wild-light border border-rooted-strength/50 text-liminal-night shadow-2xs">🌿 Balanced Routine</span>
              <span className="px-3 py-1 rounded-full bg-wild-light border border-rooted-strength/50 text-liminal-night shadow-2xs">⏱️ Pomodoro Paced</span>
              <span className="px-3 py-1 rounded-full bg-wild-light border border-rooted-strength/50 text-liminal-night shadow-2xs">🎯 Exam Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
