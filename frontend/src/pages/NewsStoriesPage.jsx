import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import StoryCard from '../components/StoryCard';
import DeadlineWidget from '../components/DeadlineWidget';
import ConfirmModal from '../components/ConfirmModal';
import { StoryGridSkeleton } from '../components/LoadingSkeleton';
import { newsApi } from '../api/client';
import { useToast } from '../components/Toast';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
];

export default function NewsStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [readStories, setReadStories] = useState(() => {
    const saved = localStorage.getItem('journalistReadStories');
    return saved ? JSON.parse(saved) : {};
  });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, storyId: null });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const params = { page };
    if (statusFilter) params.status = statusFilter;

    newsApi.getStories(params)
      .then(({ data }) => {
        setStories(data.results || data);
        if (data.count) setTotalPages(Math.ceil(data.count / 25));
      })
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  const handleStoryClick = (story) => {
    const key = `${story.id}_${story.status}`;
    if (!readStories[key]) {
      const updatedReadStories = { ...readStories, [key]: true };
      setReadStories(updatedReadStories);
      localStorage.setItem('journalistReadStories', JSON.stringify(updatedReadStories));
    }
    navigate(`/stories/${story.id}/edit`);
  };

  const handleDelete = async (storyId) => {
    try {
      await newsApi.deleteStory(storyId);
      addToast('Story deleted successfully.', 'success');
      setLoading(true);
      newsApi.getStories({ page, status: statusFilter })
        .then(({ data }) => {
          setStories(data.results || data);
          if (data.count) setTotalPages(Math.ceil(data.count / 25));
        })
        .finally(() => setLoading(false));
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete story.', 'error');
    }
  };

  const openConfirmModal = (storyId) => {
    setConfirmModal({ isOpen: true, storyId });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, storyId: null });
  };

  const handleConfirmAction = () => {
    if (confirmModal.storyId) {
      handleDelete(confirmModal.storyId);
    }
    closeConfirmModal();
  };

  return (
    <Layout sidebar={<DeadlineWidget />}>
      <div className="editor-toolbar">
        <div>
          <h1 className="gradient-text">My Stories</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your news drafts and submissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/stories/new')}>
          <Plus size={18} /> New Story
        </button>
      </div>

      <div className="filter-chips" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map((f) => {
          if (f.value === '') return (
            <button
              key={f.value}
              className={`filter-chip${statusFilter === f.value ? ' active' : ''}`}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
            >
              {f.label}
            </button>
          );
          const count = stories.filter(s => s.status === f.value).length;
          const unreadCount = stories.filter(s => s.status === f.value && !readStories[`${s.id}_${s.status}`]).length;
          return (
            <button
              key={f.value}
              className={`filter-chip${statusFilter === f.value ? ' active' : ''}`}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              style={{ position: 'relative' }}
            >
              {f.label}
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

      {loading ? (
        <StoryGridSkeleton />
      ) : stories.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          No stories found. Create your first story!
        </p>
      ) : (
        <>
          <div className="story-grid">
            {stories.map((s) => {
              const isUnread = !readStories[`${s.id}_${s.status}`];
              const canDelete = s.status === 'draft' || s.status === 'archived';
              return (
                <div key={s.id}>
                  <div
                    onClick={() => handleStoryClick(s)}
                    style={{ cursor: 'pointer', opacity: isUnread ? 1 : 0.6 }}
                  >
                    <StoryCard story={s} mode="journalist" />
                  </div>
                  {canDelete && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginTop: '0.5rem', width: '100%' }}
                      onClick={(e) => { e.stopPropagation(); openConfirmModal(s.id); }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={handleConfirmAction}
          title="Delete Story"
          message="This will permanently delete the story. This action cannot be undone. Are you sure?"
          confirmText="Delete"
        />
      )}
    </Layout>
  );
}
