import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CrowdBadge from '../components/CrowdBadge';
import ReviewModal from '../components/ReviewModal';
import { 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  Scale, 
  Check, 
  Sparkles, 
  ArrowLeft, 
  Share2, 
  Utensils, 
  Plus, 
  ThumbsUp, 
  MessageSquarePlus, 
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function MessDetailPage() {
  const { selectedMessId, navigate, addToCompare, removeFromCompare, isInCompare, showToast } = useApp();
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [updatingCrowd, setUpdatingCrowd] = useState(false);

  useEffect(() => {
    if (!selectedMessId) {
      navigate('find');
      return;
    }

    setLoading(true);
    fetch(`/api/messes/${selectedMessId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Mess not found');
        return res.json();
      })
      .then((data) => {
        setMess(data);
        if (data.menu_items && data.menu_items.length > 0) {
          setSelectedMeal(data.menu_items[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching mess details:', err);
        setLoading(false);
      });
  }, [selectedMessId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading mess details & live queue status...</p>
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-600 font-bold">Mess details not found.</p>
        <button
          onClick={() => navigate('find')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const inCompare = isInCompare(mess.id);

  const handleToggleCompare = () => {
    if (inCompare) {
      removeFromCompare(mess.id);
    } else {
      addToCompare(mess);
    }
  };

  const handleConfirmMess = () => {
    const mealName = selectedMeal ? selectedMeal.name : mess.today_special;
    const mealPrice = selectedMeal ? selectedMeal.price : mess.price;
    navigate('confirm', {
      messId: mess.id,
      meal: mealName,
      price: mealPrice
    });
  };

  const handleHelpfulVote = async (reviewId) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
      // Update locally
      setMess((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r
        )
      }));
      showToast('Thank you for voting this review helpful!', 'success');
    } catch {
      showToast('Failed to register vote', 'error');
    }
  };

  const handleSimulateCrowd = async (newLevel, newWait) => {
    setUpdatingCrowd(true);
    try {
      const res = await fetch(`/api/messes/${mess.id}/crowd`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crowd_level: newLevel, wait_time_mins: newWait })
      });
      if (res.ok) {
        setMess((prev) => ({
          ...prev,
          crowd_level: newLevel,
          wait_time_mins: newWait
        }));
        showToast(`Crowd status updated to ${newLevel} (${newWait}m wait)`, 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingCrowd(false);
    }
  };

  const handleReviewAdded = (newReview) => {
    setMess((prev) => ({
      ...prev,
      reviews: [newReview, ...(prev.reviews || [])],
      review_count: (prev.review_count || 0) + 1
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('find')}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Messes</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleCompare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              inCompare
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{inCompare ? 'In Comparison' : 'Add to Compare'}</span>
          </button>
        </div>
      </div>

      {/* Main Mess Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
        
        {/* Left Photo & Badges */}
        <div className="md:col-span-5 relative h-64 md:h-auto min-h-[300px]">
          <img
            src={mess.image}
            alt={mess.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Food Type Pill */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
              {mess.food_type}
            </span>
          </div>

          {/* Live Crowd & Wait Indicator */}
          <div className="absolute top-4 right-4">
            <CrowdBadge level={mess.crowd_level} waitTime={mess.wait_time_mins} />
          </div>

          {/* Distance from campus overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-md rounded-xl p-2.5 text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{mess.distance_walk_time} • {mess.distance_meters}m from Gate</span>
            </div>
            <span className="font-semibold text-emerald-400">Open Now</span>
          </div>
        </div>

        {/* Right Info & Fast Confirm CTA */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          
          <div className="space-y-3">
            {/* Title and Rating */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {mess.name}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">{mess.tagline}</p>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-900 font-extrabold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{mess.rating.toFixed(1)}</span>
                <span className="text-slate-400 text-xs font-normal">({mess.review_count} reviews)</span>
              </div>
            </div>

            {/* Address & Timings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-2">
              <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">{mess.address}</div>
                  <div className="text-slate-500 text-[11px]">{mess.landmark}</div>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Lunch & Dinner Timings</div>
                  <div className="text-slate-500 text-[11px]">{mess.opening_time} – {mess.closing_time}</div>
                </div>
              </div>
            </div>

            {/* Today's Special Dish Callout */}
            <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-800">
                  Today's Chef Lunch Special
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {mess.today_special}
                </p>
              </div>
            </div>

            {/* Features Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {mess.features?.map((f, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  ✓ {f}
                </span>
              ))}
            </div>

            {/* Live Crowd Simulator / Reporter (Interactive Feature) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium flex items-center gap-1">
                <span>Update crowd status:</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSimulateCrowd('Low', 4)}
                  disabled={updatingCrowd}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    mess.crowd_level === 'Low'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🟢 Low (&lt;5m)
                </button>
                <button
                  onClick={() => handleSimulateCrowd('Moderate', 12)}
                  disabled={updatingCrowd}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    mess.crowd_level === 'Moderate'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🟡 Moderate
                </button>
                <button
                  onClick={() => handleSimulateCrowd('High', 22)}
                  disabled={updatingCrowd}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    mess.crowd_level === 'High'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🔴 High
                </button>
              </div>
            </div>
          </div>

          {/* Confirm This Mess Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Standard Thali Rate</div>
              <div className="text-2xl font-black text-slate-900">
                ₹{mess.price}
                <span className="text-xs font-normal text-slate-500 ml-1">/thali</span>
              </div>
            </div>

            <button
              onClick={handleConfirmMess}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm This Mess</span>
            </button>
          </div>

        </div>

      </div>

      {/* Menu & Meal Options Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Today's Menu & Thali Options
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select your preferred meal plate for express counter pickup.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            Live Daily Menu
          </span>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mess.menu_items?.map((item, idx) => {
            const isSelected = selectedMeal?.name === item.name;
            return (
              <div
                key={idx}
                onClick={() => setSelectedMeal(item)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {item.name}
                    </h4>
                    {item.special && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                        Chef Special
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-slate-900">₹{item.price}</div>
                  <div className={`mt-1 text-xs font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {isSelected ? '✓ Selected' : 'Choose'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky action row below menu selection */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-600">
            Selected Choice: <strong className="text-slate-900">{selectedMeal?.name || mess.today_special}</strong>
            <span className="ml-2 font-bold text-emerald-700">₹{selectedMeal?.price || mess.price}</span>
          </div>

          <button
            onClick={handleConfirmMess}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Lock & Confirm Choice</span>
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reviews & Student Feedback Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Student Reviews & Wait Reports
              </h2>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                {mess.reviews?.length || 0} reviews
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Honest feedback from students eating here during college breaks.
            </p>
          </div>

          <button
            onClick={() => setReviewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Reviews List */}
        {mess.reviews && mess.reviews.length > 0 ? (
          <div className="space-y-4">
            {mess.reviews.map((rev) => (
              <div 
                key={rev.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {rev.student_name ? rev.student_name[0] : 'S'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {rev.student_name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-amber-700 font-medium">Wait Faced: {rev.wait_time_reported}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rev.rating} / 5</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  "{rev.comment}"
                </p>

                {/* Tags and Helpful Button */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {rev.tags?.map((t, tidx) => (
                      <span key={tidx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white text-slate-600 border border-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleHelpfulVote(rev.id)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 font-medium transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful ({rev.helpful_count || 0})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs sm:text-sm">
            No reviews yet for this mess. Be the first to submit a review!
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        messId={mess.id}
        messName={mess.name}
        onReviewAdded={handleReviewAdded}
      />

    </div>
  );
}
