import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MessCard from '../components/MessCard';
import { 
  Search, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  UtensilsCrossed, 
  ChevronRight,
  Coffee,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

export default function HomePage() {
  const { navigate, globalSearch, setGlobalSearch } = useApp();
  const [popularMesses, setPopularMesses] = useState([]);
  const [stats, setStats] = useState({ totalMesses: 8, avgWaitTime: 8, totalReviews: 840, activePasses: 12 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetch('/api/messes/popular')
      .then((res) => res.json())
      .then((data) => {
        setPopularMesses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching popular messes:', err);
        setLoading(false);
      });

    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Error fetching stats:', err));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setGlobalSearch(searchInput.trim());
      navigate('find', { search: searchInput.trim() });
    } else {
      navigate('find');
    }
  };

  const handleQuickFilter = (type, val) => {
    if (type === 'maxWait') {
      navigate('find', { maxWait: val });
    } else if (type === 'foodType') {
      navigate('find', { foodType: val });
    } else if (type === 'maxPrice') {
      navigate('find', { maxPrice: val });
    }
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Urgent Student Problem Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold mb-6 shadow-xs animate-in fade-in duration-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>Short 40-Min Lunch Break? Beat The Queue.</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Find the right mess in <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy decoration-2">seconds</span>, not 20 minutes.
          </h1>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            QuickMess gives college students instant access to live menus, student prices, current crowd levels, and queue wait times around campus.
          </p>

          {/* Quick Search Box */}
          <form 
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full flex items-center pl-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by mess name, today's special dish, or gate..."
                className="w-full pl-3 pr-4 py-2.5 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Search Mess</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Filter Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600">
            <span className="text-slate-400 font-semibold">Quick picks:</span>
            <button
              onClick={() => handleQuickFilter('maxWait', '5')}
              className="px-3 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>&lt; 5m Wait (Instant)</span>
            </button>
            <button
              onClick={() => handleQuickFilter('foodType', 'Pure Veg')}
              className="px-3 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Pure Veg</span>
            </button>
            <button
              onClick={() => handleQuickFilter('maxPrice', '80')}
              className="px-3 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition-colors shadow-2xs"
            >
              ₹ Under ₹80 (Budget)
            </button>
            <button
              onClick={() => handleQuickFilter('foodType', 'South Indian')}
              className="px-3 py-1 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition-colors shadow-2xs"
            >
              🍛 South Indian Meals
            </button>
          </div>

          {/* Live Campus Queue & Crowd Bar */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xs text-left">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Campus Messes</span>
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalMesses} Active</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified daily menus</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xs text-left">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Wait Time</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600">~{stats.avgWaitTime} mins</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all food counters</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xs text-left">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Student Reviews</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalReviews}+</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Genuine student ratings</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xs text-left">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Passes Confirmed</span>
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600">{stats.activePasses}+ Today</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Skipped the long queue</p>
            </div>
          </div>

        </div>
      </section>

      {/* Popular & Nearby Messes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Campus Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular Messes Near Campus
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Ranked by student ratings, meal freshness, and shortest waiting queues.
            </p>
          </div>

          <button
            onClick={() => navigate('find')}
            className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 group cursor-pointer"
          >
            <span>View All Messes</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Mess Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularMesses.map((mess) => (
              <MessCard key={mess.id} mess={mess} />
            ))}
          </div>
        )}
      </section>

      {/* How It Saves Your Break (3-Step Feature Banner) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                How QuickMess Works
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mt-3 text-white tracking-tight">
                Save 25 Minutes of Your Lunch Break
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                No more wandering in the hot sun or standing in line only to find out your favorite item is finished.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg mb-4">
                  1
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Check Live Queue & Menu</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Before stepping out of your classroom, see which mess has Low crowd (&lt;5 mins) and check today’s special thali.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 relative">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg mb-4">
                  2
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Compare 2–3 Messes</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Can't decide between Annapurna or Sai Sagar? Compare prices, items, crowd level, and walking distance side-by-side in one table.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 relative">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-black text-lg mb-4">
                  3
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Confirm Your Lunch Pass</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate your instant digital lunch pass token. Walk straight to the counter and enjoy hot rotis with zero guesswork!
                </p>
              </div>
            </div>

            {/* CTA in banner */}
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('find')}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-900 font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Explore All College Messes Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
