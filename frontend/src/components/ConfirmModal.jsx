import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', showComment = false }) {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(comment);
    setComment('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={48} color="#DC2626" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{message}</p>
        </div>
        {showComment && (
          <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label className="form-label" htmlFor="confirm-comment">Feedback (optional)</label>
            <textarea
              id="confirm-comment"
              className="form-textarea"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your feedback..."
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button className="btn btn-danger" onClick={handleSubmit}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
