import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportTodayAsSummary, exportTodayAsCSV, copyToClipboard } from '../utils/export';
import * as storage from '../utils/storage';
import './HistoryTab.css';

const HistoryTab = () => {
  const { getCurrentStore, getTodayOrders, updateOrder, deleteOrder, clearTodayOrders } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const store = getCurrentStore();
  const orders = getTodayOrders();

  if (!store) return null;

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setEditItems([...order.items]);
    setEditCustomerName(order.customerName);
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editingOrder) {
      const total = editItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      updateOrder(editingOrder.id, {
        customerName: editCustomerName,
        items: editItems,
        total,
      });
      setShowEditModal(false);
      setEditingOrder(null);
    }
  };

  const handleDeleteOrder = (order) => {
    if (confirm(`Delete order for ${order.customerName}?`)) {
      deleteOrder(order.id);
    }
  };

  const updateEditItemQuantity = (index, quantity) => {
    if (quantity <= 0) {
      setEditItems(editItems.filter((_, i) => i !== index));
    } else {
      const newItems = [...editItems];
      newItems[index].quantity = quantity;
      setEditItems(newItems);
    }
  };

  const handleExportSummary = async () => {
    const success = await exportTodayAsSummary(store.name, orders);
    if (success) {
      alert('Summary copied to clipboard!');
    } else {
      alert('Failed to copy summary');
    }
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    const success = exportTodayAsCSV(store.name, orders);
    if (success) {
      alert('CSV downloaded!');
    } else {
      alert('Failed to download CSV');
    }
    setShowExportMenu(false);
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="history-tab">
      <div className="history-header">
        <div className="history-stats">
          <div className="stat">
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Orders</div>
          </div>
          <div className="stat">
            <div className="stat-value">${totalRevenue.toFixed(2)}</div>
            <div className="stat-label">Revenue</div>
          </div>
        </div>

        <div className="history-actions">
          <button
            className="btn-export"
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            Export Today
          </button>
          {orders.length > 0 && (
            <button className="btn-clear" onClick={clearTodayOrders}>
              Clear Today
            </button>
          )}
        </div>

        {showExportMenu && (
          <div className="export-menu">
            <button onClick={handleExportSummary}>Copy Summary</button>
            <button onClick={handleExportCSV}>Download CSV</button>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders today</p>
          <p className="hint">Orders will appear here after checkout</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-time">{formatTime(order.timestamp)}</div>
                  {order.isEdited && <span className="edited-badge">EDITED</span>}
                </div>

                <div className="order-customer">{order.customerName}</div>

                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span>
                        {item.quantity}× {item.productName}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  <strong>Total</strong>
                  <strong>${order.total.toFixed(2)}</strong>
                </div>

                <div className="order-actions">
                  <button
                    className="btn-edit-order"
                    onClick={() => handleEditOrder(order)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete-order"
                    onClick={() => handleDeleteOrder(order)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal edit-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Order</h2>
              <span className="edited-badge">EDITED</span>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label htmlFor="editCustomerName">Customer Name</label>
                <input
                  id="editCustomerName"
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Items</label>
                <div className="edit-items-list">
                  {editItems.map((item, index) => (
                    <div key={index} className="edit-item">
                      <div className="edit-item-info">
                        <div>{item.productName}</div>
                        <div className="edit-item-price">
                          ${item.price.toFixed(2)} each
                        </div>
                      </div>
                      <div className="edit-item-controls">
                        <button
                          type="button"
                          className="cart-btn"
                          onClick={() => updateEditItemQuantity(index, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="cart-quantity">{item.quantity}</span>
                        <button
                          type="button"
                          className="cart-btn"
                          onClick={() => updateEditItemQuantity(index, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editItems.length > 0 && (
                <div className="edit-total">
                  <strong>New Total:</strong>
                  <strong>
                    ${editItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                  </strong>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editItems.length === 0}
                >
                  Save Changes
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
