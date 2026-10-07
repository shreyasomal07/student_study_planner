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
    <header className="bg-[#B4C6A6] border-b border-[#B4C6A6] text-theme-text sticky top-0 z-40 backdrop-blur-md bg-[#B4C6A6]/95 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Brand & Personalized greeting */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-theme-accent-green to-theme-accent-green text-theme-text font-bold text-base shadow-md shadow-theme-accent-green/20">
            {userProfile.avatar || '🎓'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-theme-text tracking-tight flex items-center gap-1.5">
                Hi, {userProfile.name}!
                <span className="text-xs">👋</span>
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-theme-accent-green/20 text-theme-border border border-theme-accent-green/30">
                {userProfile.summaryTag || userProfile.levelTitle}
              </span>
            </div>
            <p className="text-[11px] text-theme-border hidden xs:block">
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
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#B4C6A6]/80 border border-theme-muted/60 text-xs font-medium text-theme-border">
              <Flame className="w-3.5 h-3.5 text-theme-border" />
              <span>Goal: <strong>{userProfile.dailyTargetHours}h/day</strong></span>
            </div>
          )}

          {/* Edit Profile Button */}
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B4C6A6] hover:bg-theme-muted border border-theme-muted text-theme-bg text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            title="Edit your student details"
          >
            <Edit3 className="w-3.5 h-3.5 text-theme-border" />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>

          {/* Sign Out / Switch Profile Button */}
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-accent-green/10 hover:bg-theme-accent-green/20 border border-theme-accent-green/20 hover:border-theme-accent-green/40 text-theme-border text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
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
