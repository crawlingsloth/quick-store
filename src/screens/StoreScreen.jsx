import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProductsTab from '../components/ProductsTab';
import SellTab from '../components/SellTab';
import HistoryTab from '../components/HistoryTab';
import './StoreScreen.css';

const StoreScreen = () => {
  const { getCurrentStore, goHome, stores, selectStore } = useApp();
  const [activeTab, setActiveTab] = useState('sell'); // 'products' | 'sell' | 'history'
  const [showStoreSwitcher, setShowStoreSwitcher] = useState(false);

  const store = getCurrentStore();
  const storeList = Object.values(stores);

  if (!store) {
    return (
      <div className="store-screen">
        <div className="error-state">
          <p>Store not found</p>
          <button onClick={goHome}>Go Home</button>
        </div>
      </div>
    );
  }

  const handleSwitchStore = (storeId) => {
    selectStore(storeId);
    setShowStoreSwitcher(false);
    setActiveTab('sell'); // Reset to sell tab when switching
  };

  return (
    <div className="store-screen">
      <div className="store-header">
        <button className="back-btn" onClick={goHome} aria-label="Go back">
          ←
        </button>
        <h1>{store.name}</h1>
        {storeList.length > 1 && (
          <button
            className="store-switch-btn"
            onClick={() => setShowStoreSwitcher(!showStoreSwitcher)}
            aria-label="Switch store"
          >
            ⇄
          </button>
        )}
        {storeList.length === 1 && (
          <div style={{ width: '44px' }} />
        )}
      </div>

      {/* Store Switcher Dropdown */}
      {showStoreSwitcher && (
        <div className="store-switcher-overlay" onClick={() => setShowStoreSwitcher(false)}>
          <div className="store-switcher-menu" onClick={(e) => e.stopPropagation()}>
            <h3>Switch Store</h3>
            <div className="store-switcher-list">
              {storeList.map(s => (
                <button
                  key={s.id}
                  className={`store-switcher-item ${s.id === store.id ? 'active' : ''}`}
                  onClick={() => handleSwitchStore(s.id)}
                  disabled={s.id === store.id}
                >
                  <div className="store-switcher-name">{s.name}</div>
                  <div className="store-switcher-info">
                    {s.products.length} products
                    {s.combos.length > 0 && ` • ${s.combos.length} combos`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={`tab ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          Sell
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'sell' && <SellTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </div>
  );
};

export default StoreScreen;
