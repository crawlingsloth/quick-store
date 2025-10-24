import { AppProvider, useApp } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import StoreScreen from './screens/StoreScreen';
import './App.css';

function AppContent() {
  const { currentScreen } = useApp();

  return (
    <div className="app">
      {currentScreen === 'home' ? <HomeScreen /> : <StoreScreen />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
