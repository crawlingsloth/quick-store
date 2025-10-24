// Storage utility for managing localStorage operations
// Handles stores, orders, and sessions data

const STORAGE_KEYS = {
  STORES: 'quickstore_stores',
  ORDERS: 'quickstore_orders',
  SESSIONS: 'quickstore_sessions',
};

// Generate unique IDs
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generic localStorage helpers
const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Please export and clear old data.');
      alert('Storage quota exceeded! Please export and clear old orders to free up space.');
    } else {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
    return false;
  }
};

// ============ STORES ============

export const getAllStores = () => {
  return getFromStorage(STORAGE_KEYS.STORES, {});
};

export const getStore = (storeId) => {
  const stores = getAllStores();
  return stores[storeId] || null;
};

export const createStore = (name, trackInventory = false) => {
  const stores = getAllStores();
  const newStore = {
    id: generateId(),
    name,
    trackInventory,
    products: [],
    combos: [],
  };
  stores[newStore.id] = newStore;
  saveToStorage(STORAGE_KEYS.STORES, stores);
  return newStore;
};

export const updateStore = (storeId, updates) => {
  const stores = getAllStores();
  if (stores[storeId]) {
    stores[storeId] = { ...stores[storeId], ...updates };
    saveToStorage(STORAGE_KEYS.STORES, stores);
    return stores[storeId];
  }
  return null;
};

export const deleteStore = (storeId) => {
  const stores = getAllStores();
  delete stores[storeId];
  saveToStorage(STORAGE_KEYS.STORES, stores);

  // Also delete associated orders and sessions
  const orders = getAllOrders();
  const filteredOrders = Object.keys(orders).reduce((acc, orderId) => {
    if (orders[orderId].storeId !== storeId) {
      acc[orderId] = orders[orderId];
    }
    return acc;
  }, {});
  saveToStorage(STORAGE_KEYS.ORDERS, filteredOrders);

  const sessions = getAllSessions();
  const filteredSessions = Object.keys(sessions).reduce((acc, sessionId) => {
    if (sessions[sessionId].storeId !== storeId) {
      acc[sessionId] = sessions[sessionId];
    }
    return acc;
  }, {});
  saveToStorage(STORAGE_KEYS.SESSIONS, filteredSessions);
};

// ============ PRODUCTS ============

export const addProduct = (storeId, product) => {
  const stores = getAllStores();
  if (stores[storeId]) {
    const newProduct = {
      id: generateId(),
      name: product.name,
      price: parseFloat(product.price),
      category: product.category || '',
      inventory: stores[storeId].trackInventory ? (parseInt(product.inventory) || 0) : undefined,
    };
    stores[storeId].products.push(newProduct);
    saveToStorage(STORAGE_KEYS.STORES, stores);
    return newProduct;
  }
  return null;
};

export const updateProduct = (storeId, productId, updates) => {
  const stores = getAllStores();
  if (stores[storeId]) {
    const productIndex = stores[storeId].products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      stores[storeId].products[productIndex] = {
        ...stores[storeId].products[productIndex],
        ...updates,
      };
      saveToStorage(STORAGE_KEYS.STORES, stores);
      return stores[storeId].products[productIndex];
    }
  }
  return null;
};

export const deleteProduct = (storeId, productId) => {
  const stores = getAllStores();
  if (stores[storeId]) {
    stores[storeId].products = stores[storeId].products.filter(p => p.id !== productId);
    saveToStorage(STORAGE_KEYS.STORES, stores);
  }
};

export const updateInventory = (storeId, productId, quantity) => {
  const stores = getAllStores();
  if (stores[storeId]) {
    const product = stores[storeId].products.find(p => p.id === productId);
    if (product && product.inventory !== undefined) {
      product.inventory = Math.max(0, product.inventory + quantity);
      saveToStorage(STORAGE_KEYS.STORES, stores);
      return product.inventory;
    }
  }
  return null;
};

// ============ COMBOS ============

export const addCombo = (storeId, combo) => {
  const stores = getAllStores();
  if (stores[storeId]) {
    const newCombo = {
      id: generateId(),
      name: combo.name,
      items: combo.items,
      totalPrice: parseFloat(combo.totalPrice),
    };
    stores[storeId].combos.push(newCombo);
    saveToStorage(STORAGE_KEYS.STORES, stores);
    return newCombo;
  }
  return null;
};

export const updateCombo = (storeId, comboId, updates) => {
  const stores = getAllStores();
  if (stores[storeId]) {
    const comboIndex = stores[storeId].combos.findIndex(c => c.id === comboId);
    if (comboIndex !== -1) {
      stores[storeId].combos[comboIndex] = {
        ...stores[storeId].combos[comboIndex],
        ...updates,
      };
      saveToStorage(STORAGE_KEYS.STORES, stores);
      return stores[storeId].combos[comboIndex];
    }
  }
  return null;
};

export const deleteCombo = (storeId, comboId) => {
  const stores = getAllStores();
  if (stores[storeId]) {
    stores[storeId].combos = stores[storeId].combos.filter(c => c.id !== comboId);
    saveToStorage(STORAGE_KEYS.STORES, stores);
  }
};

// ============ ORDERS ============

export const getAllOrders = () => {
  return getFromStorage(STORAGE_KEYS.ORDERS, {});
};

export const getOrdersByStore = (storeId) => {
  const orders = getAllOrders();
  return Object.values(orders).filter(order => order.storeId === storeId);
};

export const getOrdersByDate = (storeId, date) => {
  const orders = getOrdersByStore(storeId);
  const targetDate = new Date(date).toDateString();
  return orders.filter(order => {
    return new Date(order.timestamp).toDateString() === targetDate;
  });
};

export const createOrder = (storeId, customerName, items) => {
  const orders = getAllOrders();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const newOrder = {
    id: generateId(),
    storeId,
    customerName,
    items,
    total,
    timestamp: new Date().toISOString(),
    isEdited: false,
    editHistory: [],
  };

  orders[newOrder.id] = newOrder;
  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  // Update inventory if tracked
  const store = getStore(storeId);
  if (store && store.trackInventory) {
    items.forEach(item => {
      updateInventory(storeId, item.productId, -item.quantity);
    });
  }

  // Update or create today's session
  updateSession(storeId, newOrder.id);

  return newOrder;
};

export const updateOrder = (orderId, updates) => {
  const orders = getAllOrders();
  if (orders[orderId]) {
    const oldOrder = { ...orders[orderId] };

    orders[orderId] = {
      ...oldOrder,
      ...updates,
      isEdited: true,
      editHistory: [
        ...oldOrder.editHistory,
        {
          timestamp: new Date().toISOString(),
          previousState: {
            customerName: oldOrder.customerName,
            items: oldOrder.items,
            total: oldOrder.total,
          },
        },
      ],
    };

    // Adjust inventory if needed
    const store = getStore(orders[orderId].storeId);
    if (store && store.trackInventory && updates.items) {
      // Return old inventory
      oldOrder.items.forEach(item => {
        updateInventory(orders[orderId].storeId, item.productId, item.quantity);
      });
      // Deduct new inventory
      updates.items.forEach(item => {
        updateInventory(orders[orderId].storeId, item.productId, -item.quantity);
      });
    }

    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    return orders[orderId];
  }
  return null;
};

export const deleteOrder = (orderId) => {
  const orders = getAllOrders();
  if (orders[orderId]) {
    const order = orders[orderId];

    // Return inventory if tracked
    const store = getStore(order.storeId);
    if (store && store.trackInventory) {
      order.items.forEach(item => {
        updateInventory(order.storeId, item.productId, item.quantity);
      });
    }

    delete orders[orderId];
    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    // Remove from session
    removeFromSession(order.storeId, orderId);
  }
};

// ============ SESSIONS ============

export const getAllSessions = () => {
  return getFromStorage(STORAGE_KEYS.SESSIONS, {});
};

export const getTodaySession = (storeId) => {
  const sessions = getAllSessions();
  const today = new Date().toDateString();

  return Object.values(sessions).find(session => {
    return session.storeId === storeId &&
           new Date(session.date).toDateString() === today;
  });
};

const updateSession = (storeId, orderId) => {
  const sessions = getAllSessions();
  const today = new Date().toISOString();
  let session = getTodaySession(storeId);

  if (session) {
    if (!session.orderIds.includes(orderId)) {
      session.orderIds.push(orderId);
    }
  } else {
    session = {
      id: generateId(),
      storeId,
      date: today,
      orderIds: [orderId],
      exported: false,
    };
    sessions[session.id] = session;
  }

  saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
};

const removeFromSession = (storeId, orderId) => {
  const sessions = getAllSessions();
  const session = getTodaySession(storeId);

  if (session) {
    session.orderIds = session.orderIds.filter(id => id !== orderId);
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
  }
};

export const markSessionAsExported = (sessionId) => {
  const sessions = getAllSessions();
  if (sessions[sessionId]) {
    sessions[sessionId].exported = true;
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
  }
};

export const clearTodayOrders = (storeId) => {
  const session = getTodaySession(storeId);
  if (session) {
    const orders = getAllOrders();
    session.orderIds.forEach(orderId => {
      if (orders[orderId]) {
        deleteOrder(orderId);
      }
    });

    const sessions = getAllSessions();
    delete sessions[session.id];
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
  }
};

// ============ DATA MANAGEMENT ============

export const clearAllData = () => {
  if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
    localStorage.removeItem(STORAGE_KEYS.STORES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    return true;
  }
  return false;
};

export const exportAllData = () => {
  return {
    stores: getAllStores(),
    orders: getAllOrders(),
    sessions: getAllSessions(),
    exportDate: new Date().toISOString(),
  };
};

export const importData = (data) => {
  try {
    if (data.stores) saveToStorage(STORAGE_KEYS.STORES, data.stores);
    if (data.orders) saveToStorage(STORAGE_KEYS.ORDERS, data.orders);
    if (data.sessions) saveToStorage(STORAGE_KEYS.SESSIONS, data.sessions);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};
