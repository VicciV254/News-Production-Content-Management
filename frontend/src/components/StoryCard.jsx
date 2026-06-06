import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { timeAgo } from '../utils/format';
import { AlertCircle } from 'lucide-react';

export default function StoryCard({ story, mode = 'journalist', onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(story);
      return;
    }
    if (mode === 'feed') {
      navigate(`/feed/${story.slug}`);
    } else if (mode === 'journalist') {
      navigate(`/stories/${story.id}/edit`);
    } else {
      onClick?.(story);
    }
  };

  return (
    <article
      className="story-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Story: ${story.title}`}
    >
      {story.is_breaking && mode === 'feed' && (
        <div className="breaking-banner">BREAKING</div>
      )}

      <div style={{ marginTop: story.is_breaking && mode === 'feed' ? '0.75rem' : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {story.category && (
            <span
              className="category-badge"
              style={{ background: story.category.color_hex }}
            >
              {story.category.name}
            </span>
          )}
          {mode !== 'feed' && <StatusBadge status={story.status} />}
        </div>

        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>
          {story.title}
        </h3>

        {story.summary && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {story.summary}
          </p>
        )}

        {story.status === 'changes_requested' && story.latest_review_comment && (
          <div className="alert alert-danger" style={{ fontSize: '0.8125rem', padding: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            <strong>Changes requested:</strong> {story.latest_review_comment}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <span className="mono">{story.word_count} words</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {story.reviewer_initials && (
              <span className="reviewer-avatar" title="Under review">
                {story.reviewer_initials}
              </span>
            )}
            <span>{timeAgo(story.updated_at || story.published_at)}</span>
          </div>
        </div>

        {story.is_late && (
          <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.5rem', display: 'block' }}>
            Late submission
          </span>
        )}
      </div>
    </article>
  );
}
