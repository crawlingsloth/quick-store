import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './SellTab.css';

const SellTab = () => {
  const {
    getCurrentStore,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    createOrder,
  } = useApp();

  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customQuantity, setCustomQuantity] = useState('1');

  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  const store = getCurrentStore();
  if (!store) return null;

  // Check if product is available (for inventory tracking)
  const isProductAvailable = (product) => {
    if (!store.trackInventory) return true;
    return product.inventory > 0;
  };

  const getProductStock = (product) => {
    if (!store.trackInventory) return null;
    return product.inventory;
  };

  // Long press handlers
  const handleTouchStart = (product) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      longPressTriggered.current = true;
      setSelectedProduct(product);
      setCustomQuantity('1');
      setShowQuantityModal(true);
    }, 500);
  };

  const handleTouchEnd = (product) => {
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
    const quantity = parseInt(customQuantity);
    if (quantity > 0 && selectedProduct) {
      addToCart(selectedProduct, quantity);
    }
    setShowQuantityModal(false);
    setSelectedProduct(null);
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (customerName.trim() && cart.length > 0) {
      createOrder(customerName.trim());
      setCustomerName('');
      setShowCheckout(false);
    }
  };

  const handleCancelCheckout = () => {
    setShowCheckout(false);
    setCustomerName('');
  };

  // Group products by category
  const productsByCategory = store.products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  return (
    <div className="sell-tab">
      {store.products.length === 0 ? (
        <div className="empty-state">
          <p>No products available</p>
          <p className="hint">Add products in the Products tab first</p>
        </div>
      ) : (
        <>
          <div className="products-grid-container">
            {store.combos.length > 0 && (
              <div className="combos-section">
                <h3>Quick Combos</h3>
                <div className="combos-grid">
                  {store.combos.map(combo => (
                    <button
                      key={combo.id}
                      className="combo-btn"
                      onClick={() => {
                        combo.items.forEach(item => {
                          const product = store.products.find(p => p.id === item.productId);
                          if (product) {
                            addToCart(product, item.quantity);
                          }
                        });
                      }}
                    >
                      <div className="combo-name">{combo.name}</div>
                      <div className="combo-price">${combo.totalPrice.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {Object.entries(productsByCategory).map(([category, products]) => (
              <div key={category} className="category-section">
                <h3>{category}</h3>
                <div className="products-grid">
                  {products.map(product => {
                    const available = isProductAvailable(product);
                    const stock = getProductStock(product);

                    return (
                      <button
                        key={product.id}
                        className={`product-btn ${!available ? 'disabled' : ''}`}
                        onTouchStart={() => handleTouchStart(product)}
                        onTouchEnd={() => handleTouchEnd(product)}
                        onMouseDown={() => handleTouchStart(product)}
                        onMouseUp={() => handleTouchEnd(product)}
                        onMouseLeave={() => {
                          if (longPressTimer.current) {
                            clearTimeout(longPressTimer.current);
                          }
                        }}
                        disabled={!available}
                      >
                        <div className="product-btn-name">{product.name}</div>
                        <div className="product-btn-price">${product.price.toFixed(2)}</div>
                        {stock !== null && (
                          <div className={`product-btn-stock ${stock < 10 ? 'low' : ''}`}>
                            {stock === 0 ? 'Out of stock' : `Stock: ${stock}`}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Display */}
          {cart.length > 0 && (
            <div className="cart">
              <div className="cart-header">
                <h3>Cart</h3>
                <button className="btn-clear-cart" onClick={clearCart}>
                  Clear
                </button>
              </div>

              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.productName}</div>
                      <div className="cart-item-price">
                        ${item.price.toFixed(2)} × {item.quantity} = $
                        {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        className="cart-btn"
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="cart-quantity">{item.quantity}</span>
                      <button
                        className="cart-btn"
                        onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="cart-btn-remove"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <span>Total</span>
                <span className="cart-total-amount">${getCartTotal().toFixed(2)}</span>
              </div>

              <button className="btn-checkout" onClick={() => setShowCheckout(true)}>
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
            <h2>{selectedProduct.name}</h2>
            <form onSubmit={handleQuantitySubmit}>
              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
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
        <div className="modal-overlay" onClick={handleCancelCheckout}>
          <div className="modal checkout-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Checkout</h2>

            <div className="checkout-summary">
              {cart.map(item => (
                <div key={item.productId} className="checkout-item">
                  <span>{item.quantity}× {item.productName}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="checkout-total">
                <strong>Total</strong>
                <strong>${getCartTotal().toFixed(2)}</strong>
              </div>
            </div>

            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label htmlFor="customerName">Customer Name</label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancelCheckout}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-complete">
                  Complete Order
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
