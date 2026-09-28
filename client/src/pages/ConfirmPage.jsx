import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  Ticket, 
  MapPin, 
  Clock, 
  Share2, 
  Users, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  Copy,
  Utensils
} from 'lucide-react';

export default function ConfirmPage() {
  const { pageParams, activePass, passes, saveNewPass, navigate, showToast } = useApp();

  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(Boolean(pageParams?.messId));
  const [fetchError, setFetchError] = useState('');

  // Form states
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [mealChoice, setMealChoice] = useState(pageParams?.meal || '');
  const [partySize, setPartySize] = useState(1);
  const [arrivalMins, setArrivalMins] = useState(10);
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState(pageParams?.price ? Number(pageParams.price) : 80);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If messId is passed, user is confirming a new mess; otherwise show activePass if available
  const [confirmedPass, setConfirmedPass] = useState(() => {
    if (pageParams?.messId) return null;
    return activePass || (passes && passes.length > 0 ? passes[0] : null);
  });

  // Countdown timer for active pass arrival
  const [countdown, setCountdown] = useState(() => {
    const initialArrival = confirmedPass?.estimated_arrival_mins || 10;
    return Number(initialArrival) * 60;
  });

  useEffect(() => {
    if (pageParams?.messId) {
      // User is confirming a specific mess - reset confirmedPass to show the form
      setConfirmedPass(null);
      setLoading(true);
      setFetchError('');

      fetch(`/api/messes/${pageParams.messId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Could not load mess details');
          return res.json();
        })
        .then((data) => {
          if (!data || data.error) throw new Error(data?.error || 'Mess not found');
          
          // Ensure menu_items and features are safe arrays
          const safeMenuItems = Array.isArray(data.menu_items)
            ? data.menu_items
            : typeof data.menu_items === 'string'
            ? JSON.parse(data.menu_items || '[]')
            : [];

          const safeMess = {
            ...data,
            menu_items: safeMenuItems
          };

          setMess(safeMess);
          setMealChoice(pageParams.meal || data.today_special || safeMenuItems[0]?.name || 'Standard Thali');
          setPrice(pageParams.price ? Number(pageParams.price) : data.price || 80);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error loading mess for confirmation:', err);
          setFetchError(err.message || 'Failed to load mess information');
          setLoading(false);
        });
    } else {
      // Direct navigation to Lunch Pass page without messId
      setMess(null);
      setLoading(false);
      setConfirmedPass(activePass || (passes && passes.length > 0 ? passes[0] : null));
    }
  }, [pageParams?.messId, activePass]);

  useEffect(() => {
    let timer;
    if (confirmedPass && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [confirmedPass, countdown]);

  const formatTimer = (seconds) => {
    const totalSecs = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      showToast('Please enter your name', 'warning');
      return;
    }
    if (!mess) {
      showToast('Please select a mess first', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedMealChoice = mealChoice || mess.today_special || 'Standard Thali';
      const effectivePrice = price || mess.price || 80;

      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mess_id: mess.id,
          mess_name: mess.name,
          student_name: studentName.trim(),
          student_phone: studentPhone.trim(),
          meal_choice: selectedMealChoice,
          price: effectivePrice * partySize,
          party_size: partySize,
          estimated_arrival_mins: arrivalMins,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm mess');

      saveNewPass(data.pass);
      setConfirmedPass(data.pass);
      setCountdown(Number(arrivalMins || 10) * 60);
    } catch (err) {
      showToast(err.message || 'Error creating pass', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (confirmedPass) {
      navigator.clipboard.writeText(
        `QuickMess Pass: ${confirmedPass.pass_code || ''} for ${confirmedPass.mess_name || ''}. Meal: ${confirmedPass.meal_choice || ''} (₹${confirmedPass.price || 0})`
      );
      showToast('Pass details copied to clipboard!', 'success');
    }
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${mess?.name || confirmedPass?.mess_name || 'College Mess'} campus gate`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Loading state when fetching mess info
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-medium">Loading mess confirmation details...</p>
      </div>
    );
  }

  // Fetch error state
  if (fetchError) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to Load Mess</h2>
        <p className="text-xs sm:text-sm text-slate-500">{fetchError}</p>
        <button
          onClick={() => navigate('find')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  // If already confirmed or viewing active confirmation
  if (confirmedPass) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mess Confirmed! You're Set.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Show this quick token to the counter person to beat the line.
          </p>
        </div>

        {/* Digital Lunch Pass Ticket */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
          
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-200" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-100">
                  QuickMess Lunch Pass
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">{confirmedPass.mess_name || 'Campus Mess'}</h2>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-medium text-emerald-100 uppercase tracking-wider">Pass Code</div>
              <div className="text-2xl font-mono font-black tracking-wider bg-white/20 backdrop-blur-xs px-3 py-1 rounded-xl">
                {confirmedPass.pass_code || 'QM-READY'}
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6 space-y-6">
            
            {/* Arrival Countdown Box */}
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                    Estimated Arrival Timer
                  </div>
                  <div className="text-xs text-amber-700">
                    Counter alerted to hold your spot
                  </div>
                </div>
              </div>

              <div className="text-2xl font-black font-mono text-amber-950">
                {formatTimer(countdown)}
              </div>
            </div>

            {/* Pass Summary Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Student Name</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {confirmedPass.student_name || 'Student'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Party Size</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {confirmedPass.party_size || 1} {Number(confirmedPass.party_size) > 1 ? 'Students' : 'Student'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Selected Meal</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block line-clamp-1">
                  {confirmedPass.meal_choice || 'Standard Meal'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Total Amount</span>
                <span className="font-black text-emerald-700 text-base mt-0.5 block">
                  ₹{confirmedPass.price || 80}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="border-t border-dashed border-slate-200 pt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Show pass code <strong>{confirmedPass.pass_code || ''}</strong> at the counter for immediate serving.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Keep your payment ready via UPI or cash to clear within 30 seconds.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleCopyCode}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Pass Code</span>
              </button>

              <button
                onClick={openGoogleMaps}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <NavigationIcon className="w-4 h-4" />
                <span>Get Walking Directions</span>
              </button>
            </div>

          </div>

          {/* Ticket Barcode Visual Graphic */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
            <div className="h-8 max-w-xs mx-auto flex items-center justify-between gap-1 opacity-60">
              {[...Array(38)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-800 h-full"
                  style={{ width: i % 3 === 0 ? '4px' : i % 2 === 0 ? '2px' : '1px' }}
                />
              ))}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 tracking-widest">
              OFFICIAL QUICKMESS CAMPUS TOKEN • {confirmedPass.id || confirmedPass.pass_code || 'QM-PASS'}
            </div>
          </div>
        </div>

        {/* Change or New Pass CTA */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setConfirmedPass(null);
              navigate('find');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline decoration-slate-300 cursor-pointer"
          >
            Looking for something else? Find another mess
          </button>
        </div>

      </div>
    );
  }

  // If no mess is selected yet, prompt user to pick one
  if (!mess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <Ticket className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Mess Selected Yet</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Pick a mess from the directory to review the menu and generate your quick lunch pass.
        </p>
        <button
          onClick={() => navigate('find')}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
        >
          Explore Messes
        </button>
      </div>
    );
  }

  // Step 1: Confirmation Form Screen
  const menuItems = Array.isArray(mess.menu_items) ? mess.menu_items : [];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Quick Decision Lock</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Confirm Your Lunch Pass
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Lock in your meal so the mess counter knows you are arriving within your break.
        </p>
      </div>

      {/* Selected Mess Summary Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={mess.image}
            alt={mess.name}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {mess.food_type}
            </span>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-1 line-clamp-1">
              {mess.name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{mess.distance_walk_time} • {mess.landmark}</span>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-slate-500">Wait time</div>
          <div className="text-base font-black text-emerald-700">~{mess.wait_time_mins} mins</div>
        </div>
      </div>

      {/* Confirmation Form */}
      <form onSubmit={handleConfirmSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        
        {/* Student Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Your Name / Roll No *
          </label>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="e.g. Aryan Sharma (CS-3)"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Meal Choice */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Meal Choice
          </label>
          <select
            value={mealChoice}
            onChange={(e) => {
              setMealChoice(e.target.value);
              const found = menuItems.find((m) => m.name === e.target.value);
              if (found) setPrice(found.price);
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {menuItems.map((item, idx) => (
              <option key={idx} value={item.name}>
                {item.name} — ₹{item.price}
              </option>
            ))}
            {mess.today_special && (
              <option value={mess.today_special}>
                Today Special: {mess.today_special} (₹{mess.price})
              </option>
            )}
          </select>
        </div>

        {/* Party Size & Arrival Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Party Size (Friends)
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-bold">
              {[1, 2, 3, 4].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setPartySize(num)}
                  className={`py-2 rounded-xl border transition-colors cursor-pointer ${
                    partySize === num
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num} {num === 1 ? 'Self' : `+${num - 1}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Arrival in (mins)
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold">
              {[5, 10, 15].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setArrivalMins(mins)}
                  className={`py-2 rounded-xl border transition-colors cursor-pointer ${
                    arrivalMins === mins
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Quick Note / Special Request (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Please keep 2 extra phulkas ready, reaching in 5m"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Pricing Summary */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Estimated Total Payment</div>
            <div className="text-xl font-black text-slate-900">
              ₹{price * partySize}
              <span className="text-xs font-normal text-slate-500 ml-1">
                (for {partySize} {partySize === 1 ? 'meal' : 'meals'})
              </span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            Pay at counter (UPI / Cash)
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{isSubmitting ? 'Confirming...' : 'Generate My Lunch Pass'}</span>
        </button>

      </form>

    </div>
  );
}

// Named alias for navigation icon to avoid collision
function NavigationIcon(props) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}
