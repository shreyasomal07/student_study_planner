import React, { useState } from 'react';
import { 
  User, 
  GraduationCap, 
  LogOut, 
  Edit3, 
  Clock, 
  Flame, 
  Sparkles, 
  Calendar, 
  ChevronDown 
} from 'lucide-react';

export default function UserProfileHeader({ userProfile, onEditProfile, onSignOut }) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (!userProfile) return null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 backdrop-blur-md bg-slate-900/95 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Brand & Personalized greeting */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-base shadow-md shadow-indigo-500/20">
            {userProfile.avatar || '🎓'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                Hi, {userProfile.name}!
                <span className="text-xs">👋</span>
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {userProfile.summaryTag || userProfile.levelTitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xs:block">
              {userProfile.studying === 'higher_studies' && userProfile.yearLabel
                ? `${userProfile.yearLabel}${userProfile.courseName ? ` • ${userProfile.courseName}` : ''}`
                : userProfile.levelTitle}
              {userProfile.age ? ` • Age ${userProfile.age}` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls & Profile details */}
        <div className="flex items-center gap-2 relative">
          
          {/* Target Hours Badge */}
          {userProfile.dailyTargetHours && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Goal: <strong>{userProfile.dailyTargetHours}h/day</strong></span>
            </div>
          )}

          {/* Edit Profile Button */}
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            title="Edit your student details"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>

          {/* Sign Out / Switch Profile Button */}
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            title="Sign out or switch user"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
