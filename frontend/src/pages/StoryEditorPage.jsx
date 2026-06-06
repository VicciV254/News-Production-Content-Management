import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Save, Send, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import RichTextEditor from '../components/RichTextEditor';
import DeadlineWidget from '../components/DeadlineWidget';
import { newsApi, asList } from '../api/client';
import { useToast } from '../components/Toast';
import { countWords, timeAgo } from '../utils/format';

export default function StoryEditorPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('draft');
  const [editorialNote, setEditorialNote] = useState(null);
  const [preview, setPreview] = useState(false);
  const [saveState, setSaveState] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const [storyId, setStoryId] = useState(isNew ? null : id);
  const dirtyRef = useRef(false);
  const autoSaveRef = useRef(null);

  const wordCount = countWords(body);

  const loadCategories = useCallback(() => {
    newsApi.getCategories()
      .then(({ data }) => setCategories(asList(data)))
      .catch(() => setCategories([]));
  }, []);

  const loadStory = useCallback(() => {
    if (isNew) return;
    newsApi.getStory(id).then(({ data }) => {
      setTitle(data.title);
      setSummary(data.summary || '');
      setBody(data.body || '');
      setCategoryId(String(data.category?.id || ''));
      setIsBreaking(data.is_breaking);
      setTags((data.tags || []).map((t) => t.name));
      setStatus(data.status);
      setEditorialNote(data.editorial_note);
      setLastSaved(data.updated_at);
    });
  }, [id, isNew]);

  useEffect(() => {
    loadCategories();
    loadStory();
  }, [loadCategories, loadStory]);

  const saveDraft = useCallback(async (silent = false) => {
    if (!title.trim() || !categoryId) {
      if (!silent) addToast('Title and category are required.', 'error');
      return;
    }
    setSaveState('saving');
    const payload = {
      title,
      summary,
      body,
      category_id: Number(categoryId),
      is_breaking: isBreaking,
      tag_names: tags,
    };

    try {
      let data;
      if (storyId) {
        ({ data } = await newsApi.updateStory(storyId, payload));
      } else {
        ({ data } = await newsApi.createStory(payload));
        setStoryId(data.id);
        navigate(`/stories/${data.id}/edit`, { replace: true });
      }
      setLastSaved(data.updated_at || new Date().toISOString());
      setSaveState('saved');
      dirtyRef.current = false;
      if (!silent) addToast('Draft saved.', 'success');
    } catch {
      setSaveState('unsaved');
      if (!silent) addToast('Failed to save draft.', 'error');
    }
  }, [title, summary, body, categoryId, isBreaking, tags, storyId, navigate, addToast]);

  useEffect(() => {
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    autoSaveRef.current = setInterval(() => {
      if (dirtyRef.current && title.trim() && categoryId) {
        saveDraft(true);
      }
    }, 60000);
    return () => clearInterval(autoSaveRef.current);
  }, [saveDraft, title, categoryId]);

  const markDirty = () => {
    dirtyRef.current = true;
    setSaveState('unsaved');
  };

  const handleSubmit = async () => {
    await saveDraft(true);
    if (!storyId) return;
    try {
      await newsApi.submitStory(storyId);
      addToast('Story submitted for editorial review!', 'success');
      navigate('/stories');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Submit failed.', 'error');
    }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        markDirty();
      }
      setTagInput('');
    }
  };

  const safePreview = DOMPurify.sanitize(body, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'title'],
  });

  const canEdit = status === 'draft' || status === 'changes_requested';

  return (
    <Layout sidebar={<DeadlineWidget />}>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      {editorialNote && status === 'changes_requested' && (
        <div className="alert alert-danger">
          <strong>Editor feedback ({editorialNote.reviewer?.first_name || 'Editor'}):</strong>{' '}
          {editorialNote.comment}
        </div>
      )}

      <div className="editor-toolbar">
        <div className="save-indicator">
          <span className={`save-dot ${saveState === 'saving' ? 'saving' : saveState === 'unsaved' ? 'unsaved' : ''}`} />
          {saveState === 'saving' && 'Saving...'}
          {saveState === 'unsaved' && 'Unsaved changes'}
          {saveState === 'saved' && lastSaved && `Saved ${timeAgo(lastSaved)}`}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPreview(!preview)}>
            {preview ? <><EyeOff size={16} /> Edit</> : <><Eye size={16} /> Preview</>}
          </button>
          {canEdit && (
            <>
              <button className="btn btn-secondary" onClick={() => saveDraft(false)}>
                <Save size={16} /> Save Draft
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                <Send size={16} /> Submit for Review
              </button>
            </>
          )}
        </div>
      </div>

      {preview ? (
        <div className="preview-panel fade-in-up">
          <h1>{title || 'Untitled Story'}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{summary}</p>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: safePreview }} />
        </div>
      ) : (
        <>
          <input
            className="title-input"
            placeholder="Story headline..."
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            disabled={!canEdit}
            aria-label="Story title"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); markDirty(); }}
                disabled={!canEdit}
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} style={{ borderLeft: `4px solid ${c.color_hex}` }}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Breaking News</label>
              <div className="toggle-row">
                <button
                  type="button"
                  className={`toggle${isBreaking ? ' active' : ''}`}
                  onClick={() => { setIsBreaking(!isBreaking); markDirty(); }}
                  disabled={!canEdit}
                  aria-pressed={isBreaking}
                >
                  <span className="toggle-knob" />
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {isBreaking ? 'Marked as breaking news' : 'Standard story'}
                </span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Summary <span className="mono" style={{ fontWeight: 400 }}>({summary.length}/300)</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              maxLength={300}
              value={summary}
              onChange={(e) => { setSummary(e.target.value); markDirty(); }}
              disabled={!canEdit}
              placeholder="Brief summary for the news feed..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <input
              className="form-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              disabled={!canEdit}
              placeholder="Type a tag and press Enter"
            />
            <div className="tag-chips">
              {tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  {canEdit && (
                    <button type="button" onClick={() => { setTags(tags.filter((t) => t !== tag)); markDirty(); }} aria-label={`Remove tag ${tag}`}>×</button>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Story Body</label>
            <RichTextEditor
              value={body}
              onChange={(val) => { setBody(val); markDirty(); }}
              readOnly={!canEdit}
            />
            <div className="word-count-footer mono">{wordCount} words</div>
          </div>
        </>
      )}
    </Layout>
  );
}
