import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MessCard from '../components/MessCard';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Clock, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Check, 
  Utensils, 
  AlertCircle,
  X
} from 'lucide-react';

export default function FindMessPage() {
  const { pageParams, globalSearch, setGlobalSearch } = useApp();

  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state initialized from query params if present
  const [search, setSearch] = useState(pageParams.search || globalSearch || '');
  const [foodType, setFoodType] = useState(pageParams.foodType || 'all');
  const [maxPrice, setMaxPrice] = useState(pageParams.maxPrice || '');
  const [crowdLevel, setCrowdLevel] = useState(pageParams.crowdLevel || 'all');
  const [maxWait, setMaxWait] = useState(pageParams.maxWait || '');
  const [openOnly, setOpenOnly] = useState(pageParams.openOnly === 'true' || true);
  const [sortBy, setSortBy] = useState('wait_asc'); // Default to shortest wait time for fast student decision!

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch messes with filters
  const fetchMesses = () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (search.trim()) params.append('search', search.trim());
    if (foodType && foodType !== 'all') params.append('foodType', foodType);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (crowdLevel && crowdLevel !== 'all') params.append('crowdLevel', crowdLevel);
    if (maxWait) params.append('maxWait', maxWait);
    if (openOnly) params.append('openOnly', 'true');
    if (sortBy) params.append('sortBy', sortBy);

    fetch(`/api/messes?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setMesses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching messes:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMesses();
  }, [search, foodType, maxPrice, crowdLevel, maxWait, openOnly, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setGlobalSearch('');
    setFoodType('all');
    setMaxPrice('');
    setCrowdLevel('all');
    setMaxWait('');
    setOpenOnly(true);
    setSortBy('wait_asc');
  };

  const hasActiveFilters = search || foodType !== 'all' || maxPrice || crowdLevel !== 'all' || maxWait || !openOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Find College Mess
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Filter by live wait time, crowd, student thali price, and dietary preferences.
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mess, special..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
            >
              <option value="wait_asc">⚡ Shortest Wait Time</option>
              <option value="price_asc">₹ Price: Low to High</option>
              <option value="rating_desc">⭐ Highest Rating</option>
              <option value="distance_asc">📍 Closest to Campus</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Layout: Sidebar Filters + Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Filter Sidebar (and Mobile Drawer) */}
        <aside className={`md:block md:col-span-1 ${mobileFilterOpen ? 'block' : 'hidden'} bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6 sticky top-20`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Filters
              </h3>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* 1. Food Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Food Type
            </label>
            <div className="flex flex-col gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All Cuisines' },
                { id: 'Pure Veg', label: 'Pure Veg (No Onion/Garlic option)' },
                { id: 'Veg & Non-Veg', label: 'Veg & Non-Veg (Chicken/Egg)' },
                { id: 'South Indian', label: 'South Indian Meals' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFoodType(opt.id)}
                  className={`text-left px-3 py-2 rounded-xl transition-colors font-medium flex items-center justify-between ${
                    foodType === opt.id
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {foodType === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Maximum Wait Time */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center justify-between">
              <span>Max Queue Wait</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: '', label: 'Any Wait' },
                { id: '5', label: '⚡ < 5 mins' },
                { id: '10', label: '⏱️ < 10 mins' },
                { id: '15', label: '⌛ < 15 mins' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMaxWait(opt.id)}
                  className={`px-2.5 py-2 rounded-xl text-center font-medium transition-colors border ${
                    maxWait === opt.id
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Crowd Level */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Current Crowd Level
            </label>
            <div className="flex flex-col gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All Levels' },
                { id: 'Low', label: '🟢 Low Crowd (Fastest)' },
                { id: 'Moderate', label: '🟡 Moderate Rush' },
                { id: 'High', label: '🔴 High (Peak Hour)' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCrowdLevel(opt.id)}
                  className={`text-left px-3 py-2 rounded-xl transition-colors font-medium flex items-center justify-between ${
                    crowdLevel === opt.id
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {crowdLevel === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Student Budget (Max Price) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span>Max Thali Price</span>
              <span className="text-emerald-700 font-extrabold">{maxPrice ? `₹${maxPrice}` : 'Any Price'}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {['', '70', '90', '110'].map((price) => (
                <button
                  key={price}
                  onClick={() => setMaxPrice(price)}
                  className={`py-1.5 rounded-lg font-medium border text-center transition-colors ${
                    maxPrice === price
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {price ? `₹${price}` : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Open Status Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Open Now Only</span>
            <button
              onClick={() => setOpenOnly(!openOnly)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                openOnly ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>
        </aside>

        {/* Mess Cards Directory Grid */}
        <div className="md:col-span-3 space-y-4">
          
          {/* Active summary line */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium">
            <span>
              Showing <strong className="text-slate-900">{messes.length}</strong> college messes
            </span>
            {hasActiveFilters && (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-xs border border-emerald-200">
                Filtered view
              </span>
            )}
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : messes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {messes.map((mess) => (
                <MessCard key={mess.id} mess={mess} />
              ))}
            </div>
          ) : (
            /* Empty Filter State */
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No messes match your exact filters</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Try relaxing your wait time, price or crowd filter to see other available messes around campus.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
