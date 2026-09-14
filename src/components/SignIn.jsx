import React, { useState } from 'react';
import { 
  GraduationCap, 
  User, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  Award, 
  School, 
  Flame, 
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  Trash2,
  X
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
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  
  // Register / Edit form state
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

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    const u = loginForm.username.trim().toLowerCase();
    
    if (!u) {
      errs.username = 'Please enter your username';
    }
    if (!loginForm.password) {
      errs.password = 'Please enter your password';
    }

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

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    const u = regForm.username.trim().toLowerCase();

    if (!isEditing) {
      if (!u) {
        errs.username = 'Please choose a username';
      } else if (u.length < 3) {
        errs.username = 'Username must be at least 3 characters';
      } else if (existingAccounts[u]) {
        errs.username = 'This username is already registered. Please sign in';
      }

      if (!regForm.password) {
        errs.password = 'Please set a password';
      } else if (regForm.password.length < 4) {
        errs.password = 'Password must be at least 4 characters';
      }

      if (regForm.password !== regForm.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    if (!regForm.name.trim()) {
      errs.name = 'Please enter your full name';
    }

    if (!regForm.age) {
      errs.age = 'Please enter your age';
    } else {
      const a = parseInt(regForm.age, 10);
      if (isNaN(a) || a < 5 || a > 100) errs.age = 'Enter a valid age (5 - 100)';
    }

    if (!regForm.studying) {
      errs.studying = 'Please select what you are studying';
    } else if (regForm.studying === 'higher_studies') {
      if (!regForm.courseName || !regForm.courseName.trim()) {
        errs.courseName = 'Please enter your course or degree (e.g. Computer Science, B.Tech, B.Com)';
      }
      if (!regForm.collegeYear) {
        errs.collegeYear = 'Please select your year of study';
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
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
      dailyTargetHours: regForm.dailyTargetHours,
      levelTitle: levelObj?.title || 'Student',
      yearLabel: yearObj?.label || '',
      yearShort: yearObj?.short || '',
      summaryTag,
    };

    setTimeout(() => {
      if (isEditing) {
        onUpdateProfile(profileData);
      } else {
        onRegister({
          username: u,
          password: regForm.password,
          profile: profileData,
          joinedAt: new Date().toISOString()
        });
      }
      setIsSubmitting(false);
    }, 400);
  };

  const selectQuickAccount = (acc) => {
    setLoginForm({ username: acc.username, password: '' });
    setMode('login');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-xl bg-slate-900/85 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 relative z-10 my-6">
        
        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {isEditing ? 'Profile Settings' : 'Student Study Planner'}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display mb-1.5">
            {isEditing 
              ? 'Update Your Details' 
              : mode === 'login' 
                ? 'Welcome' 
                : 'Create Student Account'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto">
            {isEditing
              ? 'Modify your study preferences, academic information, or delete account.'
              : mode === 'login'
                ? 'Sign in with your username and password to restore all your saved tasks, timetable, and study progress.'
                : 'Register to set your personalized password and start planning.'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Sign In / Register) if not editing */}
        {!isEditing && (
          <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrors({}); }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Create Account
            </button>
          </div>
        )}

        {/* Quick Account Switcher & Delete Option from Login */}
        {!isEditing && accountList.length > 0 && mode === 'login' && (
          <div className="mb-6 pb-5 border-b border-slate-800">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Saved Profiles on this device
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {accountList.map((acc) => {
                const isSelected = loginForm.username.toLowerCase() === acc.username.toLowerCase();
                return (
                  <div
                    key={acc.username}
                    className={`px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 transition-all shrink-0 group ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectQuickAccount(acc)}
                      className="flex items-center gap-2 cursor-pointer text-left"
                    >
                      <span className="text-lg">{acc.profile?.avatar || '🎓'}</span>
                      <div>
                        <p className="text-xs font-bold leading-tight">{acc.profile?.name || acc.username}</p>
                        <p className="text-[10px] text-slate-400">@{acc.username}</p>
                      </div>
                    </button>
                    {onDeleteSavedAccount && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSavedAccount(acc.username);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer opacity-80 hover:opacity-100"
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, username: e.target.value });
                    if (errors.username) setErrors({ ...errors, username: null });
                  }}
                  placeholder="e.g. shreya_s"
                  className={`w-full bg-slate-950/70 border ${
                    errors.username ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700/80 focus:border-indigo-500'
                  } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all`}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                  className={`w-full bg-slate-950/70 border ${
                    errors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700/80 focus:border-indigo-500'
                  } rounded-xl pl-10 pr-11 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In & Open Planner</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 pt-2">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setErrors({}); }}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* ---------------- REGISTER & EDIT FORM ---------------- */}
        {(mode === 'register' || isEditing) && (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            
            {/* Account Credentials (Only on Registration) */}
            {!isEditing && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3.5">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <KeyRound className="w-4 h-4" />
                  Account Security
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Choose Username <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regForm.username}
                      onChange={(e) => {
                        setRegForm({ ...regForm, username: e.target.value.replace(/\s+/g, '') });
                        if (errors.username) setErrors({ ...errors, username: null });
                      }}
                      placeholder="e.g. shreya_s"
                      className={`w-full bg-slate-900 border ${
                        errors.username ? 'border-rose-500' : 'border-slate-700'
                      } rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500`}
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-xs text-rose-400">{errors.username}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Set Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regForm.password}
                        onChange={(e) => {
                          setRegForm({ ...regForm, password: e.target.value });
                          if (errors.password) setErrors({ ...errors, password: null });
                        }}
                        placeholder="Min 4 characters"
                        className={`w-full bg-slate-900 border ${
                          errors.password ? 'border-rose-500' : 'border-slate-700'
                        } rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500`}
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regForm.confirmPassword}
                        onChange={(e) => {
                          setRegForm({ ...regForm, confirmPassword: e.target.value });
                          if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                        }}
                        placeholder="Re-enter password"
                        className={`w-full bg-slate-900 border ${
                          errors.confirmPassword ? 'border-rose-500' : 'border-slate-700'
                        } rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500`}
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
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
                          ? 'bg-indigo-600 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 shadow-md scale-105'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:scale-105 active:scale-95'
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={regForm.name}
                  onChange={(e) => {
                    setRegForm({ ...regForm, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="e.g. Shreya Somal"
                  className={`w-full bg-slate-950/70 border ${
                    errors.name ? 'border-rose-500' : 'border-slate-700/80'
                  } rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500`}
                />
                {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Age <span className="text-rose-400">*</span>
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
                  className={`w-full bg-slate-950/70 border ${
                    errors.age ? 'border-rose-500' : 'border-slate-700/80'
                  } rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500`}
                />
                {errors.age && <p className="mt-1 text-xs text-rose-400">{errors.age}</p>}
              </div>
            </div>

            {/* Currently Studying Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                What are you currently studying? <span className="text-rose-400">*</span>
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
                          ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                          : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {level.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {level.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Higher Studies Questions */}
            {regForm.studying === 'higher_studies' && (
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Higher Studies Details</h3>
                </div>

                {/* Course Input (Required for Higher Studies) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Course / Degree / Major <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-indigo-400">e.g. B.Tech, CSE, B.Com</span>
                  </div>
                  <input
                    type="text"
                    value={regForm.courseName}
                    onChange={(e) => {
                      setRegForm({ ...regForm, courseName: e.target.value });
                      if (errors.courseName) setErrors({ ...errors, courseName: null });
                    }}
                    placeholder="e.g. Computer Science, B.Tech CSE, MBBS, B.Com"
                    className={`w-full bg-slate-950/70 border ${
                      errors.courseName ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500`}
                  />
                  {errors.courseName && (
                    <p className="mt-1 text-xs text-rose-400">{errors.courseName}</p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {['B.Tech CSE', 'Computer Science', 'B.Com', 'B.Sc Physics', 'MBBS', 'BBA', 'Mechanical Engg'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setRegForm({ ...regForm, courseName: c });
                          if (errors.courseName) setErrors({ ...errors, courseName: null });
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          regForm.courseName === c
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-semibold'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year of Study Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Which Year are you in? <span className="text-rose-400">*</span>
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
                          className={`px-2 py-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                            isYearSelected
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {yr.short}
                        </button>
                      );
                    })}
                  </div>
                  {errors.collegeYear && (
                    <p className="mt-1 text-xs text-rose-400">{errors.collegeYear}</p>
                  )}
                </div>
              </div>
            )}

            {/* Daily Study Goal */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Daily Study Target</p>
                  <p className="text-[10px] text-slate-400">Target hours planned each day</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                {[2, 3, 4, 6, 8].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setRegForm({ ...regForm, dailyTargetHours: hrs })}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      regForm.dailyTargetHours === hrs ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center gap-3 pt-1">
              {isEditing && onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-5 py-3.5 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isEditing ? 'Save Profile Changes' : 'Complete Registration & Start'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Permanent Account Deletion Section (Only when in Edit Mode) */}
            {isEditing && onDeleteAccount && (
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-rose-300">Permanently Delete Account</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Erase your profile, tasks, availability, and AI timetables completely.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onDeleteAccount}
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/50 text-rose-300 hover:text-rose-100 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Profile</span>
                  </button>
                </div>
              </div>
            )}

            {!isEditing && (
              <p className="text-center text-xs text-slate-400 pt-1">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrors({}); }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                >
                  Sign In to existing account
                </button>
              </p>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
