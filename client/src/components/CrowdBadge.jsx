import React from 'react';
import { Users, Clock, Flame } from 'lucide-react';

export default function CrowdBadge({ level = 'Low', waitTime = 5, size = 'md', showWait = true }) {
  const isLow = level === 'Low';
  const isModerate = level === 'Moderate';
  const isHigh = level === 'High';

  const badgeStyles = {
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    Moderate: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20',
    High: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20'
  }[level] || 'bg-slate-100 text-slate-700 border-slate-200';

  const dotColors = {
    Low: 'bg-emerald-500',
    Moderate: 'bg-amber-500',
    High: 'bg-rose-500'
  }[level] || 'bg-slate-400';

  const textLabel = {
    Low: 'Low Crowd',
    Moderate: 'Moderate Rush',
    High: 'Heavy Rush'
  }[level] || level;

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyles}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors} animate-pulse`} />
        {textLabel}
        {showWait && waitTime !== undefined && (
          <span className="opacity-80 border-l border-current/20 pl-1 ml-0.5">
            ~{waitTime}m
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border shadow-xs ${badgeStyles}`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColors}`} />
      </span>
      <span>{textLabel}</span>
      {showWait && waitTime !== undefined && (
        <span className="flex items-center gap-1 font-medium pl-1.5 border-l border-current/20">
          <Clock className="w-3.5 h-3.5" />
          <span>{waitTime} min wait</span>
        </span>
      )}
    </div>
  );
}
