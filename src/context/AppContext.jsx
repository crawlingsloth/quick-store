/**
 * App Context - Backend Integration
 *
 * Manages application state with backend API integration
 * All operations are async and use the backend API
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api, { setCurrentStoreId, removeCurrentStoreId } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // State
  const [store, setStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadInitialData();
    }
  }, [isAuthenticated, user]);

  /**
   * Load store, products, and combos
   */
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all stores for the company
      try {
        const storesData = await api.listStores();
        setStores(storesData);

        // If there's at least one store, set it as current
        if (storesData.length > 0) {
          setStore(storesData[0]);
          setCurrentStoreId(storesData[0].id);

          // Load products and combos for the first store
          const [productsData, combosData] = await Promise.all([
            api.listProducts(),
            api.listCombos(),
          ]);

          setProducts(productsData);
          setCombos(combosData);
        } else {
          setStore(null);
          removeCurrentStoreId();
          setProducts([]);
          setCombos([]);
        }
      } catch (err) {
        // No stores exist yet - user needs to create one
        console.log('No stores found, user needs to create one');
        setStores([]);
        setStore(null);
        setProducts([]);
        setCombos([]);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get currency symbol from company or default
   */
  const getCurrencySymbol = () => {
    return user?.company?.currency_symbol || '$';
  };

  // ============ STORE OPERATIONS ============

  const createStore = async (name, trackInventory) => {
    setLoading(true);
    setError(null);

    try {
      const newStore = await api.createStore({
        name,
        track_inventory: trackInventory,
      });

      setStore(newStore);
      setCurrentStoreId(newStore.id);
      setStores([...stores, newStore]);
      setCurrentScreen('home');

      // Reload initial data to refresh stores list
      await loadInitialData();

      return { success: true, store: newStore };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateStore = async (updates) => {
    if (!store) return { success: false, error: 'No store selected' };

    setLoading(true);
    setError(null);

    try {
      const updated = await api.updateStore(store.id, {
        name: updates.name,
        track_inventory: updates.trackInventory,
      });

      setStore(updated);
      // Update the store in the stores array as well
      setStores(stores.map(s => s.id === updated.id ? updated : s));
      return { success: true, store: updated };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteStore = async (storeId) => {
    if (!storeId) return { success: false, error: 'No store ID provided' };

    setLoading(true);
    setError(null);

    try {
      await api.deleteStore(storeId);

      // Remove the deleted store from the stores list
      setStores(stores.filter(s => s.id !== storeId));

      // If the deleted store was the current store, clear it
      if (store && store.id === storeId) {
        setStore(null);
        removeCurrentStoreId();
        setProducts([]);
        setCombos([]);
        setCart([]);
      }

      setCurrentScreen('home');

      // Reload initial data to refresh stores list
      await loadInitialData();

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const selectStore = async (storeId = null) => {
    if (storeId) {
      // Find and set the specific store
      const selectedStore = stores.find(s => s.id === storeId);
      if (selectedStore) {
        setStore(selectedStore);
        setCurrentStoreId(selectedStore.id);
        // Load products and combos for the selected store
        setLoading(true);
        try {
          const [productsData, combosData] = await Promise.all([
            api.listProducts(),
            api.listCombos(),
          ]);
          setProducts(productsData);
          setCombos(combosData);
        } catch (err) {
          console.error('Failed to load store data:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    setCurrentScreen('store');
    setCart([]);
  };

  const goHome = () => {
    setCurrentScreen('home');
    setCart([]);
  };

  // ============ PRODUCT OPERATIONS ============

  const addProduct = async (product) => {
    if (!store) return { success: false, error: 'No store selected' };

    setLoading(true);
    setError(null);

    try {
      const newProduct = await api.createProduct({
        name: product.name,
        price: parseFloat(product.price),
        category: product.category || null,
        inventory: product.inventory !== undefined ? parseInt(product.inventory) : null,
      });

      setProducts((prev) => [...prev, newProduct]);
      return { success: true, product: newProduct };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await api.updateProduct(productId, {
        name: updates.name,
        price: parseFloat(updates.price),
        category: updates.category || null,
        inventory: updates.inventory !== undefined ? parseInt(updates.inventory) : null,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p))
      );
      return { success: true, product: updated };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    setLoading(true);
    setError(null);

    try {
      await api.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reload products from backend
   */
  const reloadProducts = async () => {
    try {
      const productsData = await api.listProducts();
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to reload products:', err);
    }
  };

  // ============ COMBO OPERATIONS ============

  const addCombo = async (combo) => {
    if (!store) return { success: false, error: 'No store selected' };

    setLoading(true);
    setError(null);

    try {
      const newCombo = await api.createCombo({
        name: combo.name,
        items: combo.items.map((item) => ({
          product_id: item.productId,
          quantity: parseInt(item.quantity),
        })),
      });

      setCombos((prev) => [...prev, newCombo]);
      return { success: true, combo: newCombo };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateCombo = async (comboId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updated = await api.updateCombo(comboId, {
        name: updates.name,
        items: updates.items.map((item) => ({
          product_id: item.productId,
          quantity: parseInt(item.quantity),
        })),
      });

      setCombos((prev) =>
        prev.map((c) => (c.id === comboId ? updated : c))
      );
      return { success: true, combo: updated };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteCombo = async (comboId) => {
    setLoading(true);
    setError(null);

    try {
      await api.deleteCombo(comboId);
      setCombos((prev) => prev.filter((c) => c.id !== comboId));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ============ CART OPERATIONS ============

  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product_id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            product_id: product.id,
            product_name: product.name,
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
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // ============ ORDER OPERATIONS ============

  const createOrder = async (customerName, isPaid = false) => {
    if (!store || cart.length === 0) {
      return { success: false, error: 'Cart is empty or no store selected' };
    }

    setLoading(true);
    setError(null);

    try {
      const newOrder = await api.createOrder({
        customer_name: customerName || null,
        items: cart,
        is_paid: isPaid,
      });

      clearCart();
      // Reload products to get updated inventory
      await reloadProducts();

      return { success: true, order: newOrder };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (orderId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        customer_name: updates.customer_name || updates.customerName || null,
        items: updates.items,
      };

      // Add is_paid if provided
      if (updates.is_paid !== undefined) {
        updateData.is_paid = updates.is_paid;
      }

      const updated = await api.updateOrder(orderId, updateData);

      // Reload products to get updated inventory
      await reloadProducts();

      return { success: true, order: updated };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    setLoading(true);
    setError(null);

    try {
      await api.deleteOrder(orderId);

      // Reload products to get updated inventory
      await reloadProducts();

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getTodayOrders = async () => {
    if (!store) return [];

    try {
      const orders = await api.listTodayOrders();
      return orders;
    } catch (err) {
      console.error('Failed to get today orders:', err);
      return [];
    }
  };

  const getOrders = async (dateFilter = null) => {
    if (!store) return [];

    try {
      const orders = await api.listOrders(dateFilter);
      return orders;
    } catch (err) {
      console.error('Failed to get orders:', err);
      return [];
    }
  };

  const clearTodayOrders = async () => {
    if (!store) return { success: false, error: 'No store selected' };

    if (!confirm('Clear all orders for today? This cannot be undone!')) {
      return { success: false, error: 'Cancelled by user' };
    }

    setLoading(true);
    setError(null);

    try {
      const orders = await api.listTodayOrders();
      for (const order of orders) {
        await api.deleteOrder(order.id);
      }

      // Reload products to get updated inventory
      await reloadProducts();

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ============ CUSTOMER OPERATIONS ============

  const getCustomerNames = async () => {
    try {
      const names = await api.getCustomerNames();
      return names;
    } catch (err) {
      console.error('Failed to get customer names:', err);
      return [];
    }
  };

  // ============ UTILITY ============

  const getCurrentStore = () => {
    return store;
  };

  const value = {
    // State
    store,
    stores,
    products,
    combos,
    currentScreen,
    cart,
    loading,
    error,
    currencySymbol: getCurrencySymbol(),

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
    reloadProducts,

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
    getOrders,
    clearTodayOrders,

    // Customer operations
    getCustomerNames,

    // Data refresh
    loadInitialData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
