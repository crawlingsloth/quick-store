import { createContext, useContext, useState, useEffect } from 'react';
import * as storage from '../utils/storage';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [stores, setStores] = useState({});
  const [currentStoreId, setCurrentStoreId] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'store'
  const [cart, setCart] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load stores from localStorage on mount
  useEffect(() => {
    loadStores();
  }, [refreshTrigger]);

  const loadStores = () => {
    const loadedStores = storage.getAllStores();
    setStores(loadedStores);
  };

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // ============ STORE OPERATIONS ============

  const createStore = (name, trackInventory) => {
    const newStore = storage.createStore(name, trackInventory);
    refresh();
    return newStore;
  };

  const updateStore = (storeId, updates) => {
    const updated = storage.updateStore(storeId, updates);
    refresh();
    return updated;
  };

  const deleteStore = (storeId) => {
    storage.deleteStore(storeId);
    if (currentStoreId === storeId) {
      setCurrentStoreId(null);
      setCurrentScreen('home');
    }
    refresh();
  };

  const selectStore = (storeId) => {
    setCurrentStoreId(storeId);
    setCurrentScreen('store');
    setCart([]);
  };

  const goHome = () => {
    setCurrentStoreId(null);
    setCurrentScreen('home');
    setCart([]);
  };

  // ============ PRODUCT OPERATIONS ============

  const addProduct = (product) => {
    if (!currentStoreId) return null;
    const newProduct = storage.addProduct(currentStoreId, product);
    refresh();
    return newProduct;
  };

  const updateProduct = (productId, updates) => {
    if (!currentStoreId) return null;
    const updated = storage.updateProduct(currentStoreId, productId, updates);
    refresh();
    return updated;
  };

  const deleteProduct = (productId) => {
    if (!currentStoreId) return;
    storage.deleteProduct(currentStoreId, productId);
    refresh();
  };

  // ============ COMBO OPERATIONS ============

  const addCombo = (combo) => {
    if (!currentStoreId) return null;
    const newCombo = storage.addCombo(currentStoreId, combo);
    refresh();
    return newCombo;
  };

  const updateCombo = (comboId, updates) => {
    if (!currentStoreId) return null;
    const updated = storage.updateCombo(currentStoreId, comboId, updates);
    refresh();
    return updated;
  };

  const deleteCombo = (comboId) => {
    if (!currentStoreId) return;
    storage.deleteCombo(currentStoreId, comboId);
    refresh();
  };

  // ============ CART OPERATIONS ============

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity,
          },
        ];
      }
    });
  };

  const updateCartItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // ============ ORDER OPERATIONS ============

  const createOrder = (customerName) => {
    if (!currentStoreId || cart.length === 0) return null;

    const newOrder = storage.createOrder(currentStoreId, customerName, cart);
    clearCart();
    refresh();
    return newOrder;
  };

  const updateOrder = (orderId, updates) => {
    const updated = storage.updateOrder(orderId, updates);
    refresh();
    return updated;
  };

  const deleteOrder = (orderId) => {
    storage.deleteOrder(orderId);
    refresh();
  };

  const getTodayOrders = () => {
    if (!currentStoreId) return [];
    return storage.getOrdersByDate(currentStoreId, new Date());
  };

  const clearTodayOrders = () => {
    if (!currentStoreId) return;
    if (confirm('Clear all orders for today? This cannot be undone!')) {
      storage.clearTodayOrders(currentStoreId);
      refresh();
    }
  };

  // ============ UTILITY ============

  const getCurrentStore = () => {
    return currentStoreId ? stores[currentStoreId] : null;
  };

  const value = {
    // State
    stores,
    currentStoreId,
    currentScreen,
    cart,

    // Store operations
    createStore,
    updateStore,
    deleteStore,
    selectStore,
    goHome,
    getCurrentStore,

    // Product operations
    addProduct,
    updateProduct,
    deleteProduct,

    // Combo operations
    addCombo,
    updateCombo,
    deleteCombo,

    // Cart operations
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,

    // Order operations
    createOrder,
    updateOrder,
    deleteOrder,
    getTodayOrders,
    clearTodayOrders,

    // Utility
    refresh,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
