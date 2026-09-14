import React, { useState, useEffect } from 'react';
import StudentPlanner, { generateTimetable, startOfWeek } from './StudentPlanner';
import SignIn from './components/SignIn';

const ACCOUNTS_KEY = 'study_planner_registered_accounts_v2';
const ACTIVE_USER_KEY = 'study_planner_active_session_v2';

export default function App() {
  // Load all registered student accounts
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_KEY);
      if (saved) return JSON.parse(saved);

      // Check for previous legacy profile to migrate smoothly
      const legacyProfile = localStorage.getItem('student_study_planner_user_profile');
      if (legacyProfile) {
        const parsed = JSON.parse(legacyProfile);
        const autoUsername = (parsed.name || 'student').toLowerCase().replace(/\s+/g, '_');
        const legacyAccount = {
          username: autoUsername,
          password: 'password123',
          profile: parsed,
          plannerData: null
        };
        const initialMap = { [autoUsername]: legacyAccount };
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(initialMap));
        return initialMap;
      }
      return {};
    } catch (e) {
      console.error('Failed to load accounts', e);
      return {};
    }
  });

  // Load currently active logged-in user
  const [activeUsername, setActiveUsername] = useState(() => {
    try {
      const active = localStorage.getItem(ACTIVE_USER_KEY);
      return active || null;
    } catch (e) {
      return null;
    }
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const currentUser = activeUsername && accounts[activeUsername] ? accounts[activeUsername] : null;

  // Save accounts map to localStorage whenever it changes
  const persistAccounts = (updatedAccounts) => {
    setAccounts(updatedAccounts);
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
    } catch (e) {
      console.error('Failed to persist accounts', e);
    }
  };

  const handleLogin = (account) => {
    setActiveUsername(account.username);
    try {
      localStorage.setItem(ACTIVE_USER_KEY, account.username);
    } catch (e) {}
  };

  const handleRegister = (newAccountData) => {
    const username = newAccountData.username.toLowerCase();
    
    let initialPlannerData = null;
    if (newAccountData.topics && newAccountData.topics.length > 0) {
      const defaultAvail = {
        Mon: [8, 9, 17, 18, 19, 20],
        Tue: [17, 18, 19, 20],
        Wed: [8, 9, 17, 18, 19, 20],
        Thu: [17, 18, 19, 20],
        Fri: [17, 18, 19, 20],
        Sat: [9, 10, 11, 12, 13, 14, 15],
        Sun: [9, 10, 11, 12, 13, 14, 15],
      };
      const avail = newAccountData.availability || defaultAvail;
      const tasks = newAccountData.tasks || [];
      const topics = newAccountData.topics || [];
      const generatedTimetable = generateTimetable(
        tasks,
        topics,
        avail,
        startOfWeek(new Date()),
        [],
        []
      );
      initialPlannerData = {
        tasks,
        topics,
        availability: avail,
        timetable: generatedTimetable,
        collegeSchedule: [],
        examSchedule: [],
        lastGenerated: new Date().toISOString()
      };
    }

    const updated = {
      ...accounts,
      [username]: {
        ...newAccountData,
        username,
        plannerData: initialPlannerData
      }
    };
    persistAccounts(updated);
    setActiveUsername(username);
    try {
      localStorage.setItem(ACTIVE_USER_KEY, username);
    } catch (e) {}
  };

  const handleUpdateProfile = (profileData) => {
    if (!currentUser) return;
    const updated = {
      ...accounts,
      [currentUser.username]: {
        ...currentUser,
        profile: {
          ...currentUser.profile,
          ...profileData
        }
      }
    };
    persistAccounts(updated);
    setIsEditingProfile(false);
  };

  const handleSavePlannerData = React.useCallback((data) => {
    try {
      const active = localStorage.getItem(ACTIVE_USER_KEY);
      if (!active) return;
      const saved = localStorage.getItem(ACCOUNTS_KEY);
      const map = saved ? JSON.parse(saved) : {};
      if (map[active]) {
        map[active].plannerData = data;
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
      }
    } catch (e) {
      console.error('Failed to persist planner data', e);
    }
  }, []);

  const handleSignOut = () => {
    setActiveUsername(null);
    setIsEditingProfile(false);
    try {
      localStorage.removeItem(ACTIVE_USER_KEY);
    } catch (e) {}
  };

  const handleDeleteAccount = (usernameToDelete = null) => {
    const target = usernameToDelete || currentUser?.username;
    if (!target || !accounts[target]) return;

    const targetName = accounts[target]?.profile?.name || target;
    if (window.confirm(`⚠️ Are you sure you want to permanently delete the profile for "${targetName}" (@${target})?\n\nAll saved tasks, study topics, availability, and AI timetables will be permanently erased. This action cannot be undone.`)) {
      const updated = { ...accounts };
      delete updated[target];
      persistAccounts(updated);

      if (activeUsername === target) {
        setActiveUsername(null);
        setIsEditingProfile(false);
        try {
          localStorage.removeItem(ACTIVE_USER_KEY);
        } catch (e) {}
      }
    }
  };

  // If not logged in or editing profile, show the SignIn / Register / Edit Screen
  if (!currentUser || isEditingProfile) {
    return (
      <SignIn
        onLogin={handleLogin}
        onRegister={handleRegister}
        existingAccounts={accounts}
        initialData={isEditingProfile ? currentUser?.profile : null}
        isEditing={isEditingProfile}
        onUpdateProfile={handleUpdateProfile}
        onDeleteAccount={() => handleDeleteAccount(currentUser?.username)}
        onDeleteSavedAccount={(uname) => handleDeleteAccount(uname)}
        onCancelEdit={() => setIsEditingProfile(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#EBE6DF] text-[#1E2024] font-sans antialiased p-3 sm:p-5 lg:p-7 flex items-center justify-center">
      <StudentPlanner
        userProfile={currentUser.profile}
        savedPlannerData={currentUser.plannerData}
        onSavePlannerData={handleSavePlannerData}
        onEditProfile={() => setIsEditingProfile(true)}
        onDeleteProfile={() => handleDeleteAccount(currentUser.username)}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
