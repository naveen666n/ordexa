import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminReviewsApi from '../../api/admin/reviews.api';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const StarDisplay = ({ rating }) => (
  <span className="text-yellow-400 text-sm">
    {'★'.repeat(rating)}
    <span className="text-gray-200">{'★'.repeat(5 - rating)}</span>
  </span>
);

const ReviewsModerationPage = () => {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'reviews', 'pending'],
    queryFn: () => adminReviewsApi.listPending().then((r) => r.data.data.reviews),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => adminReviewsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews', 'pending'] });
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.response?.data?.error?.message || 'Failed to approve review.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminReviewsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews', 'pending'] });
      setActionError('');
    },
    onError: (err) => {
      setActionError(err.response?.data?.error?.message || 'Failed to delete review.');
    },
  });

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    deleteMutation.mutate(id);
  };

  const reviews = data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Pending Reviews</h2>
        <span className="text-sm text-muted-foreground">{reviews.length} pending</span>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
          {actionError}
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-red-600 text-sm">Failed to load reviews.</div>
      )}

      {!isLoading && !isError && reviews.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">&#10003;</p>
          <p className="text-lg font-medium">No pending reviews</p>
          <p className="text-sm mt-1">All reviews have been moderated.</p>
        </div>
      )}

      {!isLoading && reviews.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Reviewer</th>
                <th className="py-2 pr-4">Rating</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4 max-w-[200px]">Body</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-gray-800">{review.product?.name || '—'}</span>
                    {review.product?.slug && (
                      <br />
                    )}
                    <span className="text-xs text-muted-foreground">{review.product?.slug}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-gray-700">
                      {review.user?.first_name} {review.user?.last_name}
                    </span>
                    <br />
                    <span className="text-xs text-muted-foreground">{review.user?.email}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <StarDisplay rating={review.rating} />
                  </td>
                  <td className="py-3 pr-4 max-w-[150px]">
                    <span className="line-clamp-2">{review.title || <span className="text-muted-foreground italic">—</span>}</span>
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    <span className="line-clamp-3 text-gray-600">
                      {review.body || <span className="text-muted-foreground italic">—</span>}
                    </span>
                    {review.media && review.media.length > 0 && (
                      <span className="text-xs text-primary mt-1 block">{review.media.length} media file{review.media.length !== 1 ? 's' : ''}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                    {formatDate(review.created_at)}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate(review.id)}
                        disabled={approveMutation.isPending || deleteMutation.isPending}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={approveMutation.isPending || deleteMutation.isPending}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReviewsModerationPage;
