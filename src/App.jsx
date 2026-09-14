import React, { useState, useEffect } from 'react';
import StudentPlanner from './StudentPlanner';
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
    const updated = {
      ...accounts,
      [username]: {
        ...newAccountData,
        username,
        plannerData: null
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
    if (window.confirm(`Are you sure you want to sign out, ${currentUser?.profile?.name || 'Student'}? Your saved timetable, tasks, and topics are preserved securely.`)) {
      setActiveUsername(null);
      setIsEditingProfile(false);
      try {
        localStorage.removeItem(ACTIVE_USER_KEY);
      } catch (e) {}
    }
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
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
