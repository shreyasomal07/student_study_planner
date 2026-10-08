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
    <header className="bg-steady-renewal border-b border-rooted-strength/60 text-liminal-night sticky top-0 z-40 backdrop-blur-md shadow-xs">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between gap-4">
        
        {/* Brand & Personalized greeting */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-calm-awakening text-wild-light font-bold text-lg shadow-sm">
            {userProfile.avatar || '🎓'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-base sm:text-lg text-liminal-night tracking-tight flex items-center gap-1.5">
                Hi, {userProfile.name}!
                <span className="text-sm">👋</span>
              </h2>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-calm-awakening/20 text-calm-awakening border border-calm-awakening/30">
                {userProfile.summaryTag || userProfile.levelTitle}
              </span>
            </div>
            <p className="text-[11px] text-liminal-night/70 hidden xs:block font-medium">
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
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-wild-light border border-rooted-strength/50 text-xs font-semibold text-liminal-night shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-vital-spark" />
              <span>Goal: <strong>{userProfile.dailyTargetHours}h/day</strong></span>
            </div>
          )}

          {/* Edit Profile Button */}
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-wild-light hover:bg-steady-renewal border border-rooted-strength text-liminal-night text-xs font-bold transition-all hover:shadow-sm cursor-pointer"
            title="Edit your student details"
          >
            <Edit3 className="w-3.5 h-3.5 text-liminal-night" />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>

          {/* Sign Out / Switch Profile Button */}
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-steady-renewal hover:bg-rooted-strength/30 border border-rooted-strength text-liminal-night text-xs font-bold transition-all hover:shadow-sm cursor-pointer"
            title="Sign out or switch user"
          >
            <LogOut className="w-3.5 h-3.5 text-liminal-night" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
