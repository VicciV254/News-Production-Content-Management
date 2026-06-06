import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowLeft, User, Calendar, FileText } from 'lucide-react';
import Layout from '../components/Layout';
import { newsApi } from '../api/client';
import { formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function StoryDetailPage() {
  const { slug } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    newsApi.getFeedStory(slug)
      .then(({ data }) => setStory(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="skeleton" style={{ height: 400, borderRadius: '1rem' }} />
      </Layout>
    );
  }

  if (error || !story) {
    return (
      <Layout>
        <p>Story not found.</p>
        <Link to="/feed" className="btn btn-secondary">Back to feed</Link>
      </Layout>
    );
  }

  const safeBody = DOMPurify.sanitize(story.body || '', {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'title'],
  });

  return (
    <Layout>
      <Link to="/feed" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <article className="preview-panel fade-in-up" style={{ maxWidth: 800, margin: '0 auto' }}>
        {story.is_breaking && <div className="breaking-banner" style={{ margin: '-2rem -2rem 1.5rem', borderRadius: '1rem 1rem 0 0' }}>BREAKING</div>}

        {story.category && (
          <span className="category-badge" style={{ background: story.category.color_hex, marginBottom: '1rem', display: 'inline-block' }}>
            {story.category.name}
          </span>
        )}

        <h1 style={{ fontSize: '2.25rem', marginBottom: '1rem', lineHeight: 1.2 }}>{story.title}</h1>

        {story.summary && (
          <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
            {story.summary}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <User size={16} /> {story.journalist_name}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Calendar size={16} /> {formatDate(story.published_at)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }} className="mono">
            <FileText size={16} /> {story.word_count} words
          </span>
        </div>

        {story.tags?.length > 0 && (
          <div className="tag-chips" style={{ marginBottom: '2rem' }}>
            {story.tags.map((t) => (
              <span key={t.id || t.name} className="tag-chip">{t.name}</span>
            ))}
          </div>
        )}

        <div className="article-body" dangerouslySetInnerHTML={{ __html: safeBody }} />

        {user && story.editorial_note && (
          <div className="alert alert-danger" style={{ marginTop: '2rem' }}>
            <strong>Internal editorial note:</strong> {story.editorial_note.comment}
          </div>
        )}
      </article>
    </Layout>
  );
}
