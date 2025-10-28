/**
 * Home Screen - Backend Integration
 *
 * Displays store information and allows creation/deletion
 * Note: In the backend model, there's ONE store per company
 */

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './HomeScreen.css';

const HomeScreen = () => {
  const { store, stores, selectStore, createStore, updateStore, deleteStore, currencySymbol, loading } = useApp();
  const { user, logout } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [editStoreName, setEditStoreName] = useState('');
  const [editTrackInventory, setEditTrackInventory] = useState(false);
  const [trackInventory, setTrackInventory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (newStoreName.trim()) {
      setActionLoading(true);
      setActionError('');

      const result = await createStore(newStoreName.trim(), trackInventory);

      if (result.success) {
        setNewStoreName('');
        setTrackInventory(false);
        setShowAddModal(false);
      } else {
        setActionError(result.error || 'Failed to create store');
      }

      setActionLoading(false);
    }
  };

  const handleDeleteStore = async (storeToDelete) => {
    if (!storeToDelete) return;

    if (confirm(`Delete store "${storeToDelete.name}" and all its data? This cannot be undone!`)) {
      setActionLoading(true);
      setActionError('');

      const result = await deleteStore(storeToDelete.id);

      if (!result.success) {
        setActionError(result.error || 'Failed to delete store');
      }

      setActionLoading(false);
    }
  };

  const handleEditStore = (storeToEdit) => {
    setEditingStore(storeToEdit);
    setEditStoreName(storeToEdit.name);
    setEditTrackInventory(storeToEdit.track_inventory);
    setShowEditModal(true);
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (!editingStore || !editStoreName.trim()) return;

    setActionLoading(true);
    setActionError('');

    const result = await updateStore({
      name: editStoreName.trim(),
      trackInventory: editTrackInventory,
    });

    if (result.success) {
      setEditStoreName('');
      setEditTrackInventory(false);
      setShowEditModal(false);
      setEditingStore(null);
    } else {
      setActionError(result.error || 'Failed to update store');
    }

    setActionLoading(false);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleSelectStore = (storeId) => {
    selectStore(storeId);
  };

  return (
    <div className="home-screen">
      <div className="home-header">
        <h1>QuickStore</h1>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Settings"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="user-info">
            <p><strong>User:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Company:</strong> {user?.company?.name || 'No company'}</p>
            <p><strong>Currency:</strong> {currencySymbol}</p>
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}

      {actionError && (
        <div className="error-message">
          {actionError}
          <button onClick={() => setActionError('')}>×</button>
        </div>
      )}

      <div className="stores-grid">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="empty-state">
            <p>No stores yet</p>
            <p className="hint">Tap the + button to create your first store</p>
          </div>
        ) : (
          stores.map((storeItem) => (
            <div key={storeItem.id} className="store-card">
              <div
                className="store-card-content"
                onClick={() => handleSelectStore(storeItem.id)}
              >
                <h2>{storeItem.name}</h2>
                {storeItem.track_inventory && (
                  <span className="badge">INVENTORY TRACKED</span>
                )}
                <div className="store-stats">
                  <span>Click to manage</span>
                </div>
              </div>
              <div className="store-card-actions">
                <button
                  className="edit-store-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditStore(storeItem);
                  }}
                  aria-label="Edit store"
                  disabled={actionLoading}
                >
                  ✏️
                </button>
                <button
                  className="delete-store-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStore(storeItem);
                  }}
                  aria-label="Delete store"
                  disabled={actionLoading}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {user?.company && stores.length < user.company.max_stores && (
        <button
          className="fab"
          onClick={() => setShowAddModal(true)}
          aria-label="Add store"
          disabled={actionLoading}
        >
          +
        </button>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Store</h2>
            <form onSubmit={handleCreateStore}>
              <div className="form-group">
                <label htmlFor="storeName">Store Name</label>
                <input
                  id="storeName"
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g., Downtown Coffee Shop"
                  autoFocus
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={trackInventory}
                    onChange={(e) => setTrackInventory(e.target.checked)}
                    disabled={actionLoading}
                  />
                  Track Inventory
                </label>
              </div>

              {actionError && (
                <div className="form-error">
                  {actionError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setActionError('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {showEditModal && editingStore && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Store</h2>
            <form onSubmit={handleUpdateStore}>
              <div className="form-group">
                <label htmlFor="editStoreName">Store Name</label>
                <input
                  id="editStoreName"
                  type="text"
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  placeholder="e.g., Downtown Coffee Shop"
                  autoFocus
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editTrackInventory}
                    onChange={(e) => setEditTrackInventory(e.target.checked)}
                    disabled={actionLoading}
                  />
                  Track Inventory
                </label>
              </div>

              {actionError && (
                <div className="form-error">
                  {actionError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStore(null);
                    setActionError('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Updating...' : 'Update Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
