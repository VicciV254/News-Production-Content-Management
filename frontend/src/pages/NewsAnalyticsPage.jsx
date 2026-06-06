import { useEffect, useState } from 'react';
import { Filter, Download } from 'lucide-react';
import Layout from '../components/Layout';
import { newsApi } from '../api/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function NewsAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    newsApi.getReports()
      .then(({ data: reports }) => setData(reports))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="skeleton" style={{ height: 300, borderRadius: '1rem' }} />
      </Layout>
    );
  }

  const journalistData = data?.journalist_data || [];

  // Filter journalists based on search term, category, and tag
  const filteredJournalists = journalistData.filter(journalist => {
    const matchesSearch = 
      journalist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journalist.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || 
      journalist.stories.some(story => story.category === categoryFilter);
    
    const matchesTag = !tagFilter || 
      journalist.stories.some(story => story.tags.includes(tagFilter));
    
    return matchesSearch && matchesCategory && matchesTag;
  });

  // Get all unique categories and tags from the data
  const allCategories = [...new Set(journalistData.flatMap(j => j.stories.map(s => s.category)))];
  const allTags = [...new Set(journalistData.flatMap(j => j.stories.flatMap(s => s.tags)))];

  const handleDownloadPDF = (journalist = null) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('News Analytics Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Period: ${data?.period}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    
    if (journalist) {
      // Download for single journalist
      doc.setFontSize(14);
      doc.text(`Journalist: ${journalist.name} (${journalist.username})`, 14, 46);
      doc.text(`Total Stories: ${journalist.count}`, 14, 52);
      
      if (journalist.count > 0) {
        const tableData = journalist.stories.map(story => [
          story.title,
          story.category,
          story.tags.join(', ') || 'None',
          story.published_at,
          story.is_breaking ? 'Yes' : 'No'
        ]);
        
        autoTable(doc, {
          startY: 60,
          head: [['Title', 'Category', 'Tags', 'Published', 'Breaking']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        });
      } else {
        doc.text('No stories published', 14, 60);
      }
    } else {
      // Download for all journalists
      const tableData = filteredJournalists.map(j => [
        j.name,
        j.username,
        j.count.toString(),
        j.count === 0 ? 'None' : `${j.count} stories`
      ]);
      
      autoTable(doc, {
        startY: 46,
        head: [['Journalist', 'Username', 'Total Stories', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });
    }
    
    doc.save(journalist ? `${journalist.username}_report.pdf` : 'all_journalists_report.pdf');
  };

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text">News Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Editorial performance — {data?.period} — Showing {data?.total_count} published stories
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Filters:</span>
        </div>
        <input
          type="text"
          className="form-input"
          placeholder="Search journalists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '200px' }}
        />
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <button
          className="btn btn-secondary"
          onClick={() => handleDownloadPDF(null)}
          style={{ marginLeft: 'auto' }}
        >
          <Download size={16} style={{ marginRight: '0.5rem' }} />
          Download All Reports
        </button>
      </div>

      <div className="chart-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Journalist</th>
              <th>Username</th>
              <th>Total Stories</th>
              <th>Stories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJournalists.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No journalists found matching the filters
                </td>
              </tr>
            ) : (
              filteredJournalists.map((journalist) => (
                <tr key={journalist.username}>
                  <td style={{ fontWeight: 600 }}>{journalist.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{journalist.username}</td>
                  <td className="mono">{journalist.count}</td>
                  <td>
                    {journalist.count === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>None</span>
                    ) : (
                      <div style={{ fontSize: '0.875rem', maxHeight: '100px', overflowY: 'auto' }}>
                        {journalist.stories.map((story) => (
                          <div key={story.id} style={{ marginBottom: '0.25rem', paddingBottom: '0.25rem', borderBottom: '1px solid #E5E7EB' }}>
                            <div style={{ fontWeight: 500 }}>{story.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Category: {story.category} | Tags: {story.tags.join(', ') || 'None'} | {story.published_at}
                              {story.is_breaking && <span style={{ color: '#DC2626', marginLeft: '0.5rem' }}>Breaking</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadPDF(journalist)}
                      disabled={journalist.count === 0}
                    >
                      <Download size={14} style={{ marginRight: '0.25rem' }} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
