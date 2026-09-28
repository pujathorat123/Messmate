import React from 'react';
import { useApp } from '../context/AppContext';
import CrowdBadge from './CrowdBadge';
import { 
  Star, 
  MapPin, 
  Clock, 
  Check, 
  Plus, 
  Scale, 
  ChevronRight, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function MessCard({ mess }) {
  const { navigate, addToCompare, removeFromCompare, isInCompare } = useApp();
  const inCompare = isInCompare(mess.id);

  const handleCardClick = () => {
    navigate('mess-details', {}, mess.id);
  };

  const toggleCompare = (e) => {
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(mess.id);
    } else {
      addToCompare(mess);
    }
  };

  const handleQuickConfirm = (e) => {
    e.stopPropagation();
    navigate('confirm', { messId: mess.id, meal: mess.today_special, price: mess.price });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Top Banner Image with Badges */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={mess.image}
          alt={mess.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Live Crowd & Wait pill on top right */}
        <div className="absolute top-3 right-3">
          <CrowdBadge 
            level={mess.crowd_level} 
            waitTime={mess.wait_time_mins} 
            size="sm" 
          />
        </div>

        {/* Food type pill on top left */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs ${
            mess.food_type === 'Pure Veg'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
              : mess.food_type === 'South Indian'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
              : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              mess.food_type === 'Pure Veg'
                ? 'bg-emerald-400'
                : mess.food_type === 'South Indian'
                ? 'bg-amber-400'
                : 'bg-rose-400'
            }`} />
            {mess.food_type}
          </span>
        </div>

        {/* Bottom image overlay: Distance & Timing */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white/90">
          <div className="flex items-center gap-1 font-medium bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{mess.distance_walk_time} ({mess.distance_meters}m)</span>
          </div>
          <span className="text-[11px] bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
            {mess.opening_time} - {mess.closing_time}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 text-base sm:text-lg">
              {mess.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-900">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{mess.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal text-[11px]">({mess.review_count})</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {mess.tagline || mess.landmark}
          </p>

          {/* Today's Special Dish */}
          <div className="mt-3 bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-800 leading-tight">
              <span className="font-semibold text-emerald-800">Today's Special: </span>
              <span className="text-slate-600">{mess.today_special}</span>
            </div>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-medium">Starting at</div>
            <div className="text-lg font-black text-slate-900 leading-none">
              ₹{mess.price}
              <span className="text-xs font-normal text-slate-500 ml-1">/thali</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Compare Toggle Button */}
            <button
              onClick={toggleCompare}
              title={inCompare ? 'Remove from compare' : 'Add to compare'}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors ${
                inCompare
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Scale className="w-4 h-4" />
            </button>

            {/* Quick Confirm Button */}
            <button
              onClick={handleQuickConfirm}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Confirm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
