import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './ProductsTab.css';

const ProductsTab = () => {
  const { getCurrentStore, addProduct, updateProduct, deleteProduct, updateStore, currencySymbol } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCombosModal, setShowCombosModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    inventory: '',
  });

  const store = getCurrentStore();
  if (!store) return null;

  const handleAddProduct = (e) => {
    e.preventDefault();
    addProduct(formData);
    resetForm();
    setShowAddModal(false);
  };

  const handleEditProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      const updates = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
      };
      if (store.trackInventory) {
        updates.inventory = parseInt(formData.inventory);
      }
      updateProduct(editingProduct.id, updates);
      resetForm();
      setEditingProduct(null);
      setShowEditModal(false);
    }
  };

  const handleDeleteProduct = (product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      deleteProduct(product.id);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category || '',
      inventory: product.inventory !== undefined ? product.inventory.toString() : '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      inventory: '',
    });
  };

  const toggleInventoryTracking = () => {
    updateStore(store.id, { trackInventory: !store.trackInventory });
  };

  // Group products by category
  const productsByCategory = store.products.reduce((acc, product) => {
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
              checked={store.trackInventory}
              onChange={toggleInventoryTracking}
            />
            Track Inventory
          </label>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Product
        </button>
      </div>

      {store.combos.length > 0 && (
        <button
          className="combos-btn"
          onClick={() => setShowCombosModal(true)}
        >
          Manage Combos ({store.combos.length})
        </button>
      )}

      {store.products.length === 0 ? (
        <div className="empty-state">
          <p>No products yet</p>
          <p className="hint">Add your first product to get started</p>
        </div>
      ) : (
        <div className="products-list">
          {Object.entries(productsByCategory).map(([category, products]) => (
            <div key={category} className="category-group">
              <h3 className="category-header">{category}</h3>
              {products.map(product => (
                <div key={product.id} className="product-item">
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">{currencySymbol}{product.price.toFixed(2)}</div>
                    {store.trackInventory && (
                      <div className={`product-inventory ${product.inventory < 10 ? 'low-stock' : ''}`}>
                        Stock: {product.inventory}
                        {product.inventory < 10 && ' ⚠️'}
                      </div>
                    )}
                  </div>
                  <div className="product-actions">
                    <button
                      className="btn-edit"
                      onClick={() => openEditModal(product)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteProduct(product)}
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
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="productCategory">Category (optional)</label>
                <input
                  id="productCategory"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              {store.trackInventory && (
                <div className="form-group">
                  <label htmlFor="productInventory">Initial Stock</label>
                  <input
                    id="productInventory"
                    type="number"
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="editProductCategory">Category (optional)</label>
                <input
                  id="editProductCategory"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              {store.trackInventory && (
                <div className="form-group">
                  <label htmlFor="editProductInventory">Stock</label>
                  <input
                    id="editProductInventory"
                    type="number"
                    min="0"
                    value={formData.inventory}
                    onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
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

export default ProductsTab;
