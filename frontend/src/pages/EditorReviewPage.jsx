import { useEffect, useState } from 'react';
import { Sparkles, Filter, Trash2, Archive } from 'lucide-react';
import Layout from '../components/Layout';
import StoryCard from '../components/StoryCard';
import StoryReviewModal from '../components/StoryReviewModal';
import ConfirmModal from '../components/ConfirmModal';
import { StoryGridSkeleton } from '../components/LoadingSkeleton';
import { newsApi, asList } from '../api/client';
import { useToast } from '../components/Toast';

const SORT_OPTIONS = [
  { value: '-submitted_at', label: 'Newest submitted' },
  { value: 'submitted_at', label: 'Oldest submitted' },
  { value: '-updated_at', label: 'Recently updated' },
  { value: 'title', label: 'Title A-Z' },
];

export default function EditorReviewPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [loadingStory, setLoadingStory] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [journalistFilter, setJournalistFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sort, setSort] = useState('-submitted_at');
  const [page, setPage] = useState(1);
  const [journalists, setJournalists] = useState([]);
  const [tags, setTags] = useState([]);
  const [readStories, setReadStories] = useState(() => {
    const saved = localStorage.getItem('readStories');
    return saved ? JSON.parse(saved) : {};
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, storyId: null });
  const { addToast } = useToast();

  const loadStories = () => {
    setLoading(true);
    const params = { page, sort };
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (journalistFilter) params.journalist = journalistFilter;
    if (tagFilter) params.tag = tagFilter;

    newsApi.getStories(params)
      .then(({ data }) => setStories(data.results || data))
      .finally(() => setLoading(false));
  };

  const loadJournalistsAndTags = () => {
    newsApi.getStories()
      .then(({ data }) => {
        const stories = asList(data);
        const uniqueJournalists = [...new Map(stories.map(s => [s.journalist?.id, s.journalist])).values()].filter(Boolean);
        const uniqueTags = [...new Map(stories.flatMap(s => s.tags || []).map(t => [t.id, t])).values()];
        setJournalists(uniqueJournalists);
        setTags(uniqueTags);
      })
      .catch(() => {});
  };

  useEffect(() => { loadStories(); }, [statusFilter, journalistFilter, tagFilter, sort, page]);
  useEffect(() => { loadJournalistsAndTags(); }, []);

  const handleReview = async (storyId, data) => {
    await newsApi.reviewStory(storyId, data);
    addToast('Review submitted successfully.', 'success');
    loadStories();
  };

  const handlePublish = async (storyId) => {
    try {
      await newsApi.publishStory(storyId);
      addToast('Story published to news feed!', 'success');
      loadStories();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Publish failed.', 'error');
    }
  };

  const handleStoryClick = async (story) => {
    setLoadingStory(true);
    try {
      const { data } = await newsApi.getStory(story.id);
      setSelectedStory(data);
      const key = `${story.id}_${story.status}`;
      if (!readStories[key]) {
        const updatedReadStories = { ...readStories, [key]: true };
        setReadStories(updatedReadStories);
        localStorage.setItem('readStories', JSON.stringify(updatedReadStories));
      }
    } catch (err) {
      addToast('Failed to load story details.', 'error');
    } finally {
      setLoadingStory(false);
    }
  };

  const handleStartReview = async (storyId) => {
    try {
      await newsApi.startReview(storyId);
      addToast('Story is now under review.', 'success');
      loadStories();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to start review.', 'error');
    }
  };

  const handleStopReview = async (storyId) => {
    try {
      await newsApi.stopReview(storyId);
      addToast('Review stopped. Story is back in submitted queue.', 'success');
      loadStories();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to stop review.', 'error');
    }
  };

  const handleUnpublish = async (storyId, comment = '') => {
    try {
      await newsApi.unpublishStory(storyId, { comment });
      addToast('Story unpublished and moved to review.', 'success');
      loadStories();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to unpublish story.', 'error');
    }
  };

  const handleDelete = async (storyId) => {
    try {
      await newsApi.deleteStory(storyId);
      addToast('Story deleted successfully.', 'success');
      loadStories();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete story.', 'error');
    }
  };

  const openConfirmModal = (action, storyId) => {
    setConfirmModal({ isOpen: true, action, storyId });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, action: null, storyId: null });
  };

  const handleConfirmAction = (comment = '') => {
    if (confirmModal.action === 'unpublish') {
      handleUnpublish(confirmModal.storyId, comment);
    } else if (confirmModal.action === 'delete') {
      handleDelete(confirmModal.storyId);
    }
    closeConfirmModal();
  };

  return (
    <Layout>
      <div className="editor-toolbar">
        <div>
          <h1 className="gradient-text">Editorial Review</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Review, approve, and publish submitted stories
            {stories.filter(s => !readStories[`${s.id}_${s.status}`]).length > 0 && (
              <span style={{
                background: '#DC2626',
                color: 'white',
                borderRadius: '9999px',
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                marginLeft: '0.5rem',
                verticalAlign: 'middle'
              }}>
                {stories.filter(s => !readStories[`${s.id}_${s.status}`]).length} unread
              </span>
            )}
          </p>
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-chips">
        {['all', 'submitted', 'under_review', 'approved', 'changes_requested', 'rejected', 'published'].map((s) => {
          if (s === 'all') {
            const totalUnread = stories.filter(story => !readStories[`${story.id}_${story.status}`]).length;
            return (
              <button
                key={s}
                className={`filter-chip${statusFilter === s ? ' active' : ''}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                style={{ position: 'relative' }}
              >
                All
                {totalUnread > 0 && (
                  <span style={{
                    background: '#DC2626',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '0.125rem 0.375rem',
                    fontSize: '0.75rem',
                    marginLeft: '0.5rem',
                    minWidth: '1.25rem',
                    textAlign: 'center',
                    display: 'inline-block'
                  }}>
                    {totalUnread}
                  </span>
                )}
              </button>
            );
          }
          const count = stories.filter(story => story.status === s).length;
          const unreadCount = stories.filter(story => story.status === s && !readStories[`${story.id}_${story.status}`]).length;
          return (
            <button
              key={s}
              className={`filter-chip${statusFilter === s ? ' active' : ''}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{ position: 'relative' }}
            >
              {s.replace('_', ' ')}
              {unreadCount > 0 && (
                <span style={{
                  background: '#DC2626',
                  color: 'white',
                  borderRadius: '9999px',
                  padding: '0.125rem 0.375rem',
                  fontSize: '0.75rem',
                  marginLeft: '0.5rem',
                  minWidth: '1.25rem',
                  textAlign: 'center',
                  display: 'inline-block'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={journalistFilter}
            onChange={(e) => { setJournalistFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Journalists</option>
            {journalists.map((j) => (
              <option key={j.id} value={j.id}>{j.first_name} {j.last_name} ({j.username})</option>
            ))}
          </select>
        </div>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={tagFilter}
          onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <StoryGridSkeleton count={4} />
      ) : (
        <div className="story-grid">
          {stories.map((s) => {
            const isUnread = !readStories[`${s.id}_${s.status}`];
            return (
              <div key={s.id}>
                <div
                  onClick={() => handleStoryClick(s)}
                  style={{ cursor: 'pointer', opacity: isUnread ? 1 : 0.6 }}
                >
                  <StoryCard story={s} mode="editor" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {s.status === 'submitted' && (
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleStartReview(s.id)}>
                      Start Review
                    </button>
                  )}
                  {s.status === 'under_review' && (
                    <>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleStoryClick(s)} disabled={loadingStory}>
                        {loadingStory ? 'Loading...' : 'Review'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStopReview(s.id)}>
                        Stop Review
                      </button>
                    </>
                  )}
                  {s.status === 'approved' && (
                    <>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleStoryClick(s)} disabled={loadingStory}>
                        {loadingStory ? 'Loading...' : 'View'}
                      </button>
                      <button className="btn btn-publish btn-sm" onClick={() => handlePublish(s.id)}>
                        <Sparkles size={14} /> Publish
                      </button>
                    </>
                  )}
                  {(s.status === 'changes_requested' || s.status === 'rejected') && (
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleStoryClick(s)} disabled={loadingStory}>
                      {loadingStory ? 'Loading...' : 'View'}
                    </button>
                  )}
                  {s.status === 'published' && (
                    <>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleStoryClick(s)} disabled={loadingStory}>
                        {loadingStory ? 'Loading...' : 'View'}
                      </button>
                      <button className="btn btn-warning btn-sm" onClick={() => openConfirmModal('unpublish', s.id)}>
                        <Archive size={14} /> Unpublish
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => openConfirmModal('delete', s.id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedStory && (
        <StoryReviewModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          onReview={handleReview}
        />
      )}

      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={handleConfirmAction}
          title={confirmModal.action === 'unpublish' ? 'Unpublish Story' : 'Delete Story'}
          message={confirmModal.action === 'unpublish'
            ? 'This will unpublish the story and send it back to review. Are you sure?'
            : 'This will permanently delete the story. This action cannot be undone. Are you sure?'}
          confirmText={confirmModal.action === 'unpublish' ? 'Unpublish' : 'Delete'}
          showComment={confirmModal.action === 'unpublish'}
        />
      )}
    </Layout>
  );
}
