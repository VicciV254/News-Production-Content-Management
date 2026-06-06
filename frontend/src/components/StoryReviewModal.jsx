import { useState } from 'react';
import DOMPurify from 'dompurify';
import { X, Check, Edit3, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/format';

export default function StoryReviewModal({ story, onClose, onReview }) {
  const [action, setAction] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (selectedAction) => {
    const reviewAction = selectedAction || action;
    if (!reviewAction) return;
    if ((reviewAction === 'changes_requested' || reviewAction === 'rejected') && !comment.trim()) {
      setError('Comment is required for this action.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onReview(story.id, { action: reviewAction, comment });
      onClose();
    } catch (err) {
      setError(err.response?.data?.comment?.[0] || err.response?.data?.detail || 'Review failed.');
    } finally {
      setLoading(false);
    }
  };

  const canReview = story.status === 'under_review';
  const isViewOnly = story.status === 'approved' || story.status === 'rejected' || story.status === 'changes_requested' || story.status === 'submitted';

  const safeBody = DOMPurify.sanitize(story.body || '', {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'title'],
  });

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <StatusBadge status={story.status} />
            <h2 id="review-modal-title" style={{ marginTop: '0.75rem' }}>{story.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              By {story.journalist?.first_name || story.journalist?.username} · {story.word_count} words · Submitted {formatDate(story.submitted_at)}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div
          className="article-body preview-panel"
          style={{ marginBottom: '1.5rem', flex: 1, overflowY: 'auto' }}
          dangerouslySetInnerHTML={{ __html: safeBody }}
        />

        {story.status === 'submitted' && (
          <div style={{ padding: '1rem', background: '#FEF3C7', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#92400E' }}>
              This story is in the submitted queue. Click "Start Review" to begin reviewing it.
            </p>
          </div>
        )}

        {canReview && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="review-comment">Review Comment</label>
              <textarea
                id="review-comment"
                className="form-textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your editorial comment..."
              />
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>{error}</p>}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <button
                className="btn btn-success"
                onClick={() => handleSubmit('approved')}
                disabled={loading}
              >
                <Check size={16} /> Approve
              </button>
              <button
                className="btn btn-warning"
                onClick={() => setAction('changes_requested')}
                disabled={loading}
              >
                <Edit3 size={16} /> Request Changes
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setAction('rejected')}
                disabled={loading}
              >
                <XCircle size={16} /> Reject
              </button>
            </div>

            {(action === 'changes_requested' || action === 'rejected') && (
              <div style={{ marginTop: '1rem' }}>
                <button className="btn btn-primary" onClick={() => handleSubmit()} disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
          </>
        )}

        {isViewOnly && story.editorial_note && (
          <div style={{ padding: '1rem', background: '#F3F4F6', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>
              {story.editorial_note.action === 'approved' && 'Approved'}
              {story.editorial_note.action === 'rejected' && 'Rejected'}
              {story.editorial_note.action === 'changes_requested' && 'Changes Requested'}
              {' by '}{story.editorial_note.reviewer?.first_name || story.editorial_note.reviewer?.username || 'Editor'}
            </p>
            {story.editorial_note.comment && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {story.editorial_note.comment}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
