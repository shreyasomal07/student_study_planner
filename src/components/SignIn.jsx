import React, { useState } from 'react';
import { 
  GraduationCap, User, BookOpen, Sparkles, ArrowRight, Calendar, Award, 
  School, Flame, CheckCircle2, ChevronRight, Lightbulb, Lock, Eye, EyeOff, 
  LogIn, UserPlus, KeyRound, Trash2, X, Plus, Clock, Target, Check, Layers
} from 'lucide-react';

const AVATARS = ['🎓', '⚡', '🚀', '🧠', '💻', '🔬', '📚', '🎯', '🎨', '🌟'];

const STUDY_LEVELS = [
  {
    id: 'higher_studies',
    title: 'Higher Studies (College / University)',
    subtitle: 'Undergrad, Postgrad, Masters, Engineering, Medicine, etc.',
    icon: GraduationCap,
    badge: 'Higher Ed',
  },
  {
    id: 'senior_secondary',
    title: 'Senior Secondary (11th – 12th Grade)',
    subtitle: 'High school graduation, board exams prep, APs',
    icon: School,
    badge: 'Grades 11-12',
  },
  {
    id: 'high_school',
    title: 'High School (9th – 10th Grade)',
    subtitle: 'Secondary school curriculum & foundational studies',
    icon: BookOpen,
    badge: 'Grades 9-10',
  },
  {
    id: 'competitive_exams',
    title: 'Competitive Exam Preparation',
    subtitle: 'JEE, NEET, UPSC, GATE, GRE, GMAT, SAT, etc.',
    icon: Award,
    badge: 'Exam Prep',
  },
  {
    id: 'self_learning',
    title: 'Self-Learning / Certifications / Other',
    subtitle: 'Skill building, coding bootcamps, language learning',
    icon: Lightbulb,
    badge: 'Self Paced',
  }
];

const COLLEGE_YEARS = [
  { id: '1st_year', label: '1st Year (Freshman)', short: '1st Year' },
  { id: '2nd_year', label: '2nd Year (Sophomore)', short: '2nd Year' },
  { id: '3rd_year', label: '3rd Year (Junior)', short: '3rd Year' },
  { id: '4th_year', label: '4th Year (Senior)', short: '4th Year' },
  { id: '5th_year', label: '5th / Final Year', short: 'Final Year' },
  { id: 'postgrad_1', label: 'Postgraduate (Masters / Year 1)', short: 'Masters Y1' },
  { id: 'postgrad_2', label: 'Postgraduate (Masters / Year 2)', short: 'Masters Y2' },
  { id: 'phd', label: 'PhD / Doctoral Researcher', short: 'PhD Scholar' }
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

export default function SignIn({ 
  onLogin, 
  onRegister, 
  onResetPassword,
  existingAccounts = {}, 
  initialData = null, 
  initialPlannerData = null,
  isEditing = false,
  onUpdateProfile,
  onDeleteAccount,
  onDeleteSavedAccount,
  onCancelEdit
}) {
  const accountList = Object.values(existingAccounts || {});
  const [mode, setMode] = useState(isEditing ? 'edit' : (accountList.length > 0 ? 'login' : 'register'));
  const [regStep, setRegStep] = useState(1); // 1: Profile & Target, 2: Subjects & Chapters, 3: Availability & Hours
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  // Forgot password form state
  const [forgotForm, setForgotForm] = useState({
    username: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Register / Edit form state (Step 1)
  const [regForm, setRegForm] = useState({
    username: initialData?.username || '',
    password: '',
    confirmPassword: '',
    name: initialData?.name || '',
    age: initialData?.age || '',
    studying: initialData?.studying || 'higher_studies',
    collegeYear: initialData?.collegeYear || '2nd_year',
    courseName: initialData?.courseName || '',
    avatar: initialData?.avatar || '🎓',
    dailyTargetHours: initialData?.dailyTargetHours || 4
  });

  // Step 2 State: Subjects and Topics / Chapters (loads from initialPlannerData if editing)
  const [subjects, setSubjects] = useState(() => {
    const existingTopics = initialPlannerData?.topics || [];
    if (!existingTopics.length) return [];
    const map = new Map();
    existingTopics.forEach((t, idx) => {
      const subName = t.subject || 'General';
      if (!map.has(subName)) {
        map.set(subName, {
          id: 's_' + idx + '_' + subName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: subName,
          priority: t.subjectPriority || 'Medium',
          chapters: []
        });
      }
      map.get(subName).chapters.push({
        id: t.id || ('c_' + idx + '_' + Math.random().toString(36).slice(2, 6)),
        name: t.name,
        difficulty: t.difficulty || 'Medium',
        priority: t.priority || (t.difficulty === 'Hard' ? 'High' : t.difficulty === 'Medium' ? 'Medium' : 'Low'),
        completed: !!t.completed,
        sessionsDone: t.sessionsDone || 0,
        totalSessions: t.totalSessions || (t.difficulty === 'Hard' ? 6 : t.difficulty === 'Medium' ? 4 : 2)
      });
    });
    return Array.from(map.values());
  });

  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [newSubjectPriority, setNewSubjectPriority] = useState('Medium');
  const [activeSubjectId, setActiveSubjectId] = useState(() => {
    const existingTopics = initialPlannerData?.topics || [];
    if (existingTopics.length > 0) {
      const subName = existingTopics[0].subject || 'General';
      return 's_0_' + subName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    return null;
  });
  const [newChapterInput, setNewChapterInput] = useState('');
  const [newChapterDifficulty, setNewChapterDifficulty] = useState('Medium');
  const [newChapterPriority, setNewChapterPriority] = useState('Medium');

  // Step 3 State: Availability Time Slots (loads from initialPlannerData if editing)
  const [availability, setAvailability] = useState(() => {
    if (initialPlannerData?.availability && typeof initialPlannerData.availability === 'object' && Object.keys(initialPlannerData.availability).length > 0) {
      return initialPlannerData.availability;
    }
    return {
      Mon: [17, 18, 19, 20], Tue: [17, 18, 19, 20], Wed: [17, 18, 19, 20],
      Thu: [17, 18, 19, 20], Fri: [17, 18, 19, 20],
      Sat: [10, 11, 12, 13, 14, 15], Sun: [10, 11, 12, 13, 14, 15],
    };
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics
  const totalWeeklyStudyHours = Object.values(availability || {}).reduce(
    (acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0),
    0
  );
  const totalChaptersCount = subjects.reduce(
    (sum, s) => sum + (s.chapters?.length || 0),
    0
  );

  /* ---- Handlers for Step 2 Subjects & Chapters ---- */
  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    const newId = 's_' + Date.now();
    const newSub = { id: newId, name: trimmed, priority: newSubjectPriority, chapters: [] };
    setSubjects(prev => [...prev, newSub]);
    setActiveSubjectId(newId);
    setNewSubjectInput('');
    setNewSubjectPriority('Medium');
  };

  const handleToggleSubjectPriority = (subjectId) => {
    const priorityOrder = ['High', 'Medium', 'Low'];
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const currentIdx = priorityOrder.indexOf(s.priority || 'Medium');
        const nextPriority = priorityOrder[(currentIdx + 1) % priorityOrder.length];
        return { ...s, priority: nextPriority };
      }
      return s;
    }));
  };

  const handleRemoveSubject = (id) => {
    const updated = subjects.filter(s => s.id !== id);
    setSubjects(updated);
    if (activeSubjectId === id) {
      setActiveSubjectId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleAddChapter = () => {
    const trimmed = newChapterInput.trim();
    if (!trimmed || !activeSubjectId) return;
    setSubjects(subjects.map(s => {
      if (s.id === activeSubjectId) {
        return {
          ...s,
          chapters: [...s.chapters, {
            id: 'c_' + Date.now() + Math.random().toString(36).slice(2, 6),
            name: trimmed,
            difficulty: newChapterDifficulty,
            priority: newChapterPriority,
            completed: false,
            sessionsDone: 0,
            totalSessions: newChapterDifficulty === 'Hard' ? 6 : newChapterDifficulty === 'Medium' ? 4 : 2
          }]
        };
      }
      return s;
    }));
    setNewChapterInput('');
    setNewChapterPriority('Medium');
  };

  const handleToggleChapterPriority = (subjectId, chapterId) => {
    const priorityOrder = ['High', 'Medium', 'Low'];
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id === chapterId) {
              const currentIdx = priorityOrder.indexOf(c.priority || 'Medium');
              const nextPriority = priorityOrder[(currentIdx + 1) % priorityOrder.length];
              return { ...c, priority: nextPriority };
            }
            return c;
          })
        };
      }
      return s;
    }));
  };

  const handleSortChaptersByPriority = (subjectId) => {
    const weight = { High: 3, Medium: 2, Low: 1 };
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const sorted = [...s.chapters].sort((a, b) => (weight[b.priority || 'Medium'] || 2) - (weight[a.priority || 'Medium'] || 2));
        return { ...s, chapters: sorted };
      }
      return s;
    }));
  };

  const handleRemoveChapter = (subjectId, chapterId) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.filter(c => c.id !== chapterId)
        };
      }
      return s;
    }));
  };

  /* ---- Handlers for Step 3 Availability ---- */
  const toggleSlot = (day, hour) => {
    setAvailability((prev) => {
      const current = prev[day] || [];
      const exists = current.includes(hour);
      return {
        ...prev,
        [day]: exists ? current.filter((h) => h !== hour) : [...current, hour].sort((a, b) => a - b),
      };
    });
  };

  const applyAvailabilityPreset = (presetKey) => {
    if (presetKey === "evenings") {
      setAvailability({
        Mon: [17, 18, 19, 20], Tue: [17, 18, 19, 20], Wed: [17, 18, 19, 20],
        Thu: [17, 18, 19, 20], Fri: [17, 18, 19, 20],
        Sat: [10, 11, 12, 13, 14, 15], Sun: [10, 11, 12, 13, 14, 15],
      });
    } else if (presetKey === "mornings") {
      setAvailability({
        Mon: [8, 9, 10, 11], Tue: [8, 9, 10, 11], Wed: [8, 9, 10, 11],
        Thu: [8, 9, 10, 11], Fri: [8, 9, 10, 11],
        Sat: [9, 10, 11, 12, 13, 14], Sun: [9, 10, 11, 12, 13, 14],
      });
    } else if (presetKey === "fullday") {
      const all = [9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20];
      setAvailability({
        Mon: [...all], Tue: [...all], Wed: [...all], Thu: [...all], Fri: [...all],
        Sat: [...all], Sun: [...all],
      });
    } else if (presetKey === "clear") {
      setAvailability({
        Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
      });
    }
  };

  /* ---- Login Submit ---- */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const u = loginForm.username.trim().toLowerCase();
    
    if (!u) errs.username = 'Please enter your username';
    if (!loginForm.password) errs.password = 'Please enter your password';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const account = existingAccounts[u] || { username: u };
      await onLogin({ ...account, username: u, password: loginForm.password });
    } catch (err) {
      setErrors({ password: err.message || 'Login failed. Please check your credentials.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Forgot Password Submit ---- */
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const u = forgotForm.username.trim().toLowerCase();

    if (!u) errs.username = 'Please enter your registered username';
    if (!forgotForm.newPassword) errs.newPassword = 'New password is required';
    else if (forgotForm.newPassword.length < 3) errs.newPassword = 'Password must be at least 3 characters';

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      if (onResetPassword) {
        await onResetPassword({ username: u, newPassword: forgotForm.newPassword });
      } else {
        if (existingAccounts[u]) {
          await onLogin({ ...existingAccounts[u], password: forgotForm.newPassword });
        } else {
          throw new Error('No account found with this username');
        }
      }
    } catch (err) {
      setErrors({ general: err.message || 'Password reset failed. Please check your username.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Step 1 Validation & Proceed ---- */
  const handleStep1Submit = (e) => {
    if (e) e.preventDefault();
    const errs = {};
    const u = regForm.username.trim().toLowerCase();

    if (!isEditing) {
      if (!u) errs.username = 'Username is required';
      else if (u.length < 3) errs.username = 'Username must be at least 3 characters';
      else if (existingAccounts[u]) errs.username = 'This username is already taken';

      if (!regForm.password) errs.password = 'Password is required';
      else if (regForm.password.length < 4) errs.password = 'Password must be at least 4 characters';

      if (regForm.password !== regForm.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    if (!regForm.name.trim()) errs.name = 'Please enter your name';
    if (!regForm.age) errs.age = 'Please enter your age';
    if (!regForm.studying) errs.studying = 'Please select your study level';

    if (regForm.studying === 'higher_studies') {
      if (!regForm.courseName || !regForm.courseName.trim()) {
        errs.courseName = 'Please enter your Degree / Course (e.g. B.Tech, CSE, B.Com)';
      }
      if (!regForm.collegeYear) {
        errs.collegeYear = 'Please select your Year of study';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }

    setErrors({});
    setRegStep(2);
    return true;
  };

  /* ---- Final Submit after Step 3 (Registration) ---- */
  const handleFinalRegisterSubmit = async () => {
    setIsSubmitting(true);

    const levelObj = STUDY_LEVELS.find(l => l.id === regForm.studying);
    const yearObj = COLLEGE_YEARS.find(y => y.id === regForm.collegeYear);

    const course = regForm.courseName ? regForm.courseName.trim() : '';
    let summaryTag = levelObj ? levelObj.badge : 'Student';
    if (regForm.studying === 'higher_studies' && yearObj) {
      summaryTag = course ? `${course} · ${yearObj.short}` : yearObj.short;
    }

    const profileData = {
      name: regForm.name.trim(),
      age: regForm.age,
      studying: regForm.studying,
      collegeYear: regForm.collegeYear,
      courseName: course,
      avatar: regForm.avatar,
      dailyTargetHours: Number(regForm.dailyTargetHours || 4),
      levelTitle: levelObj?.title || 'Student',
      yearLabel: yearObj?.label || '',
      yearShort: yearObj?.short || '',
      summaryTag,
    };

    const customTopics = [];
    const customTasks = [];

    subjects.forEach((sub, sIdx) => {
      sub.chapters.forEach((ch, cIdx) => {
        customTopics.push({
          id: ch.id || `topic_${sIdx}_${cIdx}`,
          name: ch.name,
          subject: sub.name,
          difficulty: ch.difficulty || 'Medium',
          priority: ch.priority || sub.priority || 'Medium',
          subjectPriority: sub.priority || 'Medium',
          completed: false,
          sessionsDone: 0,
          totalSessions: ch.difficulty === 'Hard' ? 6 : ch.difficulty === 'Medium' ? 4 : 2
        });
      });
    });

    try {
      await onRegister({
        username: regForm.username.trim().toLowerCase(),
        password: regForm.password,
        profile: profileData,
        name: regForm.name.trim(),
        age: regForm.age,
        studying: regForm.studying,
        collegeYear: regForm.collegeYear,
        courseName: course,
        avatar: regForm.avatar,
        dailyTargetHours: Number(regForm.dailyTargetHours || 4),
        topics: customTopics,
        tasks: customTasks,
        availability: availability,
        joinedAt: new Date().toISOString()
      });
    } catch (err) {
      setErrors({ username: err.message || 'Registration failed' });
      setRegStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Final Submit for Profile / Subjects / Study Hours Edit ---- */
  const finalizeProfileUpdate = () => {
    const errs = {};
    if (!regForm.name.trim()) errs.name = 'Please enter your name';
    if (!regForm.age) errs.age = 'Please enter your age';
    if (!regForm.studying) errs.studying = 'Please select your study level';

    if (regForm.studying === 'higher_studies') {
      if (!regForm.courseName || !regForm.courseName.trim()) {
        errs.courseName = 'Please enter your Degree / Course (e.g. B.Tech, CSE, B.Com)';
      }
      if (!regForm.collegeYear) {
        errs.collegeYear = 'Please select your Year of study';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setRegStep(1);
      return;
    }

    const levelObj = STUDY_LEVELS.find(l => l.id === regForm.studying);
    const yearObj = COLLEGE_YEARS.find(y => y.id === regForm.collegeYear);
    const course = regForm.courseName ? regForm.courseName.trim() : '';
    let summaryTag = levelObj ? levelObj.badge : 'Student';
    if (regForm.studying === 'higher_studies' && yearObj) {
      summaryTag = course ? `${course} · ${yearObj.short}` : yearObj.short;
    }

    const profileData = {
      name: regForm.name.trim(),
      age: regForm.age,
      studying: regForm.studying,
      collegeYear: regForm.collegeYear,
      courseName: course,
      avatar: regForm.avatar,
      dailyTargetHours: Number(regForm.dailyTargetHours || 4),
      levelTitle: levelObj?.title || 'Student',
      yearLabel: yearObj?.label || '',
      yearShort: yearObj?.short || '',
      summaryTag,
    };

    // Reconstruct topics array preserving existing metadata if available
    const existingTopics = initialPlannerData?.topics || [];
    const updatedTopics = [];

    subjects.forEach((sub, sIdx) => {
      sub.chapters.forEach((ch, cIdx) => {
        const existing = existingTopics.find(
          t => t.id === ch.id || (t.name.toLowerCase() === ch.name.toLowerCase() && t.subject.toLowerCase() === sub.name.toLowerCase())
        );
        updatedTopics.push({
          id: ch.id || existing?.id || `topic_${sIdx}_${cIdx}`,
          name: ch.name,
          subject: sub.name,
          difficulty: ch.difficulty || existing?.difficulty || 'Medium',
          priority: ch.priority || existing?.priority || sub.priority || 'Medium',
          subjectPriority: sub.priority || existing?.subjectPriority || 'Medium',
          completed: existing ? existing.completed : (ch.completed || false),
          sessionsDone: existing ? existing.sessionsDone : (ch.sessionsDone || 0),
          totalSessions: ch.totalSessions || (ch.difficulty === 'Hard' ? 6 : ch.difficulty === 'Medium' ? 4 : 2)
        });
      });
    });

    onUpdateProfile({
      profile: profileData,
      topics: updatedTopics,
      availability: availability
    });
  };

  const selectQuickAccount = (acc) => {
    setLoginForm({ username: acc.username, password: '' });
    setMode('login');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#EBE6DF] text-[#181A1D] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased">
      
      {/* Main Board Container */}
      <div className="w-full max-w-2xl bg-white border border-[#ECE6DC] rounded-[38px] shadow-[0_25px_60px_rgba(0,0,0,0.06)] p-6 sm:p-9 relative z-10 my-6 transition-all">
        
        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181A1D] text-[#FDE047] border border-[#2D3139] text-xs font-medium uppercase tracking-wider mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
            {isEditing ? 'Profile & Study Settings' : 'Be.study Planner'}
          </div>

          <h1 className="text-2xl sm:text-3xl font-medium text-[#181A1D] tracking-tight mb-1.5">
            {isEditing 
              ? (regStep === 1 ? 'Academic Profile & Study Goal' : regStep === 2 ? 'Edit Subjects & Topics' : 'Edit Weekly Study Hours')
              : mode === 'forgot_password'
                ? 'Reset Your Password'
                : mode === 'login' 
                  ? 'Welcome Back' 
                  : regStep === 1 
                    ? 'Create Student Account' 
                    : regStep === 2 
                      ? 'Your Subjects & Topics' 
                      : 'Weekly Study Availability'}
          </h1>
          <p className="text-[#78716C] text-xs sm:text-sm max-w-md mx-auto font-normal">
            {isEditing
              ? (regStep === 1 
                  ? 'Update your name, degree, year of study, and daily study goal.' 
                  : regStep === 2 
                    ? 'Add, edit, or delete courses and chapters in your curriculum.' 
                    : 'Modify your weekly availability slots for automated study schedule placement.')
              : mode === 'forgot_password'
                ? 'Enter your registered username and set a new password to recover access.'
                : mode === 'login'
                  ? 'Sign in with your username and password to restore all your saved tasks, timetable, and study progress.'
                  : regStep === 1
                    ? 'Step 1 of 3: Enter your academic profile & credentials.'
                    : regStep === 2
                      ? 'Step 2 of 3: Add the courses and chapters you need to study this term.'
                      : 'Step 3 of 3: Select the hours you are free to study each week.'}
          </p>
        </div>

        {/* ---------------- EDIT PROFILE 3-TAB SWITCHER ---------------- */}
        {isEditing && (
          <div className="flex items-center p-1.5 bg-[#FAF8F5] border border-[#ECE6DC] rounded-full mb-6 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setRegStep(1)}
              className={`flex-1 py-2 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                regStep === 1
                  ? 'bg-[#181A1D] text-white shadow-2xs'
                  : 'text-[#78716C] hover:text-[#181A1D]'
              }`}
            >
              <User className={`w-3.5 h-3.5 ${regStep === 1 ? 'text-[#FACC15]' : ''}`} />
              <span className="truncate">1. Profile & Target</span>
            </button>
            <button
              type="button"
              onClick={() => setRegStep(2)}
              className={`flex-1 py-2 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                regStep === 2
                  ? 'bg-[#181A1D] text-white shadow-2xs'
                  : 'text-[#78716C] hover:text-[#181A1D]'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${regStep === 2 ? 'text-[#FB7185]' : ''}`} />
              <span className="truncate">2. Subjects & Topics</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${regStep === 2 ? 'bg-[#FACC15] text-[#181A1D]' : 'bg-[#ECE6DC] text-[#6B655E]'}`}>
                {totalChaptersCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRegStep(3)}
              className={`flex-1 py-2 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                regStep === 3
                  ? 'bg-[#181A1D] text-white shadow-2xs'
                  : 'text-[#78716C] hover:text-[#181A1D]'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${regStep === 3 ? 'text-[#FACC15]' : ''}`} />
              <span className="truncate">3. Study Hours</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${regStep === 3 ? 'bg-[#FACC15] text-[#181A1D]' : 'bg-[#ECE6DC] text-[#6B655E]'}`}>
                {totalWeeklyStudyHours}h
              </span>
            </button>
          </div>
        )}

        {/* Mode Switcher Tabs (Only on step 1 and not in forgot password) */}
        {!isEditing && regStep === 1 && mode !== 'forgot_password' && (
          <div className="flex items-center p-1 bg-[#FAF8F5] border border-[#E8E2D8] rounded-full mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#181A1D] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#181A1D]'
              }`}
            >
              <LogIn className={`w-4 h-4 ${mode === 'login' ? 'text-[#FACC15]' : 'text-[#78716C]'}`} /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#181A1D] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#181A1D]'
              }`}
            >
              <UserPlus className={`w-4 h-4 ${mode === 'register' ? 'text-[#FB7185]' : 'text-[#78716C]'}`} /> Create Account
            </button>
          </div>
        )}

        {/* Step Indicator on Multi-step Registration */}
        {!isEditing && mode === 'register' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className={`w-8 h-1.5 rounded-full transition-all ${regStep >= 1 ? 'bg-[#FACC15]' : 'bg-[#ECE6DC]'}`} />
            <span className={`w-8 h-1.5 rounded-full transition-all ${regStep >= 2 ? 'bg-[#FB7185]' : 'bg-[#ECE6DC]'}`} />
            <span className={`w-8 h-1.5 rounded-full transition-all ${regStep >= 3 ? 'bg-[#181A1D]' : 'bg-[#ECE6DC]'}`} />
          </div>
        )}

        {/* Saved Profiles Quick Select */}
        {!isEditing && accountList.length > 0 && mode === 'login' && (
          <div className="mb-6 pb-5 border-b border-[#F4F1EB]">
            <label className="block text-[11px] font-medium text-[#78716C] uppercase tracking-wider mb-2">
              Saved Profiles on this device
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {accountList.map((acc, idx) => {
                const isSelected = loginForm.username.toLowerCase() === acc.username.toLowerCase();
                const avatarBg = idx % 2 === 0 ? 'bg-[#FEF3C7]' : 'bg-[#FFE4E6]';
                return (
                  <div
                    key={acc.username}
                    className={`px-3.5 py-2 rounded-2xl border text-left flex items-center gap-2.5 transition-all shrink-0 group ${
                      isSelected
                        ? 'bg-[#FFFDF0] border-2 border-[#FACC15] text-[#181A1D] shadow-xs'
                        : 'bg-[#FAF8F5] border border-[#ECE6DC] text-[#181A1D] hover:border-[#FACC15]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectQuickAccount(acc)}
                      className="flex items-center gap-2 cursor-pointer text-left"
                    >
                      <span className={`text-lg ${avatarBg} p-1.5 rounded-full`}>{acc.profile?.avatar || '🎓'}</span>
                      <div>
                        <p className="text-xs font-medium leading-tight text-[#181A1D]">
                          {acc.profile?.name || acc.username}
                        </p>
                        <p className="text-[10px] text-[#8E8880] font-normal">
                          @{acc.username}
                        </p>
                      </div>
                    </button>
                    {onDeleteSavedAccount && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSavedAccount(acc.username);
                        }}
                        className="p-1 rounded-full text-[#8E8880] hover:text-[#FB7185] cursor-pointer"
                        title={`Delete ${acc.profile?.name || acc.username}'s profile`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- LOGIN FORM ---------------- */}
        {mode === 'login' && !isEditing && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#252320] mb-1.5">
                Username <span className="text-[#FB7185]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8880]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, username: e.target.value });
                    if (errors.username) setErrors({ ...errors, username: null });
                  }}
                  placeholder="e.g. amanda"
                  className={`w-full bg-[#FAF8F5] border ${
                    errors.username ? 'border-[#FB7185]' : 'border-[#ECE6DC] focus:border-[#FB7185]'
                  } rounded-full pl-10 pr-4 py-3 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none transition-all`}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.username}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#252320]">
                  Password <span className="text-[#FB7185]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotForm({ username: loginForm.username || '', newPassword: '', confirmPassword: '' });
                    setMode('forgot_password');
                    setErrors({});
                  }}
                  className="text-xs text-[#E11D48] hover:text-[#9F1239] font-medium hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8880]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  placeholder="Enter your password"
                  className={`w-full bg-[#FAF8F5] border ${
                    errors.password ? 'border-[#FB7185]' : 'border-[#ECE6DC] focus:border-[#FB7185]'
                  } rounded-full pl-10 pr-11 py-3 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8E8880] hover:text-[#181A1D] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#FB7185]" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#181A1D] hover:bg-[#282B32] text-white font-medium py-3.5 px-6 rounded-full shadow-xs hover:shadow-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <LogIn className="w-4 h-4 text-[#FACC15]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ---------------- FORGOT PASSWORD FORM ---------------- */}
        {mode === 'forgot_password' && !isEditing && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="p-4 rounded-3xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2 mb-2">
              <div className="flex items-center gap-2 text-[#92400E] text-xs font-bold">
                <KeyRound className="w-4 h-4 text-[#F59E0B]" />
                Password Recovery
              </div>
              <p className="text-[11px] text-[#78350F] leading-relaxed">
                Enter your registered student username below and set your new password. You will be logged in immediately upon resetting.
              </p>
            </div>

            {errors.general && (
              <div className="p-3 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#E11D48] font-medium">
                {errors.general}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#252320] mb-1.5">
                Registered Username <span className="text-[#FB7185]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8880]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={forgotForm.username}
                  onChange={(e) => {
                    setForgotForm({ ...forgotForm, username: e.target.value });
                    if (errors.username) setErrors({ ...errors, username: null });
                  }}
                  placeholder="Enter your username"
                  className={`w-full bg-[#FAF8F5] border ${
                    errors.username ? 'border-[#FB7185]' : 'border-[#ECE6DC] focus:border-[#FB7185]'
                  } rounded-full pl-10 pr-4 py-3 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none transition-all`}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#252320] mb-1.5">
                New Password <span className="text-[#FB7185]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8880]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={forgotForm.newPassword}
                  onChange={(e) => {
                    setForgotForm({ ...forgotForm, newPassword: e.target.value });
                    if (errors.newPassword) setErrors({ ...errors, newPassword: null });
                  }}
                  placeholder="Create a new password"
                  className={`w-full bg-[#FAF8F5] border ${
                    errors.newPassword ? 'border-[#FB7185]' : 'border-[#ECE6DC] focus:border-[#FB7185]'
                  } rounded-full pl-10 pr-11 py-3 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8E8880] hover:text-[#181A1D] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#FB7185]" />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#252320] mb-1.5">
                Confirm New Password <span className="text-[#FB7185]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8880]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={forgotForm.confirmPassword}
                  onChange={(e) => {
                    setForgotForm({ ...forgotForm, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                  }}
                  placeholder="Re-enter your new password"
                  className={`w-full bg-[#FAF8F5] border ${
                    errors.confirmPassword ? 'border-[#FB7185]' : 'border-[#ECE6DC] focus:border-[#FB7185]'
                  } rounded-full pl-10 pr-4 py-3 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none transition-all`}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#181A1D] hover:bg-[#282B32] text-white font-medium py-3.5 px-6 rounded-full shadow-xs hover:shadow-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Reset Password & Sign In</span>
                  <Check className="w-4 h-4 text-[#FACC15]" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#78716C] pt-2 font-normal">
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrors({}); }}
                className="text-[#FB7185] hover:text-[#E11D48] font-medium underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </p>
          </form>
        )}

        {/* ---------------- STEP 1: ACADEMIC PROFILE & TARGET STUDY HOURS ---------------- */}
        {((mode === 'register' && regStep === 1) || (isEditing && regStep === 1)) && (
          <form onSubmit={handleStep1Submit} className="space-y-5 animate-in fade-in duration-200">
            
            {/* Account Credentials (Only on Registration) */}
            {!isEditing && (
              <div className="p-4 rounded-3xl bg-[#FFF5F6] border border-[#FECDD3] space-y-3.5">
                <div className="flex items-center gap-2 text-[#9F1239] text-xs font-medium uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 text-[#FB7185]" />
                  Account Security
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252320] mb-1">
                    Choose Username <span className="text-[#FB7185]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8E8880] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regForm.username}
                      onChange={(e) => {
                        setRegForm({ ...regForm, username: e.target.value.replace(/\s+/g, '') });
                        if (errors.username) setErrors({ ...errors, username: null });
                      }}
                      placeholder="e.g. amanda"
                      className={`w-full bg-white border ${
                        errors.username ? 'border-[#FB7185]' : 'border-[#FECDD3]'
                      } rounded-full pl-10 pr-4 py-2.5 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none focus:border-[#FB7185]`}
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.username}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#252320] mb-1">
                      Set Password <span className="text-[#FB7185]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8E8880] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regForm.password}
                        onChange={(e) => {
                          setRegForm({ ...regForm, password: e.target.value });
                          if (errors.password) setErrors({ ...errors, password: null });
                        }}
                        placeholder="Min 4 characters"
                        className={`w-full bg-white border ${
                          errors.password ? 'border-[#FB7185]' : 'border-[#FECDD3]'
                        } rounded-full pl-10 pr-9 py-2.5 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none focus:border-[#FB7185]`}
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#252320] mb-1">
                      Confirm Password <span className="text-[#FB7185]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8E8880] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regForm.confirmPassword}
                        onChange={(e) => {
                          setRegForm({ ...regForm, confirmPassword: e.target.value });
                          if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                        }}
                        placeholder="Re-enter password"
                        className={`w-full bg-white border ${
                          errors.confirmPassword ? 'border-[#FB7185]' : 'border-[#FECDD3]'
                        } rounded-full pl-10 pr-9 py-2.5 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none focus:border-[#FB7185]`}
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-medium text-[#252320] uppercase tracking-wider mb-2">
                Choose Your Avatar
              </label>
              <div className="flex items-center gap-2.5 overflow-x-auto py-2 px-1 no-scrollbar">
                {AVATARS.map((emoji) => {
                  const isSelected = regForm.avatar === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setRegForm({ ...regForm, avatar: emoji })}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#181A1D] text-white ring-2 ring-[#FACC15] shadow-xs scale-105'
                          : 'bg-[#FAF8F5] border border-[#ECE6DC] hover:scale-105'
                      }`}
                    >
                      <span className="select-none leading-none">{emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-8">
                <label className="block text-xs font-medium text-[#252320] mb-1">
                  Full Name <span className="text-[#FB7185]">*</span>
                </label>
                <input
                  type="text"
                  value={regForm.name}
                  onChange={(e) => {
                    setRegForm({ ...regForm, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="e.g. Amanda Smith"
                  className={`w-full bg-[#FAF8F5] border ${
                    errors.name ? 'border-[#FB7185]' : 'border-[#ECE6DC]'
                  } rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#181A1D] placeholder-[#A8A29A] focus:outline-none focus:border-[#FB7185]`}
                />
                {errors.name && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.name}</p>}
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-[#252320] mb-1">
                  Age <span className="text-[#FB7185]">*</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={regForm.age}
                  onChange={(e) => {
                    setRegForm({ ...regForm, age: e.target.value });
                    if (errors.age) setErrors({ ...errors, age: null });
                  }}
                  placeholder="e.g. 20"
                  className={`w-full bg-[#FAF8F5] border ${
                    errors.age ? 'border-[#FB7185]' : 'border-[#ECE6DC]'
                  } rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#181A1D] placeholder-[#A8A29A] focus:outline-none focus:border-[#FB7185]`}
                />
                {errors.age && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.age}</p>}
              </div>
            </div>

            {/* Currently Studying */}
            <div>
              <label className="block text-xs font-medium text-[#252320] mb-2">
                What are you studying? <span className="text-[#FB7185]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STUDY_LEVELS.map((level) => {
                  const Icon = level.icon;
                  const isSelected = regForm.studying === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => {
                        setRegForm({ ...regForm, studying: level.id });
                        if (errors.studying) setErrors({ ...errors, studying: null });
                      }}
                      className={`text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFFDF0] text-[#181A1D] border-2 border-[#FACC15] shadow-2xs'
                          : 'bg-[#FAF8F5] border border-[#ECE6DC] hover:border-[#FDE68A]'
                      }`}
                    >
                      <div className={`p-1.5 rounded-full shrink-0 ${isSelected ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#EAE4DA] text-[#181A1D]'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-tight text-[#181A1D]">
                          {level.title}
                        </p>
                        <p className="text-[10px] mt-0.5 line-clamp-1 text-[#8A847C] font-normal">
                          {level.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Higher Studies Course & Year */}
            {regForm.studying === 'higher_studies' && (
              <div className="bg-[#FFF5F6] border border-[#FECDD3] rounded-3xl p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#FB7185]" />
                  <h3 className="text-xs font-medium text-[#9F1239] uppercase tracking-wider">Higher Studies Details</h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252320] mb-1">
                    Course / Degree / Major <span className="text-[#FB7185]">*</span>
                  </label>
                  <input
                    type="text"
                    value={regForm.courseName}
                    onChange={(e) => {
                      setRegForm({ ...regForm, courseName: e.target.value });
                      if (errors.courseName) setErrors({ ...errors, courseName: null });
                    }}
                    placeholder="e.g. Computer Science, B.Tech CSE, MBA"
                    className="w-full bg-white border border-[#FECDD3] rounded-full px-4 py-2 text-xs text-[#181A1D] focus:outline-none focus:border-[#FB7185]"
                  />
                  {errors.courseName && <p className="mt-1 text-xs text-[#E11D48] font-normal">{errors.courseName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#252320] mb-1.5">
                    Year of Study <span className="text-[#FB7185]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {COLLEGE_YEARS.map((yr) => {
                      const isYearSelected = regForm.collegeYear === yr.id;
                      return (
                        <button
                          key={yr.id}
                          type="button"
                          onClick={() => {
                            setRegForm({ ...regForm, collegeYear: yr.id });
                            if (errors.collegeYear) setErrors({ ...errors, collegeYear: null });
                          }}
                          className={`px-2 py-2 rounded-xl text-xs font-medium text-center border transition-all cursor-pointer ${
                            isYearSelected
                              ? 'bg-[#181A1D] text-[#FDE047] border-[#181A1D] shadow-2xs'
                              : 'bg-white border-[#FECDD3] text-[#9F1239] hover:bg-[#FFE4E6]'
                          }`}
                        >
                          {yr.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Daily Target Study Hours (Enhanced with flexible presets & stepper) */}
            <div className="bg-[#FFFDF0] border border-[#FDE894] rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-[#F59E0B]" />
                  <div>
                    <p className="text-xs font-bold text-[#92400E]">Daily Study Target Goal</p>
                    <p className="text-[10.5px] text-[#A16207] font-normal">
                      Planned hours: <strong className="text-[#92400E] font-extrabold">{regForm.dailyTargetHours || 4}h/day</strong> (~{(regForm.dailyTargetHours || 4) * 7}h per week)
                    </p>
                  </div>
                </div>

                {/* Stepper buttons */}
                <div className="flex items-center gap-1.5 bg-white border border-[#FDE68A] rounded-full p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setRegForm({ ...regForm, dailyTargetHours: Math.max(1, (Number(regForm.dailyTargetHours) || 4) - 1) })}
                    className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#FDE68A] text-[#92400E] font-black text-sm flex items-center justify-center cursor-pointer transition-all"
                    title="Decrease 1 hour"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#181A1D]">
                    {regForm.dailyTargetHours || 4}h
                  </span>
                  <button
                    type="button"
                    onClick={() => setRegForm({ ...regForm, dailyTargetHours: Math.min(16, (Number(regForm.dailyTargetHours) || 4) + 1) })}
                    className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-[#FDE68A] text-[#92400E] font-black text-sm flex items-center justify-center cursor-pointer transition-all"
                    title="Increase 1 hour"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {[2, 3, 4, 5, 6, 8, 10, 12].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setRegForm({ ...regForm, dailyTargetHours: hrs })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      Number(regForm.dailyTargetHours) === hrs 
                        ? 'bg-[#181A1D] text-[#FDE047] shadow-2xs font-bold' 
                        : 'bg-white border border-[#FDE68A] text-[#92400E] hover:bg-[#FEF3C7]'
                    }`}
                  >
                    {hrs}h / day
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="flex items-center gap-3 pt-2">
              {isEditing && onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-5 py-3 rounded-full border border-[#ECE6DC] bg-[#FAF8F5] text-[#181A1D] font-medium text-xs hover:bg-[#EAE4DA] cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (handleStep1Submit()) setRegStep(2);
                    }}
                    className="px-4 py-3 rounded-full bg-[#FAF8F5] hover:bg-[#ECE6DC] border border-[#ECE6DC] text-[#181A1D] font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Next: Subjects & Topics</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FB7185]" />
                  </button>
                  <button
                    type="button"
                    onClick={finalizeProfileUpdate}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#181A1D] hover:bg-[#282B32] text-[#FACC15] font-bold py-3 px-5 rounded-full shadow-xs hover:shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    <span>Save All Changes</span>
                    <Check className="w-4 h-4 text-[#FACC15]" />
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#181A1D] hover:bg-[#282B32] text-white font-medium py-3.5 px-6 rounded-full shadow-xs hover:shadow-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  <span>Next: Add Subjects & Topics</span>
                  <ArrowRight className="w-4 h-4 text-[#FB7185]" />
                </button>
              )}
            </div>

            {/* Account Deletion (Only in Edit mode) */}
            {isEditing && onDeleteAccount && (
              <div className="mt-6 pt-5 border-t border-[#F4F1EB]">
                <div className="p-4 rounded-3xl border border-[#FECDD3] bg-[#FFF1F2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#E11D48]">Permanently Delete Account</p>
                    <p className="text-[11px] text-[#9F1239] mt-0.5 font-normal">Erase your profile, tasks, availability, and AI timetables.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onDeleteAccount}
                    className="px-4 py-2 rounded-full bg-[#E11D48] text-white text-xs font-medium hover:bg-[#BE123C] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Profile</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* ---------------- STEP 2: SUBJECTS & CHAPTERS / TOPICS ---------------- */}
        {((mode === 'register' && regStep === 2) || (isEditing && regStep === 2)) && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Header info for Step 2 */}
            <div className="p-3.5 rounded-2xl bg-[#FFF5F6] border border-[#FECDD3] flex items-center justify-between text-xs text-[#9F1239]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FB7185] shrink-0" />
                <span>Manage your course subjects and the chapters/topics you need to cover.</span>
              </div>
              <span className="font-bold bg-white px-2 py-0.5 rounded-full border border-[#FECDD3] text-[#9F1239] text-[10px] shrink-0">
                {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'} · {totalChaptersCount} Topics
              </span>
            </div>

            {/* Subject Tabs & Adder */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-[#252320]">
                1. Your Course Subjects & Priorities
              </label>

              {/* Subject Adder Input with Priority Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); } }}
                  placeholder="Type course subject (e.g. Mathematics, Physics, Chemistry, Economics)..."
                  className="w-full sm:flex-1 bg-[#FAF8F5] border border-[#ECE6DC] rounded-full px-4 py-2.5 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none focus:border-[#FB7185]"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={newSubjectPriority}
                    onChange={(e) => setNewSubjectPriority(e.target.value)}
                    className="bg-[#FAF8F5] border border-[#ECE6DC] rounded-full px-3 py-2.5 text-xs font-semibold text-[#181A1D] focus:outline-none cursor-pointer"
                    title="Subject Priority"
                  >
                    <option value="High">🔥 High Priority</option>
                    <option value="Medium">⚡ Med Priority</option>
                    <option value="Low">🌱 Low Priority</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-4 py-2.5 rounded-full bg-[#FB7185] hover:bg-[#F43F5E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Add Subject</span>
                  </button>
                </div>
              </div>

              {/* Subject Selection Pills with Clickable Priority Badges */}
              {subjects.length === 0 ? (
                <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#ECE6DC] text-center text-xs text-[#8E8880] space-y-1">
                  <p className="font-bold text-[#181A1D]">No subjects added yet</p>
                  <p className="text-[11px] text-[#A8A29A]">Type your subject name above (e.g. Physics, Chemistry, Economics), pick its priority, and click "Add Subject".</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                  {subjects.map((s) => {
                    const isActive = activeSubjectId === s.id;
                    const priorityBadge = s.priority === 'High' 
                      ? 'bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3]'
                      : s.priority === 'Low'
                      ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                      : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]';

                    return (
                      <div
                        key={s.id}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all shrink-0 cursor-pointer border ${
                          isActive
                            ? 'bg-[#181A1D] text-white border-[#181A1D] shadow-xs'
                            : 'bg-[#FAF8F5] text-[#78716C] border border-[#ECE6DC] hover:border-[#FB7185]'
                        }`}
                        onClick={() => setActiveSubjectId(s.id)}
                      >
                        <span className="font-bold">{s.name}</span>
                        
                        {/* Clickable Subject Priority Pill */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleSubjectPriority(s.id); }}
                          className={`text-[9.5px] px-2 py-0.5 rounded-full font-extrabold cursor-pointer transition-transform active:scale-90 ${priorityBadge}`}
                          title="Click to cycle subject priority (High ➔ Medium ➔ Low)"
                        >
                          {s.priority === 'High' ? '🔥 High' : s.priority === 'Low' ? '🌱 Low' : '⚡ Med'}
                        </button>

                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-[#FACC15] text-[#181A1D]' : 'bg-[#E7E1D6] text-[#78716C]'}`}>
                          {s.chapters.length}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveSubject(s.id); }}
                          className="hover:text-[#FB7185] transition-colors"
                          title={`Delete ${s.name} subject`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chapters & Topics for Active Subject */}
            {activeSubjectId && (
              <div className="p-4 rounded-3xl bg-[#FFFDF5] border border-[#FDE894] space-y-3.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#D97706]" />
                    <span className="text-xs font-bold text-[#92400E]">
                      Chapters & Topics for <strong className="text-[#181A1D] font-extrabold">{subjects.find(s => s.id === activeSubjectId)?.name}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSortChaptersByPriority(activeSubjectId)}
                      className="text-[10.5px] font-bold text-[#92400E] hover:text-black bg-white hover:bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A] shadow-2xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      title="Sort chapters by priority (High to Low)"
                    >
                      <Zap className="w-3 h-3 text-[#D97706]" />
                      <span>Sort by Priority</span>
                    </button>
                    <span className="text-[10px] font-bold text-[#A16207] bg-white px-2 py-0.5 rounded-full border border-[#FDE68A]">
                      {subjects.find(s => s.id === activeSubjectId)?.chapters.length || 0} chapters
                    </span>
                  </div>
                </div>

                {/* Chapter Add Row with Priority and Difficulty Selectors */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={newChapterInput}
                    onChange={(e) => setNewChapterInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChapter(); } }}
                    placeholder="Chapter / Topic name (e.g. Calculus I, Thermodynamics)..."
                    className="w-full sm:flex-1 bg-white border border-[#FDE68A] rounded-full px-3.5 py-2 text-xs text-[#181A1D] placeholder-[#A8A29A] focus:outline-none focus:border-[#FACC15]"
                  />

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Chapter Priority Selector */}
                    <select
                      value={newChapterPriority}
                      onChange={(e) => setNewChapterPriority(e.target.value)}
                      className="bg-white border border-[#FDE68A] rounded-full px-3 py-2 text-xs font-semibold text-[#181A1D] focus:outline-none cursor-pointer"
                      title="Topic Priority for Exam & Study Schedule"
                    >
                      <option value="High">🔥 High Priority</option>
                      <option value="Medium">⚡ Med Priority</option>
                      <option value="Low">🌱 Low Priority</option>
                    </select>

                    {/* Chapter Difficulty Selector */}
                    <select
                      value={newChapterDifficulty}
                      onChange={(e) => setNewChapterDifficulty(e.target.value)}
                      className="bg-white border border-[#FDE68A] rounded-full px-3 py-2 text-xs font-medium text-[#181A1D] focus:outline-none cursor-pointer"
                    >
                      <option value="Easy">🟢 Easy</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Hard">🔴 Hard</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="px-3.5 py-2 rounded-full bg-[#181A1D] hover:bg-[#282B32] text-[#FACC15] text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FACC15]" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Chapters List with Interactive Priority Badges */}
                <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                  {(subjects.find(s => s.id === activeSubjectId)?.chapters || []).length === 0 ? (
                    <p className="text-xs text-[#8E8880] text-center py-3 font-normal">No chapters added yet for this subject. Type above to add one!</p>
                  ) : (
                    (subjects.find(s => s.id === activeSubjectId)?.chapters || []).map((ch) => {
                      const priorityStyle = ch.priority === 'High'
                        ? 'bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3]'
                        : ch.priority === 'Low'
                        ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                        : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]';

                      return (
                        <div key={ch.id} className="p-2.5 rounded-2xl bg-white border border-[#FDE68A] flex items-center justify-between text-xs hover:border-[#FACC15] transition-all">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${ch.difficulty === 'Hard' ? 'bg-[#FB7185]' : ch.difficulty === 'Medium' ? 'bg-[#FACC15]' : 'bg-[#10B981]'}`} />
                            <span className="font-bold text-[#181A1D] truncate">{ch.name}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Clickable Chapter Priority Badge */}
                            <button
                              type="button"
                              onClick={() => handleToggleChapterPriority(activeSubjectId, ch.id)}
                              className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md cursor-pointer transition-transform active:scale-90 ${priorityStyle}`}
                              title="Click to cycle chapter priority (High ➔ Medium ➔ Low)"
                            >
                              {ch.priority === 'High' ? '🔥 High' : ch.priority === 'Low' ? '🌱 Low' : '⚡ Med'}
                            </button>

                            {/* Difficulty Tag */}
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                              ch.difficulty === 'Hard' ? 'bg-[#FFE4E6] text-[#9F1239]' :
                              ch.difficulty === 'Medium' ? 'bg-[#FEF3C7] text-[#92400E]' :
                              'bg-[#DCFCE7] text-[#166534]'
                            }`}>
                              {ch.difficulty}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveChapter(activeSubjectId, ch.id)}
                              className="text-[#8E8880] hover:text-[#FB7185] transition-colors cursor-pointer"
                              title="Delete topic"
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
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRegStep(1)}
                className="px-5 py-3 rounded-full border border-[#ECE6DC] bg-[#FAF8F5] text-[#181A1D] font-medium text-xs hover:bg-[#EAE4DA] cursor-pointer"
              >
                Back to Profile
              </button>

              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setRegStep(3)}
                    className="px-4 py-3 rounded-full bg-[#FAF8F5] hover:bg-[#ECE6DC] border border-[#ECE6DC] text-[#181A1D] font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Next: Study Hours</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FACC15]" />
                  </button>
                  <button
                    type="button"
                    onClick={finalizeProfileUpdate}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#181A1D] hover:bg-[#282B32] text-[#FACC15] font-bold py-3 px-5 rounded-full shadow-xs hover:shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    <span>Save All Changes</span>
                    <Check className="w-4 h-4 text-[#FACC15]" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setRegStep(3)}
                  className="flex-1 bg-[#181A1D] hover:bg-[#282B32] text-white font-medium py-3.5 px-6 rounded-full shadow-xs hover:shadow-sm flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                >
                  <span>Next: Set Study Hours</span>
                  <ArrowRight className="w-4 h-4 text-[#FACC15]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ---------------- STEP 3: WEEKLY STUDY HOURS & AVAILABILITY ---------------- */}
        {((mode === 'register' && regStep === 3) || (isEditing && regStep === 3)) && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Presets Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#252320]">
                  Weekly Study Hours Grid
                </label>
                <span className="text-[11px] font-normal text-[#8E8880]">
                  Click cells to toggle free study slots
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => applyAvailabilityPreset("evenings")}
                  className="px-3.5 py-1.5 rounded-full bg-[#FFFDF0] hover:bg-[#FEF3C7] border border-[#FDE68A] text-xs font-medium text-[#92400E] transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  🌙 Evenings & Weekends
                </button>
                <button
                  type="button"
                  onClick={() => applyAvailabilityPreset("mornings")}
                  className="px-3.5 py-1.5 rounded-full bg-[#FFF5F6] hover:bg-[#FFE4E6] border border-[#FECDD3] text-xs font-medium text-[#9F1239] transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  ☀️ Morning Focus (8am–12pm)
                </button>
                <button
                  type="button"
                  onClick={() => applyAvailabilityPreset("fullday")}
                  className="px-3.5 py-1.5 rounded-full bg-[#181A1D] hover:bg-[#282B32] border border-[#2D3139] text-xs font-medium text-[#FDE047] transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  ⚡ Full Day Open
                </button>
                <button
                  type="button"
                  onClick={() => applyAvailabilityPreset("clear")}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-rose-50 border border-rose-200 text-xs font-medium text-rose-600 transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  🔄 Clear All
                </button>
              </div>
            </div>

            {/* Goal vs Availability calculation card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#FFFDF0] border border-[#FDE894] flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#92400E]">Daily Goal: {regForm.dailyTargetHours || 4}h</span>
                  <span className="text-[#A16207] block text-[10.5px]">Weekly target: ~{(regForm.dailyTargetHours || 4) * 7}h</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#16A34A] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#166534]">Configured: {totalWeeklyStudyHours}h / week</span>
                  <span className="text-[#15803D] block text-[10.5px]">
                    {totalWeeklyStudyHours >= (regForm.dailyTargetHours || 4) * 5 
                      ? '✅ Target Achievable' 
                      : `💡 Add ${(regForm.dailyTargetHours || 4) * 6 - totalWeeklyStudyHours}h for full coverage`}
                  </span>
                </div>
              </div>
            </div>

            {/* Availability Mini Grid */}
            <div className="p-3.5 rounded-3xl bg-[#FAF8F5] border border-[#ECE6DC] space-y-2 overflow-x-auto">
              <div className="min-w-[480px] space-y-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const daySlots = availability[d] || [];
                  return (
                    <div key={d} className="flex items-center gap-2">
                      <div className="w-14 text-xs font-bold text-[#252320] shrink-0 flex items-center justify-between pr-1">
                        <span>{d}</span>
                        <span className="text-[10px] text-[#78716C] font-normal">{daySlots.length}h</span>
                      </div>
                      <div className="flex items-center gap-1 flex-1 flex-wrap">
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((h) => {
                          const isFree = daySlots.includes(h);
                          return (
                            <button
                              key={h}
                              type="button"
                              onClick={() => toggleSlot(d, h)}
                              className={`px-2 py-1 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer ${
                                isFree 
                                  ? 'bg-[#181A1D] text-[#FDE047] border border-[#181A1D] shadow-2xs hover:bg-[#282B32]' 
                                  : 'bg-white border border-[#ECE6DC] text-[#8E8880] hover:border-[#FB7185]'
                              }`}
                            >
                              {h}:00
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-2xl bg-[#FFF5F6] border border-[#FECDD3] flex items-center gap-2.5 text-xs text-[#9F1239] font-normal">
              <Sparkles className="w-4 h-4 text-[#FB7185] shrink-0" />
              <span>The AI will schedule study sessions for your <strong className="font-bold text-[#181A1D]">{totalChaptersCount} chapters</strong> across your <strong className="font-bold text-[#181A1D]">{totalWeeklyStudyHours} configured study hours</strong> without collisions.</span>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRegStep(2)}
                className="px-5 py-3 rounded-full border border-[#ECE6DC] bg-[#FAF8F5] text-[#181A1D] font-medium text-xs hover:bg-[#EAE4DA] cursor-pointer"
              >
                Back to Subjects
              </button>
              
              {isEditing ? (
                <button
                  type="button"
                  onClick={finalizeProfileUpdate}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#181A1D] hover:bg-[#282B32] text-[#FACC15] font-bold py-3.5 px-6 rounded-full shadow-xs hover:shadow-sm flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Save All Changes & Update Timetable</span>
                      <Sparkles className="w-4 h-4 text-[#FACC15]" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalRegisterSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#181A1D] hover:bg-[#282B32] text-white font-medium py-3.5 px-6 rounded-full shadow-xs hover:shadow-sm flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Generate My Schedule & Finish</span>
                      <Sparkles className="w-4 h-4 text-[#FACC15]" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
