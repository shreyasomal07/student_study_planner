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
  existingAccounts = {}, 
  initialData = null, 
  isEditing = false,
  onUpdateProfile,
  onDeleteAccount,
  onDeleteSavedAccount,
  onCancelEdit
}) {
  const accountList = Object.values(existingAccounts || {});
  const [mode, setMode] = useState(isEditing ? 'edit' : (accountList.length > 0 ? 'login' : 'register'));
  const [regStep, setRegStep] = useState(1); // 1: Profile, 2: Subjects & Chapters, 3: Availability
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
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

  // Step 2 State: Subjects and Topics / Chapters
  const [subjects, setSubjects] = useState([
    { id: 's1', name: 'Calculus', chapters: [
      { id: 'c1', name: 'Integration by Parts & Substitution', difficulty: 'Medium' },
      { id: 'c2', name: 'Differential Equations', difficulty: 'Hard' }
    ]},
    { id: 's2', name: 'Data Structures', chapters: [
      { id: 'c3', name: 'Binary Search Trees & AVL Rotations', difficulty: 'Hard' },
      { id: 'c4', name: 'Graph Algorithms & Traversal', difficulty: 'Medium' }
    ]}
  ]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [activeSubjectId, setActiveSubjectId] = useState('s1');
  const [newChapterInput, setNewChapterInput] = useState('');
  const [newChapterDifficulty, setNewChapterDifficulty] = useState('Medium');

  // Step 3 State: Availability Time Slots
  const [availability, setAvailability] = useState({
    Mon: [17, 18, 19, 20], Tue: [17, 18, 19, 20], Wed: [17, 18, 19, 20],
    Thu: [17, 18, 19, 20], Fri: [17, 18, 19, 20],
    Sat: [10, 11, 12, 13, 14, 15], Sun: [10, 11, 12, 13, 14, 15],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---- Handlers for Step 2 Subjects & Chapters ---- */
  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    const newId = 's_' + Date.now();
    const newSub = { id: newId, name: trimmed, chapters: [] };
    setSubjects([...subjects, newSub]);
    setActiveSubjectId(newId);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (id) => {
    const updated = subjects.filter(s => s.id !== id);
    setSubjects(updated);
    if (activeSubjectId === id && updated.length > 0) {
      setActiveSubjectId(updated[0].id);
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
            difficulty: newChapterDifficulty
          }]
        };
      }
      return s;
    }));
    setNewChapterInput('');
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
    }
  };

  /* ---- Login Submit ---- */
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    const u = loginForm.username.trim().toLowerCase();
    
    if (!u) errs.username = 'Please enter your username';
    if (!loginForm.password) errs.password = 'Please enter your password';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const account = existingAccounts[u];
    if (!account) {
      setErrors({ username: 'No account found with this username' });
      return;
    }

    if (account.password !== loginForm.password) {
      setErrors({ password: 'Incorrect password. Please try again' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(account);
      setIsSubmitting(false);
    }, 300);
  };

  /* ---- Step 1 Validation & Proceed ---- */
  const handleStep1Submit = (e) => {
    e.preventDefault();
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
      return;
    }

    setErrors({});
    if (isEditing) {
      // Direct save when editing profile
      finalizeProfileUpdate();
    } else {
      setRegStep(2);
    }
  };

  /* ---- Final Submit after Step 3 ---- */
  const handleFinalRegisterSubmit = () => {
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
      dailyTargetHours: regForm.dailyTargetHours,
      levelTitle: levelObj?.title || 'Student',
      yearLabel: yearObj?.label || '',
      yearShort: yearObj?.short || '',
      summaryTag,
    };

    // Build topics array from custom chapters
    const customTopics = [];
    const customTasks = [];
    const today = new Date();

    subjects.forEach((sub, sIdx) => {
      sub.chapters.forEach((ch, cIdx) => {
        customTopics.push({
          id: ch.id || `topic_${sIdx}_${cIdx}`,
          name: ch.name,
          subject: sub.name,
          difficulty: ch.difficulty,
          completed: false,
          sessionsDone: 0,
          totalSessions: ch.difficulty === 'Hard' ? 6 : ch.difficulty === 'Medium' ? 4 : 2
        });

        // Add an initial assignment task for each subject
        if (cIdx === 0) {
          const dueD = new Date(today);
          dueD.setDate(dueD.getDate() + (sIdx + 2));
          const dueISO = `${dueD.getFullYear()}-${String(dueD.getMonth() + 1).padStart(2, '0')}-${String(dueD.getDate()).padStart(2, '0')}`;
          customTasks.push({
            id: `task_${sub.id}_${cIdx}`,
            title: `${sub.name} Problem Set & Practice`,
            subject: sub.name,
            category: "Assignment",
            dueDate: dueISO,
            dueTime: "18:00",
            priority: ch.difficulty === 'Hard' ? 'High' : 'Medium',
            estHours: ch.difficulty === 'Hard' ? 3 : 2,
            completed: false,
            sessionsDone: 0,
            totalSessions: 4
          });
        }
      });
    });

    setTimeout(() => {
      onRegister({
        username: regForm.username.trim().toLowerCase(),
        password: regForm.password,
        profile: profileData,
        topics: customTopics,
        tasks: customTasks,
        availability: availability,
        joinedAt: new Date().toISOString()
      });
      setIsSubmitting(false);
    }, 400);
  };

  const finalizeProfileUpdate = () => {
    const levelObj = STUDY_LEVELS.find(l => l.id === regForm.studying);
    const yearObj = COLLEGE_YEARS.find(y => y.id === regForm.collegeYear);
    const course = regForm.courseName ? regForm.courseName.trim() : '';
    let summaryTag = levelObj ? levelObj.badge : 'Student';
    if (regForm.studying === 'higher_studies' && yearObj) {
      summaryTag = course ? `${course} · ${yearObj.short}` : yearObj.short;
    }

    onUpdateProfile({
      name: regForm.name.trim(),
      age: regForm.age,
      studying: regForm.studying,
      collegeYear: regForm.collegeYear,
      courseName: course,
      avatar: regForm.avatar,
      dailyTargetHours: regForm.dailyTargetHours,
      levelTitle: levelObj?.title || 'Student',
      yearLabel: yearObj?.label || '',
      yearShort: yearObj?.short || '',
      summaryTag,
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181A1D] text-white text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
            {isEditing ? 'Profile Settings' : 'Be.study Planner'}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#181A1D] tracking-tight font-display mb-1.5">
            {isEditing 
              ? 'Update Your Details' 
              : mode === 'login' 
                ? 'Welcome Back' 
                : regStep === 1 
                  ? 'Create Student Account' 
                  : regStep === 2 
                    ? 'Your Subjects & Topics' 
                    : 'Weekly Study Availability'}
          </h1>
          <p className="text-[#8E8880] text-xs sm:text-sm max-w-md mx-auto">
            {isEditing
              ? 'Modify your study preferences, academic information, or delete account.'
              : mode === 'login'
                ? 'Sign in with your username and password to restore all your saved tasks, timetable, and study progress.'
                : regStep === 1
                  ? 'Step 1 of 3: Enter your academic profile & credentials.'
                  : regStep === 2
                    ? 'Step 2 of 3: Add the courses and chapters you need to study this term.'
                    : 'Step 3 of 3: Select the hours you are free to study each week.'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only on step 1) */}
        {!isEditing && regStep === 1 && (
          <div className="flex items-center p-1 bg-[#F8F6F1] border border-[#ECE6DC] rounded-full mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#181A1D] text-white shadow-sm'
                  : 'text-[#8E8880] hover:text-[#181A1D]'
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#181A1D] text-white shadow-sm'
                  : 'text-[#8E8880] hover:text-[#181A1D]'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Create Account
            </button>
          </div>
        )}

        {/* Step Indicator on Multi-step Registration */}
        {!isEditing && mode === 'register' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className={`w-8 h-1.5 rounded-full transition-all ${regStep >= 1 ? 'bg-[#181A1D]' : 'bg-[#ECE6DC]'}`} />
            <span className={`w-8 h-1.5 rounded-full transition-all ${regStep >= 2 ? 'bg-[#181A1D]' : 'bg-[#ECE6DC]'}`} />
            <span className={`w-8 h-1.5 rounded-full transition-all ${regStep >= 3 ? 'bg-[#181A1D]' : 'bg-[#ECE6DC]'}`} />
          </div>
        )}

        {/* Saved Profiles Quick Select */}
        {!isEditing && accountList.length > 0 && mode === 'login' && (
          <div className="mb-6 pb-5 border-b border-[#F4F1EB]">
            <label className="block text-[11px] font-bold text-[#8E8880] uppercase tracking-wider mb-2">
              Saved Profiles on this device
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {accountList.map((acc) => {
                const isSelected = loginForm.username.toLowerCase() === acc.username.toLowerCase();
                return (
                  <div
                    key={acc.username}
                    className={`px-3 py-2 rounded-2xl border text-left flex items-center gap-2.5 transition-all shrink-0 group ${
                      isSelected
                        ? 'bg-[#181A1D] border-[#181A1D] text-white shadow-xs'
                        : 'bg-[#F8F6F1] border-[#ECE6DC] text-[#181A1D] hover:border-[#181A1D]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectQuickAccount(acc)}
                      className="flex items-center gap-2 cursor-pointer text-left"
                    >
                      <span className="text-lg">{acc.profile?.avatar || '🎓'}</span>
                      <div>
                        <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-[#181A1D]'}`}>
                          {acc.profile?.name || acc.username}
                        </p>
                        <p className={`text-[10px] ${isSelected ? 'text-[#8E95A2]' : 'text-[#8E8880]'}`}>
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
                        className="p-1 rounded-full text-[#8E8880] hover:text-[#E11D48] cursor-pointer"
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
              <label className="block text-xs font-bold text-[#181A1D] uppercase tracking-wider mb-1.5">
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
                  className={`w-full bg-[#F8F6F1] border ${
                    errors.username ? 'border-[#FB7185]' : 'border-[#ECE6DC] focus:border-[#181A1D]'
                  } rounded-full pl-10 pr-4 py-3 text-xs text-[#181A1D] placeholder-[#8E8880] focus:outline-none transition-all`}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-[#E11D48] font-bold">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#181A1D] uppercase tracking-wider mb-1.5">
                Password <span className="text-[#FB7185]">*</span>
              </label>
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
                  className={`w-full bg-[#F8F6F1] border ${
                    errors.password ? 'border-[#FB7185]' : 'border-[#ECE6DC] focus:border-[#181A1D]'
                  } rounded-full pl-10 pr-11 py-3 text-xs text-[#181A1D] placeholder-[#8E8880] focus:outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8E8880] hover:text-[#181A1D] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-[#E11D48] font-bold">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#181A1D] hover:bg-black text-white font-bold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In & Open Planner</span>
                  <ArrowRight className="w-4 h-4 text-[#FACC15]" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#8E8880] pt-2">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setRegStep(1); setErrors({}); }}
                className="text-[#181A1D] font-extrabold underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* ---------------- REGISTER STEP 1 (Or Edit Profile) ---------------- */}
        {((mode === 'register' && regStep === 1) || isEditing) && (
          <form onSubmit={handleStep1Submit} className="space-y-5">
            
            {/* Account Credentials */}
            {!isEditing && (
              <div className="p-4 rounded-3xl bg-[#F8F6F1] border border-[#ECE6DC] space-y-3.5">
                <div className="flex items-center gap-2 text-[#181A1D] text-xs font-bold uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 text-[#FACC15]" />
                  Account Security
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#181A1D] mb-1">
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
                        errors.username ? 'border-[#FB7185]' : 'border-[#ECE6DC]'
                      } rounded-full pl-10 pr-4 py-2.5 text-xs text-[#181A1D] placeholder-[#8E8880] focus:outline-none focus:border-[#181A1D]`}
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-xs text-[#E11D48] font-bold">{errors.username}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#181A1D] mb-1">
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
                          errors.password ? 'border-[#FB7185]' : 'border-[#ECE6DC]'
                        } rounded-full pl-10 pr-9 py-2.5 text-xs text-[#181A1D] placeholder-[#8E8880] focus:outline-none focus:border-[#181A1D]`}
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-[#E11D48] font-bold">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#181A1D] mb-1">
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
                          errors.confirmPassword ? 'border-[#FB7185]' : 'border-[#ECE6DC]'
                        } rounded-full pl-10 pr-9 py-2.5 text-xs text-[#181A1D] placeholder-[#8E8880] focus:outline-none focus:border-[#181A1D]`}
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-[#E11D48] font-bold">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-bold text-[#181A1D] uppercase tracking-wider mb-2">
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
                          ? 'bg-[#181A1D] ring-2 ring-[#181A1D] shadow-md scale-105'
                          : 'bg-[#F8F6F1] border border-[#ECE6DC] hover:scale-105'
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
                <label className="block text-xs font-bold text-[#181A1D] uppercase tracking-wider mb-1">
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
                  className={`w-full bg-[#F8F6F1] border ${
                    errors.name ? 'border-[#FB7185]' : 'border-[#ECE6DC]'
                  } rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#181A1D] placeholder-[#8E8880] focus:outline-none focus:border-[#181A1D]`}
                />
                {errors.name && <p className="mt-1 text-xs text-[#E11D48] font-bold">{errors.name}</p>}
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-[#181A1D] uppercase tracking-wider mb-1">
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
                  className={`w-full bg-[#F8F6F1] border ${
                    errors.age ? 'border-[#FB7185]' : 'border-[#ECE6DC]'
                  } rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#181A1D] placeholder-[#8E8880] focus:outline-none focus:border-[#181A1D]`}
                />
                {errors.age && <p className="mt-1 text-xs text-[#E11D48] font-bold">{errors.age}</p>}
              </div>
            </div>

            {/* Currently Studying */}
            <div>
              <label className="block text-xs font-bold text-[#181A1D] uppercase tracking-wider mb-2">
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
                          ? 'bg-[#181A1D] text-white border-[#181A1D] shadow-xs'
                          : 'bg-[#F8F6F1] border-[#ECE6DC] hover:border-[#181A1D]'
                      }`}
                    >
                      <div className={`p-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white/20 text-[#FACC15]' : 'bg-[#EAE4DA] text-[#181A1D]'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-[#181A1D]'}`}>
                          {level.title}
                        </p>
                        <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-[#A6ADB8]' : 'text-[#8E8880]'}`}>
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
              <div className="bg-[#F8F6F1] border border-[#ECE6DC] rounded-3xl p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#181A1D]" />
                  <h3 className="text-xs font-bold text-[#181A1D] uppercase tracking-wider">Higher Studies Details</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#181A1D] mb-1">
                    Course / Degree / Major <span className="text-[#FB7185]">*</span>
                  </label>
                  <input
                    type="text"
                    value={regForm.courseName}
                    onChange={(e) => {
                      setRegForm({ ...regForm, courseName: e.target.value });
                      if (errors.courseName) setErrors({ ...errors, courseName: null });
                    }}
                    placeholder="e.g. Computer Science, B.Tech CSE"
                    className="w-full bg-white border border-[#ECE6DC] rounded-full px-4 py-2 text-xs text-[#181A1D] focus:outline-none focus:border-[#181A1D]"
                  />
                  {errors.courseName && <p className="mt-1 text-xs text-[#E11D48] font-bold">{errors.courseName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#181A1D] mb-1.5">
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
                          className={`px-2 py-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                            isYearSelected
                              ? 'bg-[#181A1D] text-white border-[#181A1D]'
                              : 'bg-white border-[#ECE6DC] text-[#8E8880] hover:text-[#181A1D]'
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

            {/* Daily Target */}
            <div className="bg-[#F8F6F1] border border-[#ECE6DC] rounded-3xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-[#FB7185]" />
                <div>
                  <p className="text-xs font-bold text-[#181A1D]">Daily Study Target</p>
                  <p className="text-[10px] text-[#8E8880]">Hours planned each day</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-white border border-[#ECE6DC] rounded-full p-1">
                {[2, 3, 4, 6, 8].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setRegForm({ ...regForm, dailyTargetHours: hrs })}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      regForm.dailyTargetHours === hrs ? 'bg-[#181A1D] text-white' : 'text-[#8E8880] hover:text-[#181A1D]'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* Next / Submit Button */}
            <div className="flex items-center gap-3 pt-1">
              {isEditing && onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-5 py-3 rounded-full border border-[#ECE6DC] bg-[#F8F6F1] text-[#181A1D] font-bold text-xs hover:bg-[#EAE4DA] cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#181A1D] hover:bg-black text-white font-bold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                <span>{isEditing ? 'Save Profile Changes' : 'Next: Add Subjects & Topics'}</span>
                <ArrowRight className="w-4 h-4 text-[#FACC15]" />
              </button>
            </div>

            {/* Account Deletion */}
            {isEditing && onDeleteAccount && (
              <div className="mt-6 pt-5 border-t border-[#F4F1EB]">
                <div className="p-4 rounded-3xl border border-[#FECDD3] bg-[#FFF1F2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#E11D48]">Permanently Delete Account</p>
                    <p className="text-[11px] text-[#9F1239] mt-0.5">Erase your profile, tasks, availability, and AI timetables.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onDeleteAccount}
                    className="px-4 py-2 rounded-full bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Profile</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* ---------------- REGISTER STEP 2: SUBJECTS & CHAPTERS ---------------- */}
        {!isEditing && mode === 'register' && regStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Subject Tabs & Adder */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#181A1D] uppercase tracking-wider">
                1. Your Course Subjects
              </label>

              {/* Subject Adder Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); } }}
                  placeholder="Type course subject (e.g. Physics, Macroeconomics)..."
                  className="flex-1 bg-[#F8F6F1] border border-[#ECE6DC] rounded-full px-4 py-2.5 text-xs text-[#181A1D] placeholder-[#8E8880] focus:outline-none focus:border-[#181A1D]"
                />
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="px-4 py-2.5 rounded-full bg-[#181A1D] text-white text-xs font-bold hover:bg-black flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FACC15]" />
                  <span>Add Subject</span>
                </button>
              </div>

              {/* Subject Selection Pills */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                {subjects.map((s) => {
                  const isActive = activeSubjectId === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer border ${
                        isActive
                          ? 'bg-[#181A1D] text-white border-[#181A1D] shadow-xs'
                          : 'bg-[#F8F6F1] text-[#78716C] border-[#ECE6DC] hover:border-[#181A1D]'
                      }`}
                      onClick={() => setActiveSubjectId(s.id)}
                    >
                      <span>{s.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-[#FACC15]' : 'bg-[#E7E1D6] text-[#78716C]'}`}>
                        {s.chapters.length}
                      </span>
                      {subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveSubject(s.id); }}
                          className="hover:text-[#FB7185]"
                          title="Delete subject"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chapters & Topics for Active Subject */}
            {activeSubjectId && (
              <div className="p-4 rounded-3xl bg-[#F8F6F1] border border-[#ECE6DC] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#181A1D]" />
                    <span className="text-xs font-bold text-[#181A1D]">
                      Chapters & Topics for {subjects.find(s => s.id === activeSubjectId)?.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#8E8880]">
                    {subjects.find(s => s.id === activeSubjectId)?.chapters.length || 0} chapters
                  </span>
                </div>

                {/* Chapter Add Row */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={newChapterInput}
                    onChange={(e) => setNewChapterInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChapter(); } }}
                    placeholder="Chapter / Topic name (e.g. Vector Algebra)..."
                    className="w-full sm:flex-1 bg-white border border-[#ECE6DC] rounded-full px-3.5 py-2 text-xs text-[#181A1D] placeholder-[#8E8880] focus:outline-none focus:border-[#181A1D]"
                  />

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={newChapterDifficulty}
                      onChange={(e) => setNewChapterDifficulty(e.target.value)}
                      className="bg-white border border-[#ECE6DC] rounded-full px-3 py-2 text-xs font-bold text-[#181A1D] focus:outline-none cursor-pointer"
                    >
                      <option value="Easy">🟢 Easy</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Hard">🔴 Hard</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="px-3.5 py-2 rounded-full bg-[#181A1D] text-white text-xs font-bold hover:bg-black flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FACC15]" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Chapters List */}
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {(subjects.find(s => s.id === activeSubjectId)?.chapters || []).length === 0 ? (
                    <p className="text-xs text-[#8E8880] text-center py-3">No chapters added yet for this subject. Type above to add one!</p>
                  ) : (
                    (subjects.find(s => s.id === activeSubjectId)?.chapters || []).map((ch) => (
                      <div key={ch.id} className="p-2.5 rounded-2xl bg-white border border-[#ECE6DC] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ch.difficulty === 'Hard' ? 'bg-[#E11D48]' : ch.difficulty === 'Medium' ? 'bg-[#EAB308]' : 'bg-[#10B981]'}`} />
                          <span className="font-bold text-[#181A1D]">{ch.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#F8F6F1] text-[#78716C]">
                            {ch.difficulty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChapter(activeSubjectId, ch.id)}
                            className="text-[#8E8880] hover:text-[#E11D48] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRegStep(1)}
                className="px-5 py-3 rounded-full border border-[#ECE6DC] bg-[#F8F6F1] text-[#181A1D] font-bold text-xs hover:bg-[#EAE4DA] cursor-pointer"
              >
                Back to Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  const totalCh = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
                  if (totalCh === 0) {
                    alert('Please add at least one chapter/topic so the AI can build your study schedule!');
                    return;
                  }
                  setRegStep(3);
                }}
                className="flex-1 bg-[#181A1D] hover:bg-black text-white font-bold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
              >
                <span>Next: Set Study Hours</span>
                <ArrowRight className="w-4 h-4 text-[#FACC15]" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------- REGISTER STEP 3: AVAILABILITY & SLOTS ---------------- */}
        {!isEditing && mode === 'register' && regStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Presets Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#181A1D] uppercase tracking-wider">
                  Weekly Study Hours
                </label>
                <span className="text-[11px] font-bold text-[#8E8880]">
                  Click cells to toggle free study slots
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => applyAvailabilityPreset("evenings")}
                  className="px-3 py-1.5 rounded-full bg-[#F8F6F1] hover:bg-[#181A1D] hover:text-white border border-[#ECE6DC] text-xs font-bold text-[#181A1D] transition-all cursor-pointer shrink-0"
                >
                  🌙 Evenings & Weekends
                </button>
                <button
                  type="button"
                  onClick={() => applyAvailabilityPreset("mornings")}
                  className="px-3 py-1.5 rounded-full bg-[#F8F6F1] hover:bg-[#181A1D] hover:text-white border border-[#ECE6DC] text-xs font-bold text-[#181A1D] transition-all cursor-pointer shrink-0"
                >
                  ☀️ Morning Focus (8am–12pm)
                </button>
                <button
                  type="button"
                  onClick={() => applyAvailabilityPreset("fullday")}
                  className="px-3 py-1.5 rounded-full bg-[#F8F6F1] hover:bg-[#181A1D] hover:text-white border border-[#ECE6DC] text-xs font-bold text-[#181A1D] transition-all cursor-pointer shrink-0"
                >
                  ⚡ Full Day Open
                </button>
              </div>
            </div>

            {/* Availability Mini Grid */}
            <div className="p-3.5 rounded-3xl bg-[#F8F6F1] border border-[#ECE6DC] space-y-2 overflow-x-auto">
              <div className="min-w-[480px] space-y-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const daySlots = availability[d] || [];
                  return (
                    <div key={d} className="flex items-center gap-2">
                      <span className="w-10 text-xs font-bold text-[#181A1D] shrink-0">{d}</span>
                      <div className="flex items-center gap-1 flex-1 flex-wrap">
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((h) => {
                          const isFree = daySlots.includes(h);
                          return (
                            <button
                              key={h}
                              type="button"
                              onClick={() => toggleSlot(d, h)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isFree 
                                  ? 'bg-[#181A1D] text-[#FACC15] shadow-xs' 
                                  : 'bg-white border border-[#ECE6DC] text-[#A8A29E] hover:border-[#181A1D]'
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
            <div className="p-3 rounded-2xl bg-[#FDE047]/20 border border-[#FACC15]/40 flex items-center gap-2.5 text-xs text-[#181A1D]">
              <Sparkles className="w-4 h-4 text-[#CA8A04] shrink-0" />
              <span>The AI will schedule study sessions for your <strong>{subjects.reduce((sum, s) => sum + s.chapters.length, 0)} chapters</strong> into these free hours without collision.</span>
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRegStep(2)}
                className="px-5 py-3 rounded-full border border-[#ECE6DC] bg-[#F8F6F1] text-[#181A1D] font-bold text-xs hover:bg-[#EAE4DA] cursor-pointer"
              >
                Back to Subjects
              </button>
              <button
                type="button"
                onClick={handleFinalRegisterSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-[#181A1D] hover:bg-black text-white font-bold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
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
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
