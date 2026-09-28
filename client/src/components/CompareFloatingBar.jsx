import React from 'react';
import { useApp } from '../context/AppContext';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';

export default function CompareFloatingBar() {
  const { compareList, removeFromCompare, clearCompare, navigate, currentPage } = useApp();

  if (compareList.length === 0 || currentPage === 'compare') {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 backdrop-blur-lg">
        
        {/* Left: Selected messes preview */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-[65%]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 shrink-0">
            <Scale className="w-4 h-4" />
            <span className="hidden xs:inline">Compare</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full text-[11px]">
              {compareList.length}/3
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {compareList.map((mess) => (
              <div 
                key={mess.id}
                className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
              >
                <span className="max-w-[100px] truncate font-medium">{mess.name}</span>
                <button
                  onClick={() => removeFromCompare(mess.id)}
                  className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearCompare}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('compare')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <span>Compare Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
