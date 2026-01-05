/**
 * Sell Tab - Backend Integration
 *
 * POS interface for processing sales with async API operations
 */

import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './SellTab.css';

const SellTab = () => {
  const {
    getCurrentStore,
    products,
    combos,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    createOrder,
    getCustomerNames,
    currencySymbol,
    loading,
  } = useApp();

  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [allCustomerNames, setAllCustomerNames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customQuantity, setCustomQuantity] = useState('1');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  const store = getCurrentStore();

  // Load customer names for autocomplete
  useEffect(() => {
    const loadCustomerNames = async () => {
      const names = await getCustomerNames();
      setAllCustomerNames(names);
    };

    if (store) {
      loadCustomerNames();
    }
  }, [store]);

  if (!store) return null;

  // Check if product is available (for inventory tracking)
  const isProductAvailable = (product) => {
    if (!store.track_inventory) return true;
    return product.inventory !== null && product.inventory !== undefined && product.inventory > 0;
  };

  const getProductStock = (product) => {
    if (!store.track_inventory) return null;
    return product.inventory;
  };

  // Long press handlers for mobile
  const handleTouchStart = (e, product) => {
    e.preventDefault();
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      longPressTriggered.current = true;
      setSelectedProduct(product);
      setCustomQuantity('1');
      setShowQuantityModal(true);
    }, 500);
  };

  const handleTouchEnd = (e, product) => {
    e.preventDefault();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    if (!longPressTriggered.current && isProductAvailable(product)) {
      // Regular tap - add 1
      addToCart(product, 1);
    }
  };

  const handleQuantitySubmit = (e) => {
    e.preventDefault();
    const quantity = parseFloat(customQuantity);
    if (quantity > 0 && selectedProduct) {
      addToCart(selectedProduct, quantity);
    }
    setShowQuantityModal(false);
    setSelectedProduct(null);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      setActionError('Cart is empty');
      return;
    }

    setActionLoading(true);
    setActionError('');

    const result = await createOrder(customerName.trim() || null, isPaid);

    if (result.success) {
      setCustomerName('');
      setIsPaid(false);
      setShowCheckout(false);
      // Reload customer names after successful order
      const names = await getCustomerNames();
      setAllCustomerNames(names);
    } else {
      setActionError(result.error || 'Failed to create order');
    }

    setActionLoading(false);
  };

  const handleCancelCheckout = () => {
    setShowCheckout(false);
    setCustomerName('');
    setIsPaid(false);
    setCustomerSuggestions([]);
    setShowSuggestions(false);
    setActionError('');
  };

  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    setCustomerName(value);

    // Search for suggestions from backend customer names
    if (value.trim()) {
      const suggestions = allCustomerNames.filter((name) =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setCustomerSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (name) => {
    setCustomerName(name);
    setCustomerSuggestions([]);
    setShowSuggestions(false);
  };

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  return (
    <div className="sell-tab">
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>No products available</p>
          <p className="hint">Add products in the Products tab first</p>
        </div>
      ) : (
        <>
          <div className="products-grid-container">
            {combos.length > 0 && (
              <div className="combos-section">
                <h3>Quick Combos</h3>
                <div className="combos-grid">
                  {combos.map((combo) => (
                    <button
                      key={combo.id}
                      className="combo-btn"
                      onClick={() => {
                        combo.items.forEach((item) => {
                          const product = products.find((p) => p.id === item.product_id);
                          if (product) {
                            addToCart(product, item.quantity);
                          }
                        });
                      }}
                      disabled={actionLoading}
                    >
                      <div className="combo-name">{combo.name}</div>
                      <div className="combo-price">
                        {currencySymbol}
                        {parseFloat(combo.total_price).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="products-grid">
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category} className="category-section">
                  <h3 className="category-title">{category}</h3>
                  <div className="category-products">
                    {categoryProducts.map((product) => {
                      const available = isProductAvailable(product);
                      const stock = getProductStock(product);
                      return (
                        <button
                          key={product.id}
                          className={`product-btn ${!available ? 'out-of-stock' : ''}`}
                          onTouchStart={(e) => handleTouchStart(e, product)}
                          onTouchEnd={(e) => handleTouchEnd(e, product)}
                          onClick={() => available && addToCart(product, 1)}
                          disabled={!available || actionLoading}
                        >
                          <div className="product-btn-name">{product.name}</div>
                          <div className="product-btn-price">
                            {currencySymbol}
                            {parseFloat(product.price).toFixed(2)}
                            {product.base_unit && ` (${product.base_unit})`}
                          </div>
                          {stock !== null && stock !== undefined && (
                            <div className={`product-btn-stock ${stock < 10 ? 'low' : ''}`}>
                              {stock > 0 ? `${parseFloat(stock).toFixed(2)} ${product.base_unit || ''} left` : 'Out of stock'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="cart-section">
              <div className="cart-header">
                <h3>Cart ({cart.length})</h3>
                <button className="clear-cart-btn" onClick={clearCart} disabled={actionLoading}>
                  Clear
                </button>
              </div>

              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.product_id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.product_name}</div>
                      <div className="cart-item-price">
                        {currencySymbol}
                        {parseFloat(item.price).toFixed(2)} × {parseFloat(item.quantity).toFixed(4)} {item.unit || ''}
                      </div>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateCartItemQuantity(item.product_id, item.quantity - (item.unit ? 0.1 : 1))}
                        disabled={actionLoading}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="qty-input"
                        step={item.unit ? "0.0001" : "1"}
                        min="0.0001"
                        value={parseFloat(item.quantity).toFixed(item.unit ? 4 : 0)}
                        onChange={(e) => {
                          const newQty = parseFloat(e.target.value);
                          if (newQty > 0) {
                            updateCartItemQuantity(item.product_id, newQty);
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        disabled={actionLoading}
                      />
                      <button
                        className="qty-btn"
                        onClick={() => updateCartItemQuantity(item.product_id, item.quantity + (item.unit ? 0.1 : 1))}
                        disabled={actionLoading}
                      >
                        +
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.product_id)}
                        disabled={actionLoading}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">
                  {currencySymbol}
                  {getCartTotal().toFixed(2)}
                </span>
              </div>

              <button
                className="checkout-btn"
                onClick={() => setShowCheckout(true)}
                disabled={actionLoading}
              >
                Checkout
              </button>
            </div>
          )}
        </>
      )}

      {/* Quantity Modal */}
      {showQuantityModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowQuantityModal(false)}>
          <div className="modal quantity-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Select Quantity</h2>
            <p className="product-modal-name">{selectedProduct.name}</p>
            <form onSubmit={handleQuantitySubmit}>
              <div className="form-group">
                <label htmlFor="quantity">
                  Quantity{selectedProduct.base_unit && ` (${selectedProduct.base_unit})`}
                </label>
                <input
                  id="quantity"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowQuantityModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay" onClick={() => !actionLoading && handleCancelCheckout()}>
          <div className="modal checkout-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Checkout</h2>

            <div className="checkout-summary">
              <div className="checkout-items">
                {cart.map((item) => (
                  <div key={item.product_id} className="checkout-item">
                    <span>{item.product_name}</span>
                    <span>
                      × {parseFloat(item.quantity).toFixed(4)} {item.unit || ''} = {currencySymbol}
                      {(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="checkout-total">
                <strong>Total: {currencySymbol}{getCartTotal().toFixed(2)}</strong>
              </div>
            </div>

            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label htmlFor="customerName">Customer Name (optional)</label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={handleCustomerNameChange}
                  placeholder="Walk-in customer"
                  autoFocus
                  disabled={actionLoading}
                  autoComplete="off"
                />
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {customerSuggestions.map((name, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(name)}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group checkbox-group">
                <label htmlFor="isPaid" className="checkbox-label">
                  <input
                    id="isPaid"
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    disabled={actionLoading}
                  />
                  <span>Mark as paid</span>
                </label>
              </div>

              {actionError && (
                <div className="form-error">{actionError}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelCheckout}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellTab;
