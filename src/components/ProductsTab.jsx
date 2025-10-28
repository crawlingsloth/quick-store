/**
 * Products Tab - Backend Integration
 *
 * Manages products with async API operations
 */

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './ProductsTab.css';

const ProductsTab = () => {
  const {
    getCurrentStore,
    products,
    combos,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStore,
    currencySymbol,
    loading
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    inventory: '',
  });

  const store = getCurrentStore();
  if (!store) return null;

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');

    const productData = {
      name: formData.name,
      price: formData.price,
      category: formData.category || null,
    };

    if (store.track_inventory && formData.inventory) {
      productData.inventory = formData.inventory;
    }

    const result = await addProduct(productData);

    if (result.success) {
      resetForm();
      setShowAddModal(false);
    } else {
      setActionError(result.error || 'Failed to add product');
    }

    setActionLoading(false);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setActionLoading(true);
    setActionError('');

    const updates = {
      name: formData.name,
      price: formData.price,
      category: formData.category || null,
    };

    if (store.track_inventory) {
      updates.inventory = formData.inventory;
    }

    const result = await updateProduct(editingProduct.id, updates);

    if (result.success) {
      resetForm();
      setEditingProduct(null);
      setShowEditModal(false);
    } else {
      setActionError(result.error || 'Failed to update product');
    }

    setActionLoading(false);
  };

  const handleDeleteProduct = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;

    setActionLoading(true);
    setActionError('');

    const result = await deleteProduct(product.id);

    if (!result.success) {
      setActionError(result.error || 'Failed to delete product');
    }

    setActionLoading(false);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category || '',
      inventory: product.inventory !== undefined && product.inventory !== null ? product.inventory.toString() : '',
    });
    setShowEditModal(true);
    setActionError('');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      inventory: '',
    });
  };

  const toggleInventoryTracking = async () => {
    setActionLoading(true);
    setActionError('');

    const result = await updateStore({
      name: store.name,
      trackInventory: !store.track_inventory,
    });

    if (!result.success) {
      setActionError(result.error || 'Failed to update store');
    }

    setActionLoading(false);
  };

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  return (
    <div className="products-tab">
      <div className="products-header">
        <div className="inventory-toggle">
          <label>
            <input
              type="checkbox"
              checked={store.track_inventory}
              onChange={toggleInventoryTracking}
              disabled={actionLoading || loading}
            />
            Track Inventory
          </label>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          disabled={actionLoading || loading}
        >
          + Add Product
        </button>
      </div>

      {combos.length > 0 && (
        <div className="combos-info">
          <p>📦 {combos.length} combo{combos.length !== 1 ? 's' : ''} configured</p>
        </div>
      )}

      {actionError && (
        <div className="error-message">
          {actionError}
          <button onClick={() => setActionError('')}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>No products yet</p>
          <p className="hint">Add your first product to get started</p>
        </div>
      ) : (
        <div className="products-list">
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
            <div key={category} className="category-group">
              <h3 className="category-header">{category}</h3>
              {categoryProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">
                      {currencySymbol}
                      {parseFloat(product.price).toFixed(2)}
                    </div>
                    {store.track_inventory && product.inventory !== null && product.inventory !== undefined && (
                      <div
                        className={`product-inventory ${product.inventory < 10 ? 'low-stock' : ''}`}
                      >
                        Stock: {product.inventory}
                        {product.inventory < 10 && ' ⚠️'}
                      </div>
                    )}
                  </div>
                  <div className="product-actions">
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(product)}
                      disabled={actionLoading}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteProduct(product)}
                      disabled={actionLoading}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Product</h2>
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label htmlFor="productName">Product Name</label>
                <input
                  id="productName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="productPrice">Price ({currencySymbol})</label>
                <input
                  id="productPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="productCategory">Category (optional)</label>
                <input
                  id="productCategory"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={actionLoading}
                />
              </div>

              {store.track_inventory && (
                <div className="form-group">
                  <label htmlFor="productInventory">Initial Stock</label>
                  <input
                    id="productInventory"
                    type="number"
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                    required
                    disabled={actionLoading}
                  />
                </div>
              )}

              {actionError && (
                <div className="form-error">{actionError}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                    setActionError('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Product</h2>
            <form onSubmit={handleEditProduct}>
              <div className="form-group">
                <label htmlFor="editProductName">Product Name</label>
                <input
                  id="editProductName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editProductPrice">Price ({currencySymbol})</label>
                <input
                  id="editProductPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editProductCategory">Category (optional)</label>
                <input
                  id="editProductCategory"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={actionLoading}
                />
              </div>

              {store.track_inventory && (
                <div className="form-group">
                  <label htmlFor="editProductInventory">Stock</label>
                  <input
                    id="editProductInventory"
                    type="number"
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                    required
                    disabled={actionLoading}
                  />
                </div>
              )}

              {actionError && (
                <div className="form-error">{actionError}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                    resetForm();
                    setActionError('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
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

export default ProductsTab;
