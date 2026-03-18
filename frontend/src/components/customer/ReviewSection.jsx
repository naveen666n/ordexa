import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import reviewsApi from '../../api/reviews.api';
import { API_BASE_URL } from '../../lib/constants';

const BACKEND_URL = API_BASE_URL.replace('/api/v1', '');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─── StarRatingInput ──────────────────────────────────────────────────────────

const StarRatingInput = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl focus:outline-none transition-colors"
          aria-label={`${star} star`}
        >
          <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

// ─── RatingBar ────────────────────────────────────────────────────────────────

const RatingBar = ({ stars, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <span className="w-6 text-right">{stars}</span>
      <span className="text-yellow-400">★</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-left">{count}</span>
    </div>
  );
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox = ({ media, onClose }) => {
  if (!media) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-2xl font-bold leading-none"
        onClick={onClose}
        aria-label="Close"
      >
        &times;
      </button>
      <div className="max-w-3xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        {media.media_type === 'video' ? (
          <video
            src={`${BACKEND_URL}${media.url}`}
            controls
            className="max-h-[80vh] max-w-full rounded-lg"
          />
        ) : (
          <img
            src={`${BACKEND_URL}${media.url}`}
            alt="Review media"
            className="max-h-[80vh] max-w-full rounded-lg object-contain"
          />
        )}
      </div>
    </div>
  );
};

// ─── ReviewCard ───────────────────────────────────────────────────────────────

const ReviewCard = ({ review }) => {
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const { user, rating, title, body, media, created_at } = review;
  const displayName = user
    ? `${user.first_name} ${user.last_name ? user.last_name[0] + '.' : ''}`
    : 'Anonymous';

  return (
    <div className="border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-medium text-sm text-gray-800">{displayName}</span>
          <div className="flex items-center gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`text-sm ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{formatDate(created_at)}</span>
      </div>

      {/* Content */}
      {title && <p className="font-semibold text-sm text-gray-900 mb-1">{title}</p>}
      {body && <p className="text-sm text-gray-600 leading-relaxed">{body}</p>}

      {/* Media thumbnails */}
      {media && media.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {media.map((m) => (
            <button
              key={m.id}
              onClick={() => setLightboxMedia(m)}
              className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200 hover:border-primary transition-colors flex-shrink-0"
              aria-label="View media"
            >
              {m.media_type === 'video' ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl">&#9654;</span>
                </div>
              ) : (
                <img
                  src={`${BACKEND_URL}${m.url}`}
                  alt="Review image"
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxMedia && (
        <Lightbox media={lightboxMedia} onClose={() => setLightboxMedia(null)} />
      )}
    </div>
  );
};

// ─── ReviewForm ───────────────────────────────────────────────────────────────

const ReviewForm = ({ slug, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setSubmitError('Please select a rating.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('rating', rating);
      if (title) formData.append('title', title);
      if (body) formData.append('body', body);
      files.forEach((f) => formData.append('media', f));

      await reviewsApi.submitReview(slug, formData);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to submit review. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
        Review submitted! It will appear after approval.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
      <h3 className="font-semibold text-gray-800">Write a Review</h3>

      {/* Star rating */}
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Rating *</label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      {/* Title */}
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Title (optional)</label>
        <input
          type="text"
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your review"
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Body */}
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Review (optional)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Share your experience with this product..."
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Media upload */}
      <div>
        <label className="text-sm text-gray-600 mb-1 block">
          Photos/Video (optional, up to 5)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4"
          onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))}
          className="text-sm text-gray-600"
        />
        {files.length > 0 && (
          <ul className="mt-1 text-xs text-gray-500 space-y-0.5">
            {files.map((f, i) => <li key={i}>{f.name}</li>)}
          </ul>
        )}
      </div>

      {/* Error */}
      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

// ─── ReviewSection ────────────────────────────────────────────────────────────

const REVIEWS_PER_PAGE = 5;

const ReviewSection = ({ slug, isLoggedIn }) => {
  const queryClient = useQueryClient();
  const [displayCount, setDisplayCount] = useState(REVIEWS_PER_PAGE);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => reviewsApi.getProductReviews(slug).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  const handleReviewSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['reviews', slug] });
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-500">Failed to load reviews.</p>;
  }

  const { reviews = [], aggregate, can_review } = data || {};
  const { avg_rating, total_count, distribution } = aggregate || {};
  const visibleReviews = reviews.slice(0, displayCount);
  const hasMore = displayCount < reviews.length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {total_count > 0 ? (
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Average rating */}
          <div className="flex flex-col items-center justify-center min-w-[100px]">
            <span className="text-5xl font-bold text-gray-900">{avg_rating ?? '—'}</span>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`text-lg ${s <= Math.round(avg_rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground mt-1">{total_count} review{total_count !== 1 ? 's' : ''}</span>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => (
              <RatingBar
                key={s}
                stars={s}
                count={distribution?.[s] ?? 0}
                total={total_count}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {isLoggedIn ? 'Be the first to review this product!' : 'No reviews yet.'}
        </p>
      )}

      {/* Review list */}
      {visibleReviews.length > 0 && (
        <div className="space-y-3">
          {visibleReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {hasMore && (
            <button
              onClick={() => setDisplayCount((c) => c + REVIEWS_PER_PAGE)}
              className="w-full py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
            >
              Load more reviews
            </button>
          )}
        </div>
      )}

      {/* Review form */}
      {isLoggedIn && (
        <ReviewForm slug={slug} onSuccess={handleReviewSuccess} />
      )}
    </div>
  );
};

export default ReviewSection;
