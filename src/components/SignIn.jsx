import React, { useState } from 'react';
import { 
  GraduationCap, User, BookOpen, Sparkles, ArrowRight, Calendar, Award, 
  School, Flame, CheckCircle2, ChevronRight, Lightbulb, Lock, Eye, EyeOff, 
  LogIn, UserPlus, KeyRound, Trash2, X, Plus, Clock, Target, Check, Layers, Zap
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
      Mon: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
      Tue: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
      Wed: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
      Thu: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
      Fri: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
      Sat: [10, 11, 12, 14, 15, 16, 17],
      Sun: [10, 11, 12, 14, 15, 16, 17],
    };
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats calculation
  const totalChaptersCount = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
  const totalWeeklyStudyHours = Object.values(availability || {}).reduce((sum, slots) => sum + (Array.isArray(slots) ? slots.length : 0), 0);

  /* ---- Handlers for Step 2 Subjects & Chapters ---- */
  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    if (subjects.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrors({ subject: 'A subject with this name already exists' });
      return;
    }
    const newId = 's_' + Date.now();
    const newSub = {
      id: newId,
      name: trimmed,
      priority: newSubjectPriority,
      chapters: []
    };
    setSubjects([...subjects, newSub]);
    setActiveSubjectId(newId);
    setNewSubjectInput('');
    setNewSubjectPriority('Medium');
    setErrors({ ...errors, subject: null });
  };

  const handleRemoveSubject = (idToRemove) => {
    const filtered = subjects.filter(s => s.id !== idToRemove);
    setSubjects(filtered);
    if (activeSubjectId === idToRemove) {
      setActiveSubjectId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const handleToggleSubjectPriority = (subjectId) => {
    const cycle = { High: 'Medium', Medium: 'Low', Low: 'High' };
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return { ...s, priority: cycle[s.priority || 'Medium'] || 'Medium' };
      }
      return s;
    }));
  };

  const handleAddChapter = () => {
    if (!activeSubjectId) return;
    const trimmed = newChapterInput.trim();
    if (!trimmed) return;

    setSubjects(subjects.map(s => {
      if (s.id === activeSubjectId) {
        const totalSessions = newChapterDifficulty === 'Hard' ? 6 : newChapterDifficulty === 'Medium' ? 4 : 2;
        const newCh = {
          id: 'c_' + Date.now(),
          name: trimmed,
          difficulty: newChapterDifficulty,
          priority: newChapterPriority,
          completed: false,
          sessionsDone: 0,
          totalSessions
        };
        return {
          ...s,
          chapters: [...s.chapters, newCh]
        };
      }
      return s;
    }));

    setNewChapterInput('');
  };

  const handleToggleChapterPriority = (subjectId, chapterId) => {
    const cycle = { High: 'Medium', Medium: 'Low', Low: 'High' };
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id === chapterId) {
              return { ...c, priority: cycle[c.priority || 'Medium'] || 'Medium' };
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
    if (!isEditing) {
      setRegStep(2);
    }
    return true;
  };

  /* ---- Step 3 Registration Final Submit ---- */
  const handleFinalRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    const u = regForm.username.trim().toLowerCase();

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

    // Construct topics array with subjects and chapters
    const topics = [];
    subjects.forEach((sub, sIdx) => {
      sub.chapters.forEach((ch, cIdx) => {
        topics.push({
          id: ch.id || `topic_${sIdx}_${cIdx}`,
          name: ch.name,
          subject: sub.name,
          difficulty: ch.difficulty || 'Medium',
          priority: ch.priority || sub.priority || 'Medium',
          subjectPriority: sub.priority || 'Medium',
          completed: false,
          sessionsDone: 0,
          totalSessions: ch.totalSessions || (ch.difficulty === 'Hard' ? 6 : ch.difficulty === 'Medium' ? 4 : 2)
        });
      });
    });

    setIsSubmitting(true);
    try {
      await onRegister({
        username: u,
        password: regForm.password,
        profile: profileData,
        topics: topics,
        availability: availability
      });
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Edit Mode Save Changes ---- */
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
    <div className="min-h-screen w-full bg-wild-light flex flex-col lg:flex-row relative font-sans antialiased overflow-x-hidden selection:bg-vital-spark selection:text-white">
      
      {/* ============================================================== */}
      {/* LEFT PANEL: Light Inspos Panel with Logo, Cloud Blob & Illustration */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[52%] xl:w-[54%] min-h-[460px] lg:min-h-screen relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 z-10 bg-wild-light">
        
        {/* Soft Background Blob Accent Elements */}
        <div className="absolute top-16 left-10 w-72 h-72 rounded-full bg-calm-awakening/15 filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-16 right-20 w-80 h-80 rounded-full bg-blush-rose/15 filter blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-rooted-strength/10 filter blur-2xl pointer-events-none" />

        {/* Top Header: University / App Brand Logo */}
        <div className="relative z-20 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-liminal-night text-wild-light flex items-center justify-center shadow-md ring-1 ring-white/10 shrink-0">
            <GraduationCap className="w-6 h-6 text-vital-spark" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-base sm:text-lg tracking-wider text-liminal-night uppercase">
                BE.STUDY PLANNER
              </span>
              <Sparkles className="w-3.5 h-3.5 text-vital-spark" />
            </div>
            <span className="block text-[10.5px] tracking-widest text-liminal-night/60 uppercase font-bold">
              Cognitive Academic Intelligence
            </span>
          </div>
        </div>

        {/* Center: Organic Cloud Backdrop & Uploaded Clean Image Illustration */}
        <div className="relative z-20 my-auto py-8 sm:py-10 flex flex-col items-center justify-center">
          
          {/* Outer floating decorative circles (matching reference style) */}
          <div className="absolute -top-4 left-8 w-14 h-14 rounded-full bg-calm-awakening/25 pointer-events-none animate-pulse duration-1000" />
          <div className="absolute top-8 right-12 w-8 h-8 rounded-full bg-blush-rose/30 pointer-events-none" />
          <div className="absolute bottom-4 left-16 w-10 h-10 rounded-full bg-inner-resolve/20 pointer-events-none" />
          <div className="absolute bottom-10 right-20 w-16 h-16 rounded-full bg-rooted-strength/25 pointer-events-none" />
          <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-vital-spark/20 pointer-events-none" />
          <div className="absolute top-1/4 right-6 w-5 h-5 rounded-full bg-liminal-night/10 pointer-events-none" />

          {/* Clean Illustration Container - Sized Bigger with Float Animation */}
          <div className="relative flex items-center justify-center w-full max-w-[480px] xl:max-w-[540px]">
            {/* The newly uploaded clean image illustration with students, lightbulb, graduation cap */}
            <img
              src="/login-illustration.png"
              alt="Student Study Planner Illustration"
              className="w-full max-w-[440px] xl:max-w-[500px] 2xl:max-w-[530px] h-auto max-h-[520px] object-contain drop-shadow-md select-none animate-float-slow transition-transform duration-500 hover:scale-[1.03]"
              loading="eager"
            />
          </div>
        </div>

        {/* Bottom Left Footer Note */}
        <div className="relative z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-liminal-night/60 font-medium pt-4">
          <p>© 2026 Be.Study Planner · Powered by AI Cognitive Engine</p>
          <p className="hidden sm:block text-liminal-night/40">Focused Deep Work</p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* S-CURVE ORGANIC SEPARATOR (Exact inspiration wavy curve) */}
      {/* ============================================================== */}
      <div className="hidden lg:block absolute top-0 bottom-0 left-[52%] xl:left-[54%] w-24 xl:w-32 -translate-x-full h-full pointer-events-none z-30 overflow-hidden">
        <svg 
          viewBox="0 0 100 1000" 
          preserveAspectRatio="none" 
          className="w-full h-full text-liminal-night fill-current"
        >
          {/* Organic S-curve: Bulges into the left panel at the top, sweeps smoothly right around the illustration, then sweeps out gently at bottom */}
          <path d="M 100 0 L 15 0 C -15 160 30 380 75 500 C 120 620 40 840 20 1000 L 100 1000 Z" />
        </svg>
      </div>

      {/* ============================================================== */}
      {/* RIGHT PANEL: Dark Theme Website Color Scheme (#2C2F40) Form */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[48%] xl:w-[46%] min-h-screen lg:h-screen lg:overflow-y-auto dark-scrollbar bg-liminal-night text-wild-light relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 z-20 shadow-2xl">
        
        {/* Subtle decorative glow in top-right corner of dark panel */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-vital-spark/10 filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-calm-awakening/10 filter blur-3xl pointer-events-none" />

        {/* Top Section: Heading & Form Switcher - Compact & Refined Width */}
        <div className={`relative z-10 w-full ${mode === 'login' && !isEditing ? 'max-w-[430px]' : 'max-w-[500px]'} mx-auto my-auto py-4`}>

          {/* ---------------- EDIT PROFILE 3-TAB SWITCHER ---------------- */}
          {isEditing && (
            <div className="flex items-center p-1 bg-[#202332] border border-white/10 rounded-full mb-6 gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setRegStep(1)}
                className={`flex-1 py-2 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  regStep === 1
                    ? 'bg-steady-renewal text-liminal-night shadow-xs'
                    : 'text-wild-light/70 hover:text-white'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${regStep === 1 ? 'text-vital-spark' : ''}`} />
                <span className="truncate">1. Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setRegStep(2)}
                className={`flex-1 py-2 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  regStep === 2
                    ? 'bg-steady-renewal text-liminal-night shadow-xs'
                    : 'text-wild-light/70 hover:text-white'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${regStep === 2 ? 'text-inner-resolve' : ''}`} />
                <span className="truncate">2. Topics</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${regStep === 2 ? 'bg-calm-awakening text-white' : 'bg-white/15 text-white'}`}>
                  {totalChaptersCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRegStep(3)}
                className={`flex-1 py-2 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  regStep === 3
                    ? 'bg-steady-renewal text-liminal-night shadow-xs'
                    : 'text-wild-light/70 hover:text-white'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${regStep === 3 ? 'text-vital-spark' : ''}`} />
                <span className="truncate">3. Hours</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${regStep === 3 ? 'bg-calm-awakening text-white' : 'bg-white/15 text-white'}`}>
                  {totalWeeklyStudyHours}h
                </span>
              </button>
            </div>
          )}

          {/* Page Title & Subtitle */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight mb-2">
              {isEditing 
                ? (regStep === 1 ? 'Academic Profile' : regStep === 2 ? 'Curriculum & Topics' : 'Weekly Availability')
                : mode === 'forgot_password'
                  ? 'Reset Password'
                  : mode === 'login' 
                    ? 'Login' 
                    : regStep === 1 
                      ? 'Create Account' 
                      : regStep === 2 
                        ? 'Course Subjects' 
                        : 'Study Availability'}
            </h1>
            <p className="text-calm-awakening text-xs sm:text-sm font-medium leading-relaxed">
              {isEditing
                ? (regStep === 1 
                    ? 'Update your name, degree, year of study, and daily study goal.' 
                    : regStep === 2 
                      ? 'Add, edit, or delete courses and chapters in your curriculum.' 
                      : 'Modify your weekly availability slots for automated schedule placement.')
                : mode === 'forgot_password'
                  ? 'Enter your registered username and set a new password to recover access.'
                  : mode === 'login'
                    ? 'Sign in to access your dashboard, tasks, and timetable.'
                    : regStep === 1
                      ? 'Step 1 of 3: Enter your academic credentials & profile.'
                      : regStep === 2
                        ? 'Step 2 of 3: Add courses & chapters for this semester.'
                        : 'Step 3 of 3: Pick the hours you are free to study.'}
            </p>
          </div>

          {/* Quick Tab Switcher for Sign In / Create Account (if not in forgot_password and not editing) */}
          {!isEditing && regStep === 1 && mode !== 'forgot_password' && (
            <div className="flex items-center p-1 bg-[#202332] border border-white/10 rounded-full mb-6">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrors({}); }}
                className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-steady-renewal text-liminal-night shadow-md'
                    : 'text-wild-light/70 hover:text-white'
                }`}
              >
                <LogIn className={`w-4 h-4 ${mode === 'login' ? 'text-vital-spark' : 'text-current'}`} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrors({}); }}
                className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-steady-renewal text-liminal-night shadow-md'
                    : 'text-wild-light/70 hover:text-white'
                }`}
              >
                <UserPlus className={`w-4 h-4 ${mode === 'register' ? 'text-inner-resolve' : 'text-current'}`} />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Step Indicator on Multi-step Registration */}
          {!isEditing && mode === 'register' && (
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <span className={`h-1.5 rounded-full transition-all ${regStep === 1 ? 'w-10 bg-vital-spark' : regStep > 1 ? 'w-6 bg-calm-awakening' : 'w-6 bg-white/20'}`} />
              <span className={`h-1.5 rounded-full transition-all ${regStep === 2 ? 'w-10 bg-vital-spark' : regStep > 2 ? 'w-6 bg-calm-awakening' : 'w-6 bg-white/20'}`} />
              <span className={`h-1.5 rounded-full transition-all ${regStep === 3 ? 'w-10 bg-vital-spark' : 'w-6 bg-white/20'}`} />
            </div>
          )}

          {/* Saved Profiles Quick Select */}
          {!isEditing && accountList.length > 0 && mode === 'login' && (
            <div className="mb-6 pb-4 border-b border-white/10">
              <label className="block text-[10.5px] font-bold text-calm-awakening uppercase tracking-wider mb-2.5">
                Saved Profiles on this device
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                {accountList.map((acc) => {
                  const isSelected = loginForm.username.toLowerCase() === acc.username.toLowerCase();
                  return (
                    <div
                      key={acc.username}
                      className={`px-3 py-2 rounded-2xl border text-left flex items-center gap-2.5 transition-all shrink-0 group ${
                        isSelected
                          ? 'bg-[#35394e] border-vital-spark text-white shadow-sm ring-1 ring-vital-spark/50'
                          : 'bg-[#222533] border-white/10 text-wild-light/90 hover:border-white/30'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectQuickAccount(acc)}
                        className="flex items-center gap-2.5 cursor-pointer text-left"
                      >
                        <span className="text-base bg-white/10 p-1.5 rounded-full border border-white/15">
                          {acc.profile?.avatar || '🎓'}
                        </span>
                        <div>
                          <p className="text-xs font-bold leading-tight text-white">
                            {acc.profile?.name || acc.username}
                          </p>
                          <p className="text-[10px] text-calm-awakening font-medium">
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
                          className="p-1 rounded-full text-white/40 hover:text-vital-spark cursor-pointer transition-colors"
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
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-calm-awakening">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, username: e.target.value });
                      if (errors.username) setErrors({ ...errors, username: null });
                    }}
                    placeholder="Enter your username"
                    className={`w-full bg-[#202332] border ${
                      errors.username ? 'border-vital-spark ring-1 ring-vital-spark' : 'border-white/15 focus:border-calm-awakening'
                    } rounded-full pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none transition-all font-medium`}
                  />
                </div>
                {errors.username && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-calm-awakening">
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
                    className={`w-full bg-[#202332] border ${
                      errors.password ? 'border-vital-spark ring-1 ring-vital-spark' : 'border-white/15 focus:border-calm-awakening'
                    } rounded-full pl-11 pr-11 py-3.5 text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none transition-all font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-calm-awakening hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-calm-awakening" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.password}</p>}
                
                {/* Forgot Password Right-Aligned (Matching Inspo) */}
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotForm({ username: loginForm.username || '', newPassword: '', confirmPassword: '' });
                      setMode('forgot_password');
                      setErrors({});
                    }}
                    className="text-xs text-calm-awakening hover:text-white font-medium hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Main Pill Button (Styled like Inspo button with theme palette) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#4E7678] hover:bg-[#436769] text-white font-bold py-3.5 px-6 rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-4"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-wild-light" />
                  </>
                )}
              </button>

              {/* Switch to Register Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-calm-awakening">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setErrors({}); }}
                    className="text-white hover:text-vital-spark font-bold underline cursor-pointer ml-1"
                  >
                    Register Now
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ---------------- FORGOT PASSWORD FORM ---------------- */}
          {mode === 'forgot_password' && !isEditing && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#202332] border border-white/10 space-y-2 mb-2">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <KeyRound className="w-4 h-4 text-vital-spark" />
                  Password Recovery
                </div>
                <p className="text-[11px] text-calm-awakening leading-relaxed font-medium">
                  Enter your registered student username below and set your new password. You will be logged in immediately upon resetting.
                </p>
              </div>

              {errors.general && (
                <div className="p-3 rounded-xl bg-vital-spark/20 border border-vital-spark text-xs text-white font-bold">
                  {errors.general}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  Registered Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-calm-awakening">
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
                    className={`w-full bg-[#202332] border ${
                      errors.username ? 'border-vital-spark ring-1 ring-vital-spark' : 'border-white/15 focus:border-calm-awakening'
                    } rounded-full pl-11 pr-4 py-3.5 text-xs text-white placeholder:text-white/35 focus:outline-none transition-all font-medium`}
                  />
                </div>
                {errors.username && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-calm-awakening">
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
                    className={`w-full bg-[#202332] border ${
                      errors.newPassword ? 'border-vital-spark ring-1 ring-vital-spark' : 'border-white/15 focus:border-calm-awakening'
                    } rounded-full pl-11 pr-11 py-3.5 text-xs text-white placeholder:text-white/35 focus:outline-none transition-all font-medium`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-calm-awakening hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-calm-awakening" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-calm-awakening">
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
                    className={`w-full bg-[#202332] border ${
                      errors.confirmPassword ? 'border-vital-spark ring-1 ring-vital-spark' : 'border-white/15 focus:border-calm-awakening'
                    } rounded-full pl-11 pr-4 py-3.5 text-xs text-white placeholder:text-white/35 focus:outline-none transition-all font-medium`}
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#4E7678] hover:bg-[#436769] text-white font-bold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Reset Password & Sign In</span>
                    <Check className="w-4 h-4 text-white" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-calm-awakening pt-2 font-medium">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrors({}); }}
                  className="text-white hover:text-vital-spark font-bold underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          )}

          {/* ---------------- STEP 1: ACADEMIC PROFILE & TARGET STUDY HOURS ---------------- */}
          {((mode === 'register' && regStep === 1) || (isEditing && regStep === 1)) && (
            <form onSubmit={handleStep1Submit} className="space-y-4.5">
              
              {/* Account Credentials (Only on Registration) */}
              {!isEditing && (
                <div className="p-3.5 rounded-2xl bg-[#202332] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                    <KeyRound className="w-4 h-4 text-vital-spark" />
                    Account Security
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/90 mb-1">
                      Choose Username <span className="text-vital-spark">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-calm-awakening absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regForm.username}
                        onChange={(e) => {
                          setRegForm({ ...regForm, username: e.target.value.replace(/\s+/g, '') });
                          if (errors.username) setErrors({ ...errors, username: null });
                        }}
                        placeholder="e.g. amanda"
                        className={`w-full bg-[#272a3c] border ${
                          errors.username ? 'border-vital-spark' : 'border-white/15'
                        } rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-calm-awakening font-medium`}
                      />
                    </div>
                    {errors.username && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.username}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-white/90 mb-1">
                        Set Password <span className="text-vital-spark">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-calm-awakening absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={regForm.password}
                          onChange={(e) => {
                            setRegForm({ ...regForm, password: e.target.value });
                            if (errors.password) setErrors({ ...errors, password: null });
                          }}
                          placeholder="Min 4 characters"
                          className={`w-full bg-[#272a3c] border ${
                            errors.password ? 'border-vital-spark' : 'border-white/15'
                          } rounded-full pl-10 pr-9 py-2 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-calm-awakening font-medium`}
                        />
                      </div>
                      {errors.password && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/90 mb-1">
                        Confirm Password <span className="text-vital-spark">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-calm-awakening absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={regForm.confirmPassword}
                          onChange={(e) => {
                            setRegForm({ ...regForm, confirmPassword: e.target.value });
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                          }}
                          placeholder="Re-enter password"
                          className={`w-full bg-[#272a3c] border ${
                            errors.confirmPassword ? 'border-vital-spark' : 'border-white/15'
                          } rounded-full pl-10 pr-9 py-2 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-calm-awakening font-medium`}
                        />
                      </div>
                      {errors.confirmPassword && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-bold text-calm-awakening uppercase tracking-wider mb-2">
                  Choose Your Avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
                  {AVATARS.map((emoji) => {
                    const isSelected = regForm.avatar === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setRegForm({ ...regForm, avatar: emoji })}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-steady-renewal text-liminal-night ring-2 ring-vital-spark shadow-md scale-105'
                            : 'bg-[#202332] border border-white/15 hover:border-white/40'
                        }`}
                      >
                        <span className="select-none leading-none">{emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold text-white/90 mb-1">
                    Full Name <span className="text-vital-spark">*</span>
                  </label>
                  <input
                    type="text"
                    value={regForm.name}
                    onChange={(e) => {
                      setRegForm({ ...regForm, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    placeholder="e.g. Amanda Smith"
                    className={`w-full bg-[#202332] border ${
                      errors.name ? 'border-vital-spark' : 'border-white/15'
                    } rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-calm-awakening font-medium`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.name}</p>}
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-white/90 mb-1">
                    Age <span className="text-vital-spark">*</span>
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
                    className={`w-full bg-[#202332] border ${
                      errors.age ? 'border-vital-spark' : 'border-white/15'
                    } rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-calm-awakening font-medium`}
                  />
                  {errors.age && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.age}</p>}
                </div>
              </div>

              {/* Currently Studying */}
              <div>
                <label className="block text-xs font-bold text-white/90 mb-1.5">
                  What are you studying? <span className="text-vital-spark">*</span>
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
                        className={`text-left p-2.5 rounded-2xl border transition-all flex items-start gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#35394e] border-vital-spark text-white ring-1 ring-vital-spark/50'
                            : 'bg-[#202332] border-white/10 hover:border-white/30 text-white/80'
                        }`}
                      >
                        <div className={`p-1.5 rounded-full shrink-0 ${isSelected ? 'bg-vital-spark text-white' : 'bg-white/10 text-calm-awakening'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-tight text-white">
                            {level.title}
                          </p>
                          <p className="text-[10px] mt-0.5 line-clamp-1 text-calm-awakening font-medium">
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
                <div className="bg-[#202332] border border-white/10 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-vital-spark" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Higher Studies Details</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/90 mb-1">
                      Course / Degree / Major <span className="text-vital-spark">*</span>
                    </label>
                    <input
                      type="text"
                      value={regForm.courseName}
                      onChange={(e) => {
                        setRegForm({ ...regForm, courseName: e.target.value });
                        if (errors.courseName) setErrors({ ...errors, courseName: null });
                      }}
                      placeholder="e.g. Computer Science, B.Tech CSE, MBA"
                      className="w-full bg-[#272a3c] border border-white/15 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-calm-awakening font-medium"
                    />
                    {errors.courseName && <p className="mt-1 text-xs text-vital-spark font-semibold">{errors.courseName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/90 mb-1.5">
                      Year of Study <span className="text-vital-spark">*</span>
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
                            className={`px-2 py-1.5 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                              isYearSelected
                                ? 'bg-vital-spark text-white border-vital-spark shadow-xs'
                                : 'bg-[#272a3c] border-white/10 text-white/80 hover:bg-white/10'
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

              {/* Daily Target Study Hours */}
              <div className="bg-[#202332] border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-vital-spark" />
                    <div>
                      <p className="text-xs font-bold text-white">Daily Study Target</p>
                      <p className="text-[10px] text-calm-awakening font-medium">
                        Goal: <strong className="text-white font-extrabold">{regForm.dailyTargetHours || 4}h/day</strong> (~{(regForm.dailyTargetHours || 4) * 7}h / week)
                      </p>
                    </div>
                  </div>

                  {/* Stepper buttons */}
                  <div className="flex items-center gap-1.5 bg-[#272a3c] border border-white/10 rounded-full p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setRegForm({ ...regForm, dailyTargetHours: Math.max(1, (Number(regForm.dailyTargetHours) || 4) - 1) })}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-all"
                    >
                      -
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-white">
                      {regForm.dailyTargetHours || 4}h
                    </span>
                    <button
                      type="button"
                      onClick={() => setRegForm({ ...regForm, dailyTargetHours: Math.min(16, (Number(regForm.dailyTargetHours) || 4) + 1) })}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[2, 3, 4, 5, 6, 8, 10].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setRegForm({ ...regForm, dailyTargetHours: hrs })}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        Number(regForm.dailyTargetHours) === hrs 
                          ? 'bg-vital-spark text-white shadow-xs' 
                          : 'bg-[#272a3c] border border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {hrs}h
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
                    className="px-5 py-3 rounded-full border border-white/20 bg-transparent text-white font-bold text-xs hover:bg-white/10 cursor-pointer"
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
                      className="px-4 py-3 rounded-full bg-[#202332] hover:bg-white/10 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>Next: Topics</span>
                      <ArrowRight className="w-3.5 h-3.5 text-calm-awakening" />
                    </button>
                    <button
                      type="button"
                      onClick={finalizeProfileUpdate}
                      disabled={isSubmitting}
                      className="flex-1 bg-[#4E7678] hover:bg-[#436769] text-white font-bold py-3 px-5 rounded-full shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <span>Save Changes</span>
                      <Check className="w-4 h-4 text-white" />
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#4E7678] hover:bg-[#436769] text-white font-bold py-3.5 px-6 rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                  >
                    <span>Next: Add Subjects & Topics</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              {/* Account Deletion (Only in Edit mode) */}
              {isEditing && onDeleteAccount && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="p-3 rounded-2xl border border-vital-spark/40 bg-vital-spark/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">Permanently Delete Account</p>
                      <p className="text-[10px] text-white/70 mt-0.5 font-medium">Erase your profile, tasks, availability, and AI timetables.</p>
                    </div>
                    <button
                      type="button"
                      onClick={onDeleteAccount}
                      className="px-3.5 py-1.5 rounded-full bg-vital-spark text-white text-xs font-bold hover:bg-vital-spark/80 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
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
            <div className="space-y-4.5">
              
              {/* Header info for Step 2 */}
              <div className="p-3 rounded-2xl bg-[#202332] border border-white/10 flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-vital-spark shrink-0" />
                  <span className="font-medium text-[11px] text-calm-awakening">Manage courses & topics to cover this term.</span>
                </div>
                <span className="font-bold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 text-white text-[10px] shrink-0">
                  {subjects.length} Subjects · {totalChaptersCount} Topics
                </span>
              </div>

              {/* Subject Tabs & Adder */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-white/90">
                  1. Your Course Subjects & Priorities
                </label>

                {/* Subject Adder Input with Priority Selector */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); } }}
                    placeholder="Course subject (e.g. Mathematics, Physics)..."
                    className="w-full sm:flex-1 bg-[#202332] border border-white/15 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-calm-awakening font-medium"
                  />

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={newSubjectPriority}
                      onChange={(e) => setNewSubjectPriority(e.target.value)}
                      className="bg-[#202332] border border-white/15 rounded-full px-3 py-2.5 text-xs font-bold text-white focus:outline-none cursor-pointer"
                      title="Subject Priority"
                    >
                      <option value="High">🔥 High</option>
                      <option value="Medium">⚡ Med</option>
                      <option value="Low">🌱 Low</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="px-4 py-2.5 rounded-full bg-[#4E7678] hover:bg-[#436769] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Subject Selection Pills with Clickable Priority Badges */}
                {subjects.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#202332] border border-dashed border-white/20 text-center text-xs text-calm-awakening space-y-1">
                    <p className="font-bold text-white">No subjects added yet</p>
                    <p className="text-[10px] text-calm-awakening font-medium">Type a course name above and click "Add".</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                    {subjects.map((s) => {
                      const isActive = activeSubjectId === s.id;
                      const priorityBadge = s.priority === 'High' 
                        ? 'bg-vital-spark text-white'
                        : s.priority === 'Low'
                        ? 'bg-calm-awakening/20 text-calm-awakening'
                        : 'bg-white/20 text-white';

                      return (
                        <div
                          key={s.id}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer border ${
                            isActive
                              ? 'bg-[#35394e] text-white border-vital-spark shadow-xs'
                              : 'bg-[#202332] text-white/80 border-white/10 hover:border-white/30'
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

                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-vital-spark text-white' : 'bg-white/10 text-white'}`}>
                            {s.chapters.length}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveSubject(s.id); }}
                            className="hover:text-vital-spark transition-colors text-white/50"
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
                <div className="p-3.5 rounded-2xl bg-[#202332] border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-calm-awakening" />
                      <span className="text-xs font-bold text-white">
                        Topics for <strong className="font-extrabold text-vital-spark">{subjects.find(s => s.id === activeSubjectId)?.name}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSortChaptersByPriority(activeSubjectId)}
                        className="text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full border border-white/15 transition-all flex items-center gap-1 cursor-pointer"
                        title="Sort topics by priority (High to Low)"
                      >
                        <Zap className="w-3 h-3 text-vital-spark" />
                        <span>Sort Priority</span>
                      </button>
                      <span className="text-[10px] font-bold text-calm-awakening bg-white/5 px-2 py-0.5 rounded-full">
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
                      placeholder="Chapter / Topic name..."
                      className="w-full sm:flex-1 bg-[#272a3c] border border-white/15 rounded-full px-3.5 py-2 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-calm-awakening font-medium"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={newChapterPriority}
                        onChange={(e) => setNewChapterPriority(e.target.value)}
                        className="bg-[#272a3c] border border-white/15 rounded-full px-3 py-2 text-xs font-bold text-white focus:outline-none cursor-pointer"
                      >
                        <option value="High">🔥 High</option>
                        <option value="Medium">⚡ Med</option>
                        <option value="Low">🌱 Low</option>
                      </select>

                      <select
                        value={newChapterDifficulty}
                        onChange={(e) => setNewChapterDifficulty(e.target.value)}
                        className="bg-[#272a3c] border border-white/15 rounded-full px-3 py-2 text-xs font-bold text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Easy">🟢 Easy</option>
                        <option value="Medium">🟡 Med</option>
                        <option value="Hard">🔴 Hard</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleAddChapter}
                        className="px-3.5 py-2 rounded-full bg-[#4E7678] hover:bg-[#436769] text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Chapters List with Interactive Priority Badges */}
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto dark-scrollbar pr-1">
                    {(subjects.find(s => s.id === activeSubjectId)?.chapters || []).length === 0 ? (
                      <p className="text-xs text-calm-awakening text-center py-2.5 font-medium">No chapters added yet for this subject.</p>
                    ) : (
                      (subjects.find(s => s.id === activeSubjectId)?.chapters || []).map((ch) => {
                        const priorityStyle = ch.priority === 'High'
                          ? 'bg-vital-spark text-white font-extrabold'
                          : ch.priority === 'Low'
                          ? 'bg-calm-awakening/20 text-calm-awakening font-bold'
                          : 'bg-white/20 text-white font-bold';

                        return (
                          <div key={ch.id} className="p-2.5 rounded-2xl bg-[#272a3c] border border-white/10 flex items-center justify-between text-xs hover:border-white/25 transition-all">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${ch.difficulty === 'Hard' ? 'bg-vital-spark' : ch.difficulty === 'Medium' ? 'bg-calm-awakening' : 'bg-green-400'}`} />
                              <span className="font-bold text-white truncate">{ch.name}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleChapterPriority(activeSubjectId, ch.id)}
                                className={`text-[9.5px] px-2 py-0.5 rounded-md cursor-pointer transition-transform active:scale-90 ${priorityStyle}`}
                                title="Click to cycle priority"
                              >
                                {ch.priority === 'High' ? '🔥 High' : ch.priority === 'Low' ? '🌱 Low' : '⚡ Med'}
                              </button>

                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white`}>
                                {ch.difficulty}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemoveChapter(activeSubjectId, ch.id)}
                                className="text-white/40 hover:text-vital-spark transition-colors cursor-pointer"
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
                  className="px-5 py-3 rounded-full border border-white/20 bg-transparent text-white font-bold text-xs hover:bg-white/10 cursor-pointer"
                >
                  Back
                </button>

                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setRegStep(3)}
                      className="px-4 py-3 rounded-full bg-[#202332] hover:bg-white/10 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>Next: Hours</span>
                      <ArrowRight className="w-3.5 h-3.5 text-calm-awakening" />
                    </button>
                    <button
                      type="button"
                      onClick={finalizeProfileUpdate}
                      disabled={isSubmitting}
                      className="flex-1 bg-[#4E7678] hover:bg-[#436769] text-white font-bold py-3 px-5 rounded-full shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <span>Save Changes</span>
                      <Check className="w-4 h-4 text-white" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRegStep(3)}
                    className="flex-1 bg-[#4E7678] hover:bg-[#436769] text-white font-bold py-3.5 px-6 rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                  >
                    <span>Next: Set Study Hours</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ---------------- STEP 3: WEEKLY STUDY HOURS & AVAILABILITY ---------------- */}
          {((mode === 'register' && regStep === 3) || (isEditing && regStep === 3)) && (
            <div className="space-y-4.5">
              
              {/* Presets Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white/90">
                    Weekly Study Hours Grid
                  </label>
                  <span className="text-[11px] font-medium text-calm-awakening">
                    Click cells to toggle slots
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => applyAvailabilityPreset("evenings")}
                    className="px-3 py-1.5 rounded-full bg-[#202332] hover:bg-white/10 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    🌙 Evenings & Weekends
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAvailabilityPreset("mornings")}
                    className="px-3 py-1.5 rounded-full bg-[#202332] hover:bg-white/10 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    ☀️ Mornings (8am–12pm)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAvailabilityPreset("fullday")}
                    className="px-3 py-1.5 rounded-full bg-[#4E7678] hover:bg-[#436769] text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    ⚡ Full Day
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAvailabilityPreset("clear")}
                    className="px-3 py-1.5 rounded-full bg-[#202332] hover:bg-white/10 border border-white/15 text-xs font-bold text-white/70 transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    🔄 Clear
                  </button>
                </div>
              </div>

              {/* Goal vs Availability calculation card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-[#202332] border border-white/10 flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-vital-spark shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-white">Daily: {regForm.dailyTargetHours || 4}h</span>
                    <span className="text-calm-awakening block text-[10px] font-medium">Target: ~{(regForm.dailyTargetHours || 4) * 7}h/wk</span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#202332] border border-white/10 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-calm-awakening shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-white">Configured: {totalWeeklyStudyHours}h / wk</span>
                    <span className="text-calm-awakening block text-[10px] font-medium">
                      {totalWeeklyStudyHours >= (regForm.dailyTargetHours || 4) * 5 
                        ? '✓ Target Achievable' 
                        : `💡 Add ${(regForm.dailyTargetHours || 4) * 6 - totalWeeklyStudyHours}h`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Availability Mini Grid */}
              <div className="p-3.5 rounded-2xl bg-[#202332] border border-white/10 space-y-2 overflow-x-auto dark-scrollbar">
                <div className="min-w-[440px] space-y-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const daySlots = availability[d] || [];
                    return (
                      <div key={d} className="flex items-center gap-2">
                        <div className="w-12 text-xs font-bold text-white shrink-0 flex items-center justify-between pr-1">
                          <span>{d}</span>
                          <span className="text-[10px] text-calm-awakening font-medium">{daySlots.length}h</span>
                        </div>
                        <div className="flex items-center gap-1 flex-1 flex-wrap">
                          {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((h) => {
                            const isFree = daySlots.includes(h);
                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => toggleSlot(d, h)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  isFree 
                                    ? 'bg-vital-spark text-white border border-vital-spark shadow-xs' 
                                    : 'bg-[#272a3c] border border-white/10 text-white/60 hover:border-white/30'
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
              <div className="p-3 rounded-2xl bg-[#202332] border border-white/10 flex items-center gap-2 text-xs text-white/90 font-medium">
                <Sparkles className="w-4 h-4 text-vital-spark shrink-0" />
                <span className="text-[11px] leading-relaxed">The AI scheduler will place study sessions for <strong className="font-bold text-white">{totalChaptersCount} topics</strong> across your <strong className="font-bold text-white">{totalWeeklyStudyHours} free hours</strong> without collisions.</span>
              </div>

              {/* Stepper Navigation Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRegStep(2)}
                  className="px-5 py-3 rounded-full border border-white/20 bg-transparent text-white font-bold text-xs hover:bg-white/10 cursor-pointer"
                >
                  Back
                </button>
                
                {isEditing ? (
                  <button
                    type="button"
                    onClick={finalizeProfileUpdate}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#4E7678] hover:bg-[#436769] text-white font-bold py-3.5 px-6 rounded-full shadow-md flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Save All Changes</span>
                        <Sparkles className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalRegisterSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#4E7678] hover:bg-[#436769] text-white font-bold py-3.5 px-6 rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Generate My Schedule & Finish</span>
                        <Sparkles className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Section: Footer Links matching Reference Image */}
        <div className={`relative z-10 w-full ${mode === 'login' && !isEditing ? 'max-w-[430px]' : 'max-w-[500px]'} mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-calm-awakening font-medium`}>
          <button 
            type="button" 
            onClick={() => alert("Terms and Services: Be.study Planner ensures your student data and study habits remain encrypted locally.")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Terms and Services
          </button>
          <div className="flex items-center gap-1">
            <span>Have a problem? Contact us at</span>
            <a 
              href="mailto:support@bestudy.edu" 
              className="text-white hover:text-vital-spark font-bold transition-colors underline"
            >
              support@bestudy.edu
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}
