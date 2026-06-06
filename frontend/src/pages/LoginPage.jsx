import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { authApi } from '../api/client';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
    role: 'journalist',
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(username, password);
      addToast(`Welcome back, ${user.first_name || user.username}!`, 'success');
      if (user.role === 'journalist') navigate('/stories');
      else if (user.role === 'editor' || user.role === 'admin') navigate('/review');
      else navigate('/feed');
    } catch {
      addToast('incorrect username or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.register(registerData);
      localStorage.setItem('token', response.data.token);
      addToast(`Account created successfully! Welcome, ${response.data.user.first_name || response.data.user.username}!`, 'success');
      if (response.data.user.role === 'journalist') navigate('/stories');
      else if (response.data.user.role === 'editor' || response.data.user.role === 'admin') navigate('/review');
      else navigate('/feed');
      window.location.reload();
    } catch (err) {
      addToast(err.response?.data?.username?.[0] || err.response?.data?.password?.[0] || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in-up">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Radio size={40} color="#3B82F6" style={{ marginBottom: '0.5rem' }} />
          <h1 className="gradient-text" style={{ fontSize: '1.75rem' }}>Broadcast News CMS</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Create a new account' : 'Sign in to your editorial account'}
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/feed')}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          ← Back to News Feed
        </button>

        {!isRegister ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-username">Username</label>
              <input
                id="reg-username"
                className="form-input"
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-firstname">First Name</label>
                <input
                  id="reg-firstname"
                  className="form-input"
                  value={registerData.first_name}
                  onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                  autoComplete="given-name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-lastname">Last Name</label>
                <input
                  id="reg-lastname"
                  className="form-input"
                  value={registerData.last_name}
                  onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">Role</label>
              <select
                id="reg-role"
                className="form-select"
                value={registerData.role}
                onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
              >
                <option value="journalist">Journalist</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                className="form-input"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                className="form-input"
                value={registerData.confirm_password}
                onChange={(e) => setRegisterData({ ...registerData, confirm_password: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'transparent', border: 'none', color: '#3B82F6', textDecoration: 'underline' }}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
