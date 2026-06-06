import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Layout from '../components/Layout';
import StoryCard from '../components/StoryCard';
import { StoryGridSkeleton } from '../components/LoadingSkeleton';
import { newsApi, asList } from '../api/client';

export default function PublishedFeedPage() {
  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('2026-06-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    newsApi.getCategories()
      .then(({ data }) => setCategories(asList(data)))
      .catch(() => setCategories([]));
  }, []);

  const loadFeed = useCallback(() => {
    setLoading(true);
    const params = { page };
    if (search) params.search = search;
    if (category) params.category = category;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    newsApi.getFeed(params)
      .then(({ data }) => {
        setStories(data.results || data);
        if (data.count) setTotalPages(Math.ceil(data.count / 12));
      })
      .finally(() => setLoading(false));
  }, [search, category, dateFrom, dateTo, page]);

  useEffect(() => {
    const timer = setTimeout(loadFeed, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [loadFeed, search]);

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">News Feed</h1>
        <p style={{ color: 'var(--text-muted)' }}>Latest published stories from our broadcast team</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search stories..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search stories"
          />
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', cursor: 'pointer' }}
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            aria-label="From date"
          />
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto', cursor: 'pointer' }}
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            aria-label="To date"
          />
        </div>
      </div>

      <div className="filter-chips">
        <button className={`filter-chip${!category ? ' active' : ''}`} onClick={() => { setCategory(''); setPage(1); }}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            className={`filter-chip${category === c.slug ? ' active' : ''}`}
            onClick={() => { setCategory(c.slug); setPage(1); }}
            style={category === c.slug ? { borderColor: c.color_hex, color: c.color_hex } : {}}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <StoryGridSkeleton />
      ) : stories.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No published stories found.</p>
      ) : (
        <>
          <div className="story-grid">
            {stories.map((s) => (
              <StoryCard key={s.id} story={s} mode="feed" onClick={() => navigate(`/feed/${s.slug}`)} />
            ))}
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
    </Layout>
  );
}
