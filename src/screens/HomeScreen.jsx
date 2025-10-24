import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './HomeScreen.css';

const HomeScreen = () => {
  const { stores, selectStore, createStore, deleteStore } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [trackInventory, setTrackInventory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const storeList = Object.values(stores);

  const handleCreateStore = (e) => {
    e.preventDefault();
    if (newStoreName.trim()) {
      createStore(newStoreName.trim(), trackInventory);
      setNewStoreName('');
      setTrackInventory(false);
      setShowAddModal(false);
    }
  };

  const handleDeleteStore = (storeId, storeName) => {
    if (confirm(`Delete store "${storeName}" and all its data? This cannot be undone!`)) {
      deleteStore(storeId);
    }
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="home-screen">
      <div className="home-header">
        <h1>Quick Store</h1>
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
          <button
            className="danger-btn"
            onClick={handleClearAllData}
          >
            Clear All Data
          </button>
        </div>
      )}

      <div className="stores-grid">
        {storeList.length === 0 ? (
          <div className="empty-state">
            <p>No stores yet</p>
            <p className="hint">Tap the + button to create your first store</p>
          </div>
        ) : (
          storeList.map(store => (
            <div
              key={store.id}
              className="store-card"
            >
              <div
                className="store-card-content"
                onClick={() => selectStore(store.id)}
              >
                <h2>{store.name}</h2>
                {store.trackInventory && (
                  <span className="badge">INVENTORY TRACKED</span>
                )}
                <div className="store-stats">
                  <span>{store.products.length} products</span>
                  {store.combos.length > 0 && (
                    <span>{store.combos.length} combos</span>
                  )}
                </div>
              </div>
              <button
                className="delete-store-btn"
                onClick={() => handleDeleteStore(store.id, store.name)}
                aria-label="Delete store"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      <button
        className="fab"
        onClick={() => setShowAddModal(true)}
        aria-label="Add store"
      >
        +
      </button>

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
                  placeholder="e.g., Short Eats"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={trackInventory}
                    onChange={(e) => setTrackInventory(e.target.checked)}
                  />
                  Track Inventory
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Store
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
