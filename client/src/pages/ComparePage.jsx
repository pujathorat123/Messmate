import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CrowdBadge from '../components/CrowdBadge';
import { 
  Scale, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  ArrowRight, 
  Star, 
  Clock, 
  Sparkles, 
  MapPin, 
  Utensils,
  Award,
  AlertCircle
} from 'lucide-react';

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare, addToCompare, navigate } = useApp();
  const [allMesses, setAllMesses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/messes')
      .then((res) => res.json())
      .then((data) => setAllMesses(data))
      .catch((err) => console.error(err));
  }, []);

  // Find winner badges
  const shortestWait = compareList.length > 1
    ? Math.min(...compareList.map((m) => m.wait_time_mins))
    : null;

  const lowestPrice = compareList.length > 1
    ? Math.min(...compareList.map((m) => m.price))
    : null;

  const highestRating = compareList.length > 1
    ? Math.max(...compareList.map((m) => m.rating))
    : null;

  const handleConfirm = (mess) => {
    navigate('confirm', {
      messId: mess.id,
      meal: mess.today_special,
      price: mess.price
    });
  };

  const availableToAdd = allMesses.filter(
    (m) => !compareList.some((c) => c.id === m.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <Scale className="w-4 h-4" />
            <span>Side-by-Side Decision Maker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Compare Messes ({compareList.length}/3)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Compare prices, today's menu, current crowd, and queue wait times in one simple view.
          </p>
        </div>

        {compareList.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={clearCompare}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Mess to Compare Selector when fewer than 3 */}
      {compareList.length < 3 && availableToAdd.length > 0 && (
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-700">
            <strong className="text-emerald-900 font-bold">Select another mess to compare: </strong>
            <span>Pick up to {3 - compareList.length} more from the campus directory.</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const found = availableToAdd.find((m) => m.id === e.target.value);
                if (found) addToCompare(found);
                e.target.value = '';
              }}
              defaultValue=""
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-emerald-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
            >
              <option value="" disabled>+ Choose Mess to Add...</option>
              {availableToAdd.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (₹{m.price} • {m.wait_time_mins}m wait)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* When 0 messes selected */}
      {compareList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">No messes selected for comparison</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select 2 to 3 messes from the Directory or click "Add to Compare" on any mess card to compare their menus, wait times, and prices side-by-side.
            </p>
          </div>
          <button
            onClick={() => navigate('find')}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Browse College Messes
          </button>
        </div>
      ) : (
        /* Comparison Table */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="p-4 sm:p-5 w-1/4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Features
                </th>
                {compareList.map((mess) => (
                  <th key={mess.id} className="p-4 sm:p-5 w-1/4 align-top">
                    <div className="space-y-3">
                      <div className="relative h-28 rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={mess.image}
                          alt={mess.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFromCompare(mess.id)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors"
                          title="Remove from compare"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                          {mess.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{mess.landmark}</p>
                      </div>

                      <button
                        onClick={() => handleConfirm(mess)}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Confirm This Mess</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}

                {/* Empty slot placeholder if < 3 */}
                {compareList.length < 3 && (
                  <th className="p-4 sm:p-5 w-1/4 align-middle text-center bg-slate-50/40 border-l border-dashed border-slate-200">
                    <div className="space-y-2 py-8">
                      <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto">
                        <Plus className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Add another mess to compare</p>
                    </div>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              
              {/* Row: Current Queue & Wait */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 sm:p-5 font-bold text-slate-700 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Crowd & Wait Time</span>
                  </div>
                </td>
                {compareList.map((mess) => {
                  const isFastest = shortestWait !== null && mess.wait_time_mins === shortestWait;
                  return (
                    <td key={mess.id} className="p-4 sm:p-5">
                      <div className="space-y-1.5">
                        <CrowdBadge level={mess.crowd_level} waitTime={mess.wait_time_mins} />
                        {isFastest && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                            <Award className="w-3 h-3 text-emerald-600" />
                            <span>⚡ Fastest Queue Today</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
                {compareList.length < 3 && <td className="bg-slate-50/20" />}
              </tr>

              {/* Row: Price */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 sm:p-5 font-bold text-slate-700 bg-slate-50/30">
                  <span>Thali Starting Price</span>
                </td>
                {compareList.map((mess) => {
                  const isCheapest = lowestPrice !== null && mess.price === lowestPrice;
                  return (
                    <td key={mess.id} className="p-4 sm:p-5">
                      <div className="space-y-1">
                        <div className="text-lg font-black text-slate-900">
                          ₹{mess.price}
                          <span className="text-xs font-normal text-slate-500 ml-1">/thali</span>
                        </div>
                        {isCheapest && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            <span>₹ Lowest Student Price</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
                {compareList.length < 3 && <td className="bg-slate-50/20" />}
              </tr>

              {/* Row: Today's Special Dish */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 sm:p-5 font-bold text-slate-700 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Today's Lunch Special</span>
                  </div>
                </td>
                {compareList.map((mess) => (
                  <td key={mess.id} className="p-4 sm:p-5 font-medium text-slate-800">
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                      {mess.today_special}
                    </div>
                  </td>
                ))}
                {compareList.length < 3 && <td className="bg-slate-50/20" />}
              </tr>

              {/* Row: Food Type */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 sm:p-5 font-bold text-slate-700 bg-slate-50/30">
                  <span>Food Type</span>
                </td>
                {compareList.map((mess) => (
                  <td key={mess.id} className="p-4 sm:p-5">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800">
                      {mess.food_type}
                    </span>
                  </td>
                ))}
                {compareList.length < 3 && <td className="bg-slate-50/20" />}
              </tr>

              {/* Row: Walking Distance */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 sm:p-5 font-bold text-slate-700 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>Distance from Gate</span>
                  </div>
                </td>
                {compareList.map((mess) => (
                  <td key={mess.id} className="p-4 sm:p-5 text-slate-700">
                    <div className="font-semibold text-slate-900">{mess.distance_walk_time}</div>
                    <div className="text-[11px] text-slate-500">{mess.distance_meters} meters away</div>
                  </td>
                ))}
                {compareList.length < 3 && <td className="bg-slate-50/20" />}
              </tr>

              {/* Row: Timings */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 sm:p-5 font-bold text-slate-700 bg-slate-50/30">
                  <span>Lunch Timings</span>
                </td>
                {compareList.map((mess) => (
                  <td key={mess.id} className="p-4 sm:p-5 text-slate-700">
                    {mess.opening_time} – {mess.closing_time}
                  </td>
                ))}
                {compareList.length < 3 && <td className="bg-slate-50/20" />}
              </tr>

              {/* Row: Rating */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 sm:p-5 font-bold text-slate-700 bg-slate-50/30">
                  <span>Student Rating</span>
                </td>
                {compareList.map((mess) => {
                  const isTopRated = highestRating !== null && mess.rating === highestRating;
                  return (
                    <td key={mess.id} className="p-4 sm:p-5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{mess.rating.toFixed(1)}</span>
                        <span className="text-slate-400 text-xs font-normal">({mess.review_count})</span>
                        {isTopRated && (
                          <span className="ml-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                            Top Rated
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                {compareList.length < 3 && <td className="bg-slate-50/20" />}
              </tr>

              {/* Row: Features */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-4 sm:p-5 font-bold text-slate-700 bg-slate-50/30">
                  <span>Key Features</span>
                </td>
                {compareList.map((mess) => (
                  <td key={mess.id} className="p-4 sm:p-5">
                    <ul className="space-y-1 text-xs text-slate-600">
                      {mess.features?.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
                {compareList.length < 3 && <td className="bg-slate-50/20" />}
              </tr>

            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
