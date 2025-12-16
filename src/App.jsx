import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import StoreScreen from './screens/StoreScreen';
import LoginScreen from './screens/LoginScreen';
import AdminScreen from './screens/AdminScreen';
import { removeCurrentCompanyId, removeCurrentStoreId } from './services/api';
import './App.css';

function AppContent() {
  const { currentScreen, loadInitialData } = useApp();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [adminSelectedStore, setAdminSelectedStore] = useState(null);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show admin panel if user is admin
  if (isAdmin) {
    // If admin has selected a store, show the store screen
    if (adminSelectedStore) {
      return (
        <div className="app">
          <div className="admin-store-header">
            <button
              className="back-to-admin-btn"
              onClick={() => {
                setAdminSelectedStore(null);
                removeCurrentCompanyId();
                removeCurrentStoreId();
              }}
            >
              ← Back to Admin Panel
            </button>
            <span className="admin-store-info">
              Managing: {adminSelectedStore.name} ({adminSelectedStore.company_name})
            </span>
          </div>
          <StoreScreen />
        </div>
      );
    }

    return (
      <AdminScreen
        onSelectStore={(store) => {
          setAdminSelectedStore(store);
          // Reload data for the selected store
          loadInitialData();
        }}
      />
    );
  }

  // Show main app once authenticated (regular users)
  return (
    <div className="app">
      {currentScreen === 'home' ? <HomeScreen /> : <StoreScreen />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
