import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ReviewModal from '../components/ReviewModal';
import { 
  Star, 
  ThumbsUp, 
  MessageSquarePlus, 
  Filter, 
  Clock, 
  Users, 
  ShieldCheck, 
  Sparkles,
  Search
} from 'lucide-react';

export default function ReviewsPage() {
  const { showToast, navigate } = useApp();
  const [reviews, setReviews] = useState([]);
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMess, setFilterMess] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedMessForReview, setSelectedMessForReview] = useState(null);

  const fetchReviews = () => {
    setLoading(true);
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
    fetch('/api/messes')
      .then((res) => res.json())
      .then((data) => {
        setMesses(data);
        if (data.length > 0) {
          setSelectedMessForReview(data[0]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleHelpfulVote = async (reviewId) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r
        )
      );
      showToast('Thank you for voting this review helpful!', 'success');
    } catch {
      showToast('Failed to register vote', 'error');
    }
  };

  const handleOpenReviewModal = (mess) => {
    setSelectedMessForReview(mess || messes[0]);
    setReviewModalOpen(true);
  };

  const handleReviewAdded = (newReview) => {
    fetchReviews();
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterMess !== 'all' && r.mess_id !== filterMess) return false;
    if (filterRating !== 'all' && r.rating < Number(filterRating)) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Campus Community Voice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Student Reviews & Queue Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Read transparent feedback on food hygiene, taste, refill speed, and true wait times.
          </p>
        </div>

        <button
          onClick={() => handleOpenReviewModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Filter & Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mess Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Mess:</span>
            <select
              value={filterMess}
              onChange={(e) => setFilterMess(e.target.value)}
              className="text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Campus Messes</option>
              {messes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Rating:</span>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">All Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars only</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars & above</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredReviews.length}</strong> student reviews
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                {/* Mess Tag and Rating */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span 
                      onClick={() => navigate('mess-details', {}, rev.mess_id)}
                      className="text-xs font-extrabold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {rev.mess_name}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                      {rev.student_name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-900">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rev.rating} / 5</span>
                  </div>
                </div>

                {/* Queue & Crowd context */}
                <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Wait: <strong>{rev.wait_time_reported}</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Crowd: <strong>{rev.crowd_experience}</strong></span>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>

                {/* Tags */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {rev.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                <button
                  onClick={() => handleHelpfulVote(rev.id)}
                  className="flex items-center gap-1 text-slate-500 hover:text-emerald-700 font-medium transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful ({rev.helpful_count || 0})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4">
          <p className="text-slate-500 text-sm">No reviews found matching the selected filters.</p>
          <button
            onClick={() => {
              setFilterMess('all');
              setFilterRating('all');
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Write Review Modal */}
      {selectedMessForReview && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          messId={selectedMessForReview.id}
          messName={selectedMessForReview.name}
          onReviewAdded={handleReviewAdded}
        />
      )}

    </div>
  );
}
