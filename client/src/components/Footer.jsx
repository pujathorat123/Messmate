import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Clock, ShieldCheck, Heart, MapPin, Sparkles } from 'lucide-react';

export default function Footer() {
  const { navigate } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Quick<span className="text-emerald-400">Mess</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Designed specifically for students on tight lecture breaks. Check live menus, price, crowd levels and estimated queue wait times before walking out of class.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Mess Menus</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Clock className="w-4 h-4" />
                <span>Real-time Queue Meter</span>
              </div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button 
                  onClick={() => navigate('home')} 
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Home Overview
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('find')} 
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Find Mess Directory
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('compare')} 
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Side-by-Side Comparison
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('reviews')} 
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Student Reviews & Ratings
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('confirm')} 
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  My Lunch Pass
                </button>
              </li>
            </ul>
          </div>

          {/* Campus Rush Tips */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Campus Break Tips</span>
            </h4>
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 text-xs space-y-2 text-slate-300">
              <p>
                <strong className="text-amber-400">Peak Rush Hour:</strong> 1:15 PM – 1:50 PM.
              </p>
              <p>
                Confirm your mess on QuickMess at <strong>1:05 PM</strong> to reach before the bell crowd arrives.
              </p>
              <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Coverage: 500m radius around campus gates</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} QuickMess. Engineered for college breaks.</p>
          <div className="flex items-center gap-1">
            <span>Built with care for hungry students</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
