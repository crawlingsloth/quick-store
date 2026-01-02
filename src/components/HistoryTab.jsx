/**
 * History Tab - Backend Integration
 *
 * View and manage today's orders with async API operations
 */

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateTextSummary, copyToClipboard } from '../utils/export';
import './HistoryTab.css';

const HistoryTab = () => {
  const {
    getCurrentStore,
    products,
    getTodayOrders,
    getOrders,
    updateOrder,
    deleteOrder,
    clearTodayOrders,
    bulkUpdateOrderPayment,
    currencySymbol,
    loading,
  } = useApp();

  const [orders, setOrders] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editItems, setEditItems] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionResults, setBulkActionResults] = useState(null);

  const store = getCurrentStore();

  // Load orders based on date filter
  const loadOrders = async () => {
    if (!store) return;

    setOrdersLoading(true);
    let fetchedOrders = [];

    if (dateFilter === 'today') {
      fetchedOrders = await getTodayOrders();
    } else if (dateFilter === 'all') {
      fetchedOrders = await getOrders();
    } else if (dateFilter === 'custom' && customDate) {
      fetchedOrders = await getOrders(customDate);
    } else {
      // Calculate date for yesterday, this week, etc.
      const date = getDateForFilter(dateFilter);
      if (date) {
        fetchedOrders = await getOrders(date);
      }
    }

    setOrders(fetchedOrders || []);
    setOrdersLoading(false);
  };

  // Helper to calculate date for different filters
  const getDateForFilter = (filter) => {
    const today = new Date();
    if (filter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    return null;
  };

  useEffect(() => {
    loadOrders();
  }, [store, dateFilter, customDate]);

  // Clear selection when date filter changes
  useEffect(() => {
    clearSelection();
  }, [dateFilter, customDate]);

  if (!store) return null;

  const calculateOrderTotal = (items) => {
    return items.reduce((sum, item) => sum + parseFloat(item.price || 0) * item.quantity, 0);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setEditCustomerName(order.customer_name || '');
    setEditItems(
      order.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
      }))
    );
    setShowEditModal(true);
    setActionError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    setActionLoading(true);
    setActionError('');

    const result = await updateOrder(editingOrder.id, {
      customer_name: editCustomerName || null,
      items: editItems,
    });

    if (result.success) {
      setShowEditModal(false);
      setEditingOrder(null);
      // Reload orders to get updated data
      await loadOrders();
    } else {
      setActionError(result.error || 'Failed to update order');
    }

    setActionLoading(false);
  };

  const handleDeleteOrder = async (order) => {
    if (!confirm(`Delete order for ${order.customer_name || 'Walk-in'}?`)) return;

    setActionLoading(true);
    setActionError('');

    const result = await deleteOrder(order.id);

    if (result.success) {
      // Reload orders after deletion
      await loadOrders();
    } else {
      setActionError(result.error || 'Failed to delete order');
    }

    setActionLoading(false);
  };

  const handleTogglePayment = async (order) => {
    setActionLoading(true);
    setActionError('');

    const result = await updateOrder(order.id, {
      is_paid: !order.is_paid,
    });

    if (result.success) {
      // Reload orders to get updated data
      await loadOrders();
    } else {
      setActionError(result.error || 'Failed to update payment status');
    }

    setActionLoading(false);
  };

  const handleClearToday = async () => {
    setActionLoading(true);
    setActionError('');

    const result = await clearTodayOrders();

    if (result.success) {
      await loadOrders();
    } else if (result.error !== 'Cancelled by user') {
      setActionError(result.error || 'Failed to clear orders');
    }

    setActionLoading(false);
  };

  // Bulk selection functions
  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const selectAllUnpaid = () => {
    const unpaidOrderIds = orders.filter((order) => !order.is_paid).map((order) => order.id);
    setSelectedOrderIds(new Set(unpaidOrderIds));
  };

  const selectAllPaid = () => {
    const paidOrderIds = orders.filter((order) => order.is_paid).map((order) => order.id);
    setSelectedOrderIds(new Set(paidOrderIds));
  };

  const clearSelection = () => {
    setSelectedOrderIds(new Set());
  };

  const handleBulkUpdatePayment = async (isPaid) => {
    const orderIdsArray = Array.from(selectedOrderIds);
    const count = orderIdsArray.length;

    // Confirmation for 5+ orders
    if (count >= 5) {
      const action = isPaid ? 'paid' : 'unpaid';
      if (!confirm(`Mark ${count} orders as ${action}? This action will update all selected orders.`)) {
        return;
      }
    }

    setBulkActionLoading(true);
    setActionError('');
    setBulkActionResults(null);

    const result = await bulkUpdateOrderPayment(orderIdsArray, isPaid);

    if (result.success) {
      const { successful, failed, results } = result.results;

      if (failed === 0) {
        // Complete success
        setActionError('');
        clearSelection();
        await loadOrders();
      } else {
        // Partial failure
        setBulkActionResults(results);
        // Update selection to only include failed orders
        const failedIds = results.filter((r) => !r.success).map((r) => r.order_id);
        setSelectedOrderIds(new Set(failedIds));
        await loadOrders();
        setActionError(
          `Marked ${successful} of ${count} orders. ${failed} failed. Failed orders remain selected.`
        );
      }
    } else {
      setActionError(result.error || 'Failed to update payment status');
    }

    setBulkActionLoading(false);
  };

  const updateEditItemQuantity = (index, quantity) => {
    const newQuantity = parseInt(quantity);
    if (newQuantity <= 0) {
      // Remove item if quantity is 0
      setEditItems(editItems.filter((_, i) => i !== index));
    } else {
      setEditItems(
        editItems.map((item, i) =>
          i === index ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleExport = () => {
    if (orders.length === 0) {
      alert('No orders to export');
      return;
    }

    // Generate CSV
    const headers = [
      'Order ID',
      'Customer Name',
      'Product Name',
      'Quantity',
      'Price',
      'Item Total',
      'Order Total',
      'Created At',
    ];

    const rows = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        rows.push([
          order.id,
          order.customer_name || 'Walk-in',
          item.product_name,
          item.quantity,
          parseFloat(item.price || 0).toFixed(2),
          (parseFloat(item.price || 0) * item.quantity).toFixed(2),
          parseFloat(order.total || 0).toFixed(2),
          new Date(order.created_at).toLocaleString(),
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportSummary = async () => {
    if (orders.length === 0) {
      alert('No orders to export');
      return;
    }

    // Transform orders data to match the format expected by generateTextSummary
    const transformedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        productName: item.product_name,
        price: parseFloat(item.price),
        quantity: item.quantity,
      })),
      total: parseFloat(order.total),
      timestamp: order.created_at,
      customerName: order.customer_name,
      isEdited: order.is_edited,
    }));

    const summary = generateTextSummary(store.name, transformedOrders, new Date(), currencySymbol);
    const success = await copyToClipboard(summary);

    if (success) {
      alert('Summary copied to clipboard! You can now paste it in your message.');
    } else {
      alert('Failed to copy summary. Please try again.');
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

  return (
    <div className="history-tab">
      <div className="history-header">
        <div className="history-stats">
          <div className="stat">
            <span className="stat-label">Orders:</span>
            <span className="stat-value">{orders.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Revenue:</span>
            <span className="stat-value">
              {currencySymbol}
              {totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="history-actions">
          <button
            className="export-btn"
            onClick={handleExportSummary}
            disabled={orders.length === 0 || actionLoading}
          >
            📋 Copy Summary
          </button>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={orders.length === 0 || actionLoading}
          >
            📊 Export CSV
          </button>
          <button
            className="clear-btn"
            onClick={handleClearToday}
            disabled={orders.length === 0 || actionLoading || dateFilter !== 'today'}
          >
            🗑️ Clear Today
          </button>
        </div>
      </div>

      <div className="date-filter-section">
        <div className="date-filter-buttons">
          <button
            className={`filter-btn ${dateFilter === 'today' ? 'active' : ''}`}
            onClick={() => {
              setDateFilter('today');
              setCustomDate('');
            }}
            disabled={actionLoading}
          >
            Today
          </button>
          <button
            className={`filter-btn ${dateFilter === 'yesterday' ? 'active' : ''}`}
            onClick={() => {
              setDateFilter('yesterday');
              setCustomDate('');
            }}
            disabled={actionLoading}
          >
            Yesterday
          </button>
          <button
            className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setDateFilter('all');
              setCustomDate('');
            }}
            disabled={actionLoading}
          >
            All Time
          </button>
        </div>
        <div className="date-picker-group">
          <label htmlFor="customDate">Or pick a date:</label>
          <input
            id="customDate"
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilter('custom');
            }}
            disabled={actionLoading}
          />
        </div>
      </div>

      {/* Bulk Selection UI */}
      {orders.length > 0 && (
        <div className="bulk-select-section">
          <div className="bulk-select-controls">
            {orders.some((order) => !order.is_paid) && (
              <label className="bulk-select-label">
                <input
                  type="checkbox"
                  checked={
                    selectedOrderIds.size > 0 &&
                    orders.filter((o) => !o.is_paid).every((o) => selectedOrderIds.has(o.id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectAllUnpaid();
                    } else {
                      clearSelection();
                    }
                  }}
                  disabled={bulkActionLoading || actionLoading}
                />
                <span>Select All Unpaid ({orders.filter((o) => !o.is_paid).length})</span>
              </label>
            )}
            {orders.some((order) => order.is_paid) && (
              <label className="bulk-select-label">
                <input
                  type="checkbox"
                  checked={
                    selectedOrderIds.size > 0 &&
                    orders.filter((o) => o.is_paid).every((o) => selectedOrderIds.has(o.id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectAllPaid();
                    } else {
                      clearSelection();
                    }
                  }}
                  disabled={bulkActionLoading || actionLoading}
                />
                <span>Select All Paid ({orders.filter((o) => o.is_paid).length})</span>
              </label>
            )}
          </div>

          {selectedOrderIds.size > 0 && (
            <div className="bulk-actions">
              {orders.some((o) => selectedOrderIds.has(o.id) && !o.is_paid) && (
                <button
                  className="bulk-action-btn mark-paid"
                  onClick={() => handleBulkUpdatePayment(true)}
                  disabled={bulkActionLoading || actionLoading}
                >
                  ✓ Mark {selectedOrderIds.size} Selected as Paid
                </button>
              )}
              {orders.some((o) => selectedOrderIds.has(o.id) && o.is_paid) && (
                <button
                  className="bulk-action-btn mark-unpaid"
                  onClick={() => handleBulkUpdatePayment(false)}
                  disabled={bulkActionLoading || actionLoading}
                >
                  💳 Mark {selectedOrderIds.size} Selected as Unpaid
                </button>
              )}
              <button
                className="bulk-action-btn cancel"
                onClick={clearSelection}
                disabled={bulkActionLoading || actionLoading}
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}

      {actionError && (
        <div className="error-message">
          {actionError}
          <button onClick={() => setActionError('')}>×</button>
        </div>
      )}

      {ordersLoading || loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found</p>
          <p className="hint">
            {dateFilter === 'today'
              ? 'Orders will appear here once you make sales'
              : 'Try selecting a different date or time period'}
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className={`order-card ${selectedOrderIds.has(order.id) ? 'selected' : ''}`}>
              <div className="order-header">
                <input
                  type="checkbox"
                  className="order-checkbox"
                  checked={selectedOrderIds.has(order.id)}
                  onChange={() => toggleOrderSelection(order.id)}
                  disabled={bulkActionLoading || actionLoading}
                />
                <div className="order-customer">
                  {order.customer_name || 'Walk-in'}
                  {order.is_edited && <span className="edited-badge">EDITED</span>}
                  <span className={`payment-badge ${order.is_paid ? 'paid' : 'unpaid'}`}>
                    {order.is_paid ? '✓ Paid' : '✗ Unpaid'}
                  </span>
                </div>
                <div className="order-time">
                  {new Date(order.created_at).toLocaleDateString('en-GB')} {new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <span className="item-name">{item.product_name}</span>
                    <span className="item-details">
                      × {item.quantity} = {currencySymbol}
                      {(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  Total: {currencySymbol}
                  {parseFloat(order.total || 0).toFixed(2)}
                </div>
                <div className="order-actions">
                  <button
                    className={`payment-btn ${order.is_paid ? 'paid' : 'unpaid'}`}
                    onClick={() => handleTogglePayment(order)}
                    disabled={actionLoading}
                  >
                    {order.is_paid ? '💳 Mark Unpaid' : '✓ Mark Paid'}
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() => handleEditOrder(order)}
                    disabled={actionLoading}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteOrder(order)}
                    disabled={actionLoading}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowEditModal(false)}>
          <div className="modal edit-order-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Order</h2>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label htmlFor="editCustomerName">Customer Name</label>
                <input
                  id="editCustomerName"
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  placeholder="Walk-in customer"
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label>Order Items</label>
                <div className="edit-items-list">
                  {editItems.map((item, index) => (
                    <div key={index} className="edit-item">
                      <div className="edit-item-name">{item.product_name}</div>
                      <div className="edit-item-controls">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() =>
                            updateEditItemQuantity(index, item.quantity - 1)
                          }
                          disabled={actionLoading}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateEditItemQuantity(index, e.target.value)
                          }
                          className="qty-input"
                          disabled={actionLoading}
                        />
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() =>
                            updateEditItemQuantity(index, item.quantity + 1)
                          }
                          disabled={actionLoading}
                        >
                          +
                        </button>
                        <span className="item-price">
                          {currencySymbol}
                          {(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="edit-total">
                New Total: {currencySymbol}
                {calculateOrderTotal(editItems).toFixed(2)}
              </div>

              {actionError && <div className="form-error">{actionError}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingOrder(null);
                    setActionError('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading || editItems.length === 0}
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
