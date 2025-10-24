import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProductsTab from '../components/ProductsTab';
import SellTab from '../components/SellTab';
import HistoryTab from '../components/HistoryTab';
import './StoreScreen.css';

const StoreScreen = () => {
  const { getCurrentStore, goHome } = useApp();
  const [activeTab, setActiveTab] = useState('sell'); // 'products' | 'sell' | 'history'

  const store = getCurrentStore();

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

  return (
    <div className="store-screen">
      <div className="store-header">
        <button className="back-btn" onClick={goHome} aria-label="Go back">
          ←
        </button>
        <h1>{store.name}</h1>
        <div style={{ width: '44px' }} /> {/* Spacer for centering */}
      </div>

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
