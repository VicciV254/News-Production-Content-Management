import { useState, useEffect } from 'react';
import { User, Save, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, loadUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      // Only include password fields if user is trying to change password
      if (formData.new_password) {
        if (!formData.current_password) {
          addToast('Current password is required to change password.', 'error');
          setLoading(false);
          return;
        }
        if (formData.new_password !== formData.confirm_password) {
          addToast('New passwords do not match.', 'error');
          setLoading(false);
          return;
        }
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }

      await authApi.updateProfile(updateData);
      addToast('Profile updated successfully!', 'success');
      loadUser(); // Reload user data
      setFormData({
        ...formData,
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="editor-toolbar">
        <div>
          <h1 className="gradient-text">My Profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>Update your account details</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              value={user?.username || ''}
              disabled
              style={{ background: '#F3F4F6' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Username cannot be changed
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <input
              className="form-input"
              value={user?.role || ''}
              disabled
              style={{ background: '#F3F4F6', textTransform: 'capitalize' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Role is managed by administrators
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                className="form-input"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #E5E7EB' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Change Password</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Leave blank if you don't want to change your password
            </p>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                className="form-input"
                type="password"
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }} disabled={loading}>
            <Save size={16} style={{ marginRight: '0.5rem' }} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
