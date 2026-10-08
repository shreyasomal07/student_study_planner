import React, { useState, useEffect, useCallback, useRef } from 'react';
import StudentPlanner, { generateTimetable, startOfWeek } from './StudentPlanner';
import SignIn from './components/SignIn';
import { api, getToken } from './services/api';

const ACCOUNTS_KEY = 'study_planner_registered_accounts_v2';
const ACTIVE_USER_KEY = 'study_planner_active_session_v2';

export default function App() {
  // Synchronously load saved local accounts for instant initial render
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_KEY);
      if (saved) return JSON.parse(saved);
      return {};
    } catch (e) {
      return {};
    }
  });

  // Synchronously load active user for instant initial render
  const [activeUsername, setActiveUsername] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_USER_KEY) || null;
    } catch (e) {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const active = localStorage.getItem(ACTIVE_USER_KEY);
      const saved = localStorage.getItem(ACCOUNTS_KEY);
      const map = saved ? JSON.parse(saved) : {};
      if (active && map[active]) {
        return map[active];
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [syncStatus, setSyncStatus] = useState('synced');
  const saveTimeoutRef = useRef(null);

  // Background sync with backend SQLite
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      let localAccounts = {};
      try {
        const saved = localStorage.getItem(ACCOUNTS_KEY);
        if (saved) localAccounts = JSON.parse(saved);
      } catch (e) {}

      try {
        const health = await api.checkHealth();
        if (health && health.status === 'online') {
          if (isMounted) setBackendStatus('connected');

          // Sync legacy local storage accounts if needed
          if (Object.keys(localAccounts).length > 0) {
            try {
              await api.syncLegacyAccounts(localAccounts);
            } catch (e) {
              console.warn('Sync legacy warning:', e);
            }
          }

          // Fetch fresh list of users from SQLite
          const serverUsers = await api.getAllUsers();
          if (isMounted && serverUsers && Object.keys(serverUsers).length > 0) {
            setAccounts(serverUsers);
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(serverUsers));

            // Check if active user exists in server users
            const active = localStorage.getItem(ACTIVE_USER_KEY);
            if (active && serverUsers[active]) {
              setCurrentUser(serverUsers[active]);
            }
          }

          // Check token session
          const token = getToken();
          if (token) {
            try {
              const me = await api.getMe();
              if (isMounted && me && me.user) {
                const updatedObj = {
                  username: me.user.username,
                  profile: me.user,
                  plannerData: me.plannerData || {}
                };
                setCurrentUser(updatedObj);
                setActiveUsername(me.user.username);
                localStorage.setItem(ACTIVE_USER_KEY, me.user.username);
              }
            } catch (err) {
              console.warn('Token validation failed, staying with local state');
            }
          }
        } else {
          if (isMounted) setBackendStatus('offline');
        }
      } catch (err) {
        if (isMounted) setBackendStatus('offline');
      }
    }

    syncWithBackend();
    return () => { isMounted = false; };
  }, []);

  // Save accounts to local cache
  const persistLocalAccounts = (updatedAccounts) => {
    setAccounts(updatedAccounts);
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
    } catch (e) {
      console.error('Failed to persist accounts cache', e);
    }
  };

  // Sign in handler
  const handleLogin = async (loginCredentials) => {
    const u = loginCredentials.username.trim().toLowerCase();
    
    // Try FastAPI backend login
    try {
      const res = await api.login(u, loginCredentials.password);
      if (res && res.user) {
        const userObj = {
          username: res.user.username,
          profile: res.user,
          plannerData: res.plannerData
        };
        setCurrentUser(userObj);
        setActiveUsername(u);
        localStorage.setItem(ACTIVE_USER_KEY, u);

        const updated = { ...accounts, [u]: userObj };
        persistLocalAccounts(updated);
        setBackendStatus('connected');
        return;
      }
    } catch (err) {
      // If offline or network error, fallback to local storage authentication
      if (accounts[u] && accounts[u].password === loginCredentials.password) {
        setCurrentUser(accounts[u]);
        setActiveUsername(u);
        localStorage.setItem(ACTIVE_USER_KEY, u);
        return;
      }
      throw err;
    }
  };

  // Register handler
  const handleRegister = async (newAccountData) => {
    const username = newAccountData.username.toLowerCase();
    
    const defaultAvail = {
      Mon: [17, 18, 19, 20],
      Tue: [17, 18, 19, 20],
      Wed: [17, 18, 19, 20],
      Thu: [17, 18, 19, 20],
      Fri: [17, 18, 19, 20],
      Sat: [10, 11, 12, 13, 14, 15],
      Sun: [10, 11, 12, 13, 14, 15],
    };
    const avail = newAccountData.availability || defaultAvail;
    const tasks = newAccountData.tasks || [];
    const topics = newAccountData.topics || [];
    const generatedTimetable = topics.length > 0 ? generateTimetable(
      tasks,
      topics,
      avail,
      startOfWeek(new Date()),
      [],
      []
    ) : [];

    const initialPlannerData = {
      tasks: tasks,
      topics: topics,
      availability: avail,
      timetable: generatedTimetable,
      collegeSchedule: [],
      examSchedule: [],
      events: [],
      lastGenerated: new Date().toISOString(),
      dashboardTodos: [
        { id: "td-1", text: "Review lecture slides and summary notes for next class", completed: false, priority: "High", tag: "Revision", createdAt: new Date().toISOString() },
        { id: "td-2", text: "Organize assignment references and draft outline", completed: false, priority: "Medium", tag: "Assignment", createdAt: new Date().toISOString() },
        { id: "td-3", text: "Set up 25-minute Pomodoro study sprint for today", completed: true, priority: "Low", tag: "Quick Task", createdAt: new Date().toISOString() }
      ],
      dashboardNotes: [
        {
          id: "nt-1",
          title: " Quick Study Rule",
          content: "Pomodoro Focus: 25 mins deep study + 5 mins break. Active recall beats re-reading.",
          color: "yellow",
          tag: "Study Tip",
          isPinned: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "nt-2",
          title: "📌 Portal & Datesheet Check",
          content: "Check college LMS portal every Monday for updated syllabus and submission links.",
          color: "purple",
          tag: "Reminder",
          isPinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      dashboardScratchpad: ""
    };

    const registerPayload = {
      username: username,
      password: newAccountData.password,
      name: newAccountData.name || newAccountData.profile?.name || username,
      age: newAccountData.age || newAccountData.profile?.age || '',
      studying: newAccountData.studying || newAccountData.profile?.studying || 'higher_studies',
      collegeYear: newAccountData.collegeYear || newAccountData.profile?.collegeYear || '2nd_year',
      courseName: newAccountData.courseName || newAccountData.profile?.courseName || '',
      avatar: newAccountData.avatar || newAccountData.profile?.avatar || '🎓',
      dailyTargetHours: Number(newAccountData.dailyTargetHours || newAccountData.profile?.dailyTargetHours || 4),
      availability: avail,
      topics: topics,
      plannerData: initialPlannerData
    };

    try {
      const res = await api.register(registerPayload);
      const userObj = {
        username: res.user.username,
        profile: res.user,
        plannerData: res.plannerData
      };
      setCurrentUser(userObj);
      setActiveUsername(username);
      localStorage.setItem(ACTIVE_USER_KEY, username);

      const updated = { ...accounts, [username]: userObj };
      persistLocalAccounts(updated);
      setBackendStatus('connected');
    } catch (err) {
      // Fallback to local registration if backend offline
      const userObj = {
        ...newAccountData,
        username,
        profile: registerPayload,
        plannerData: initialPlannerData
      };
      const updated = { ...accounts, [username]: userObj };
      persistLocalAccounts(updated);
      setCurrentUser(userObj);
      setActiveUsername(username);
      localStorage.setItem(ACTIVE_USER_KEY, username);
    }
  };

  // Update profile, subjects/topics, and weekly study hours
  const handleUpdateProfile = async (updateData) => {
    if (!currentUser) return;
    const username = currentUser.username;

    const profileData = updateData.profile || updateData;
    const updatedTopics = updateData.topics !== undefined ? updateData.topics : (currentUser.plannerData?.topics || []);
    const updatedAvailability = updateData.availability !== undefined ? updateData.availability : (currentUser.plannerData?.availability || {});

    // Regenerate weekly timetable if topics or availability changed
    const currentTasks = currentUser.plannerData?.tasks || [];
    const currentCollegeSchedule = currentUser.plannerData?.collegeSchedule || [];
    const currentExamSchedule = currentUser.plannerData?.examSchedule || [];

    const updatedTimetable = generateTimetable(
      currentTasks,
      updatedTopics,
      updatedAvailability,
      startOfWeek(new Date()),
      currentCollegeSchedule,
      currentExamSchedule
    );

    const updatedPlannerData = {
      ...(currentUser.plannerData || {}),
      topics: updatedTopics,
      availability: updatedAvailability,
      timetable: updatedTimetable,
      lastGenerated: new Date().toISOString()
    };

    try {
      const res = await api.updateProfile(profileData);
      const updatedProfile = res.profile || { ...currentUser.profile, ...profileData };
      const updatedUser = {
        ...currentUser,
        profile: updatedProfile,
        plannerData: updatedPlannerData
      };
      setCurrentUser(updatedUser);

      const updatedAccounts = {
        ...accounts,
        [username]: updatedUser
      };
      persistLocalAccounts(updatedAccounts);

      // Persist updated planner data to FastAPI backend
      await api.savePlannerData(updatedPlannerData);
    } catch (err) {
      const updatedUser = {
        ...currentUser,
        profile: { ...currentUser.profile, ...profileData },
        plannerData: updatedPlannerData
      };
      setCurrentUser(updatedUser);
      const updatedAccounts = {
        ...accounts,
        [username]: updatedUser
      };
      persistLocalAccounts(updatedAccounts);
    }
    setIsEditingProfile(false);
  };

  // Sync / Save Planner Data (Tasks, Timetables, Notes, Scratchpad)
  const handleSavePlannerData = useCallback((data) => {
    if (!currentUser) return;
    const username = currentUser.username;

    // Optimistically update currentUser
    setCurrentUser(prev => prev ? { ...prev, plannerData: data } : prev);

    // Save to local cache
    try {
      const saved = localStorage.getItem(ACCOUNTS_KEY);
      const map = saved ? JSON.parse(saved) : {};
      if (map[username]) {
        map[username].plannerData = data;
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
      }
    } catch (e) {}

    // Debounced sync to FastAPI SQLite backend
    setSyncStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.savePlannerData(data);
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Failed to sync planner data to backend:', err);
        setSyncStatus('error');
      }
    }, 600);
  }, [currentUser]);

  // Sign out
  const handleSignOut = () => {
    api.logout();
    setActiveUsername(null);
    setCurrentUser(null);
    setIsEditingProfile(false);
    try {
      localStorage.removeItem(ACTIVE_USER_KEY);
    } catch (e) {}
  };

  // Delete account
  const handleDeleteAccount = async (usernameToDelete = null) => {
    const target = usernameToDelete || currentUser?.username;
    if (!target) return;

    const targetName = accounts[target]?.profile?.name || target;
    if (window.confirm(`️ Are you sure you want to permanently delete the profile for "${targetName}" (@${target})?\n\nAll saved tasks, study topics, availability, and AI timetables will be permanently erased. This action cannot be undone.`)) {
      try {
        await api.deleteAccount(target);
      } catch (e) {
        console.warn('Backend delete warning:', e);
      }

      const updated = { ...accounts };
      delete updated[target];
      persistLocalAccounts(updated);

      if (activeUsername === target || currentUser?.username === target) {
        handleSignOut();
      }
    }
  };

  // Reset password handler
  const handleResetPassword = async ({ username, newPassword }) => {
    const u = username.trim().toLowerCase();
    try {
      const res = await api.resetPassword(u, newPassword);
      if (res && res.user) {
        const userObj = {
          username: res.user.username,
          profile: res.user,
          plannerData: res.plannerData
        };
        setCurrentUser(userObj);
        setActiveUsername(u);
        localStorage.setItem(ACTIVE_USER_KEY, u);

        const updated = {
          ...accounts,
          [u]: {
            ...accounts[u],
            ...userObj,
            password: newPassword
          }
        };
        persistLocalAccounts(updated);
        setBackendStatus('connected');
        return;
      }
    } catch (err) {
      if (accounts[u]) {
        const updated = {
          ...accounts,
          [u]: {
            ...accounts[u],
            password: newPassword
          }
        };
        persistLocalAccounts(updated);
        setCurrentUser(updated[u]);
        setActiveUsername(u);
        localStorage.setItem(ACTIVE_USER_KEY, u);
        return;
      }
      throw err;
    }
  };

  // If not logged in or editing profile, show the SignIn / Register / Edit Screen
  if (!currentUser || isEditingProfile) {
    return (
      <SignIn
        onLogin={handleLogin}
        onRegister={handleRegister}
        onResetPassword={handleResetPassword}
        existingAccounts={accounts}
        initialData={isEditingProfile ? currentUser?.profile : null}
        initialPlannerData={isEditingProfile ? currentUser?.plannerData : null}
        isEditing={isEditingProfile}
        onUpdateProfile={handleUpdateProfile}
        onDeleteAccount={() => handleDeleteAccount(currentUser?.username)}
        onDeleteSavedAccount={(uname) => handleDeleteAccount(uname)}
        onCancelEdit={() => setIsEditingProfile(false)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-wild-light text-liminal-night font-sans antialiased flex flex-col items-stretch selection:bg-vital-spark/30">
      <StudentPlanner
        key={`${currentUser.username}_${currentUser.plannerData?.lastGenerated || ''}_${currentUser.profile?.dailyTargetHours || ''}`}
        userProfile={currentUser.profile || currentUser}
        savedPlannerData={currentUser.plannerData}
        onSavePlannerData={handleSavePlannerData}
        onEditProfile={() => setIsEditingProfile(true)}
        onDeleteProfile={() => handleDeleteAccount(currentUser.username)}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
