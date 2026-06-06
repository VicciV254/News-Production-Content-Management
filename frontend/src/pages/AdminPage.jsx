import { useEffect, useState } from 'react';
import { Shield, UserPlus, Trash2, Edit, Check, X, Users } from 'lucide-react';
import Layout from '../components/Layout';
import { authApi } from '../api/client';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
    role: 'journalist',
  });
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();

  const loadUsers = () => {
    setLoading(true);
    authApi.getUsers()
      .then(({ data }) => {
        const usersList = Array.isArray(data) ? data : (data.results || []);
        setUsers(usersList);
      })
      .catch(() => addToast('Failed to load users.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await authApi.createUser(formData);
      addToast('User created successfully.', 'success');
      setShowAddModal(false);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirm_password: '',
        role: 'journalist',
      });
      loadUsers();
    } catch (err) {
      addToast(err.response?.data?.username?.[0] || err.response?.data?.password?.[0] || 'Failed to create user.', 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await authApi.updateUser(selectedUser.id, {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        is_active: formData.is_active,
      });
      addToast('User updated successfully.', 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      addToast('Failed to update user.', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await authApi.deleteUser(userId);
      addToast('User deleted successfully.', 'success');
      loadUsers();
    } catch (err) {
      addToast('Failed to delete user.', 'error');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await authApi.deactivateUser(user.id);
        addToast('User deactivated.', 'success');
      } else {
        await authApi.activateUser(user.id);
        addToast('User activated.', 'success');
      }
      loadUsers();
    } catch (err) {
      addToast('Failed to toggle user status.', 'error');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active,
    });
    setShowEditModal(true);
  };

  const isCurrentUser = selectedUser?.id === currentUser?.id;

  const editors = users.filter(u => u.role === 'editor');
  const journalists = users.filter(u => u.role === 'journalist');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <Layout>
      <div className="editor-toolbar">
        <div>
          <h1 className="gradient-text" style={{ color: '#DC2626' }}>
            <Shield size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage users and permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 400, borderRadius: '1rem' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Admins Section */}
          <div>
            <h2 style={{ marginBottom: '1rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} /> Admins ({admins.length})
            </h2>
            <div className="data-table" style={{ background: 'var(--card-bg)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#FEE2E2' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Username</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>{user.username}</td>
                      <td style={{ padding: '1rem' }}>{user.first_name} {user.last_name}</td>
                      <td style={{ padding: '1rem' }}>{user.email}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', background: user.is_active ? '#D1FAE5' : '#FEE2E2', color: user.is_active ? '#065F46' : '#991B1B' }}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(user)}>
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Editors Section */}
          <div>
            <h2 style={{ marginBottom: '1rem', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} /> Editors ({editors.length})
            </h2>
            <div className="data-table" style={{ background: 'var(--card-bg)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#DBEAFE' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Username</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {editors.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>{user.username}</td>
                      <td style={{ padding: '1rem' }}>{user.first_name} {user.last_name}</td>
                      <td style={{ padding: '1rem' }}>{user.email}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', background: user.is_active ? '#D1FAE5' : '#FEE2E2', color: user.is_active ? '#065F46' : '#991B1B' }}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(user)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleToggleActive(user)}>
                          {user.is_active ? <X size={14} /> : <Check size={14} />}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Journalists Section */}
          <div>
            <h2 style={{ marginBottom: '1rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} /> Journalists ({journalists.length})
            </h2>
            <div className="data-table" style={{ background: 'var(--card-bg)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#D1FAE5' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Username</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {journalists.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>{user.username}</td>
                      <td style={{ padding: '1rem' }}>{user.first_name} {user.last_name}</td>
                      <td style={{ padding: '1rem' }}>{user.email}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', background: user.is_active ? '#D1FAE5' : '#FEE2E2', color: user.is_active ? '#065F46' : '#991B1B' }}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(user)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleToggleActive(user)}>
                          {user.is_active ? <X size={14} /> : <Check size={14} />}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
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
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="journalist">Journalist</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Create User</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Edit User: {selectedUser.username}</h2>
            <form onSubmit={handleUpdateUser}>
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
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={isCurrentUser}
                >
                  <option value="journalist">Journalist</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                {isCurrentUser && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    You cannot change your own role.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Update User</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
