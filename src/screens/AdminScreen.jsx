/**
 * Admin Screen - User and Company Management
 *
 * Interface for admin to manage companies and users
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminScreen.css';

const AdminScreen = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'companies'

  // State
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // Form data
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    company_id: '',
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    currency_symbol: '$',
    max_stores: 1,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'users') {
        const usersData = await api.listUsers();
        setUsers(usersData);
      } else {
        const companiesData = await api.listCompanies();
        setCompanies(companiesData);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCompaniesForDropdown = async () => {
    try {
      const companiesData = await api.listCompanies();
      setCompanies(companiesData);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  // Create company
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.createCompany(companyForm);
      setShowCreateCompanyModal(false);
      setCompanyForm({ name: '', currency_symbol: '$', max_stores: 1 });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  // Edit company
  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setCompanyForm({
      name: company.name,
      currency_symbol: company.currency_symbol,
      max_stores: company.max_stores,
    });
    setShowEditCompanyModal(true);
  };

  // Update company
  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!editingCompany) return;

    setLoading(true);
    setError('');

    try {
      await api.updateCompany(editingCompany.id, companyForm);
      setShowEditCompanyModal(false);
      setEditingCompany(null);
      setCompanyForm({ name: '', currency_symbol: '$', max_stores: 1 });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.createUser({
        ...userForm,
        role: 'user',
      });
      setShowCreateUserModal(false);
      setUserForm({ username: '', email: '', password: '', company_id: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Toggle user active status
  const handleToggleUserStatus = async (user) => {
    setLoading(true);
    setError('');

    try {
      await api.updateUser(user.id, {
        username: user.username,
        email: user.email,
        is_active: !user.is_active,
      });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password length
    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setShowChangePasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-screen">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="logout-btn"
            onClick={() => setShowChangePasswordModal(true)}
            style={{ background: 'rgba(255, 255, 255, 0.15)' }}
          >
            Change Password
          </button>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          Companies
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="content-header">
            <h2>User Management</h2>
            <button
              className="btn-primary"
              onClick={async () => {
                await loadCompaniesForDropdown();
                setShowCreateUserModal(true);
              }}
              disabled={loading}
            >
              + Create User
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="users-list">
              {users.length === 0 ? (
                <div className="empty-state">
                  <p>No users yet</p>
                  <p className="hint">Create your first user to get started</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.company?.name || 'N/A'}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {user.role !== 'admin' && (
                            <button
                              className={`btn-toggle ${user.is_active ? 'deactivate' : 'activate'}`}
                              onClick={() => handleToggleUserStatus(user)}
                              disabled={loading}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <div className="admin-content">
          <div className="content-header">
            <h2>Company Management</h2>
            <button
              className="btn-primary"
              onClick={() => setShowCreateCompanyModal(true)}
              disabled={loading}
            >
              + Create Company
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading companies...</p>
            </div>
          ) : (
            <div className="companies-list">
              {companies.length === 0 ? (
                <div className="empty-state">
                  <p>No companies yet</p>
                  <p className="hint">Create your first company to get started</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Currency</th>
                      <th>Max Stores</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td>{company.name}</td>
                        <td>{company.currency_symbol}</td>
                        <td>{company.max_stores}</td>
                        <td>{new Date(company.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditCompany(company)}
                            disabled={loading}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateCompanyModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowCreateCompanyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Company</h2>
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input
                  id="companyName"
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="e.g., My Coffee Shop"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="currencySymbol">Currency Symbol</label>
                <input
                  id="currencySymbol"
                  type="text"
                  value={companyForm.currency_symbol}
                  onChange={(e) => setCompanyForm({ ...companyForm, currency_symbol: e.target.value })}
                  placeholder="$, €, £, ¥, ₹"
                  maxLength={3}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxStores">Maximum Stores</label>
                <input
                  id="maxStores"
                  type="number"
                  value={companyForm.max_stores}
                  onChange={(e) => setCompanyForm({ ...companyForm, max_stores: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  min="1"
                  required
                  disabled={loading}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCreateCompanyModal(false);
                    setCompanyForm({ name: '', currency_symbol: '$', max_stores: 1 });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditCompanyModal && editingCompany && (
        <div className="modal-overlay" onClick={() => !loading && setShowEditCompanyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Company</h2>
            <form onSubmit={handleUpdateCompany}>
              <div className="form-group">
                <label htmlFor="editCompanyName">Company Name</label>
                <input
                  id="editCompanyName"
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="e.g., My Coffee Shop"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editCurrencySymbol">Currency Symbol</label>
                <input
                  id="editCurrencySymbol"
                  type="text"
                  value={companyForm.currency_symbol}
                  onChange={(e) => setCompanyForm({ ...companyForm, currency_symbol: e.target.value })}
                  placeholder="$, €, £, ¥, ₹"
                  maxLength={3}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editMaxStores">Maximum Stores</label>
                <input
                  id="editMaxStores"
                  type="number"
                  value={companyForm.max_stores}
                  onChange={(e) => setCompanyForm({ ...companyForm, max_stores: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  min="1"
                  required
                  disabled={loading}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditCompanyModal(false);
                    setEditingCompany(null);
                    setCompanyForm({ name: '', currency_symbol: '$', max_stores: 1 });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowCreateUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="e.g., john_doe"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Secure password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="company">Company</label>
                <select
                  id="company"
                  value={userForm.company_id}
                  onChange={(e) => setUserForm({ ...userForm, company_id: e.target.value })}
                  required
                  disabled={loading}
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setUserForm({ username: '', email: '', password: '', company_id: '' });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowChangePasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setError('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScreen;
