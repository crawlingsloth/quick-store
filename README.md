# Quick Store - Mobile POS System

A modern, offline-capable Point of Sale (POS) system built with React and Vite. Designed for mobile devices, perfect for small vendors, pop-up stores, and market stalls.

## Features

### Multi-Store Management
- Create and manage multiple stores from a single app
- Each store has its own products, combos, and order history
- Toggle inventory tracking per store

### Product Management
- Add, edit, and delete products
- Optional inventory tracking with low-stock warnings
- Organize products by categories
- Quick combo creation for bundled sales

### Sales Interface
- Mobile-optimized product grid
- Tap to add items to cart
- Long-press for custom quantities (500ms)
- Live cart preview with running total
- Quick checkout with customer name entry

### Order History & Export
- View today's orders with edit/delete capabilities
- Export options:
  - **Text Summary**: Copy to clipboard for messaging apps
  - **CSV**: Download detailed sales data
- Clear today's orders after export
- Revenue and order count statistics

### Mobile Optimizations
- Touch-optimized UI (44px minimum touch targets)
- Long-press gesture support with haptic feedback
- Prevent accidental zoom and pull-to-refresh
- Responsive grid layouts
- Smooth animations and transitions

### Offline Capability
- 100% client-side - works without internet
- PWA support with service worker
- All data stored in browser localStorage
- Add to home screen on mobile devices

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **localStorage** - Client-side data persistence
- **PWA** - Progressive Web App capabilities
- **CSS** - Custom mobile-first styling

## Getting Started

### Prerequisites
- Node.js 20+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development
The app will be available at `http://localhost:5173`

## Usage Guide

### Creating Your First Store
1. Click the **+** button on the home screen
2. Enter a store name
3. Optionally enable **Track Inventory** if you want to monitor stock levels
4. Click **Create Store**

### Adding Products
1. Open a store and go to the **Products** tab
2. Click **+ Add Product**
3. Fill in product details:
   - Name
   - Price
   - Category (optional)
   - Initial Stock (if inventory tracking is enabled)
4. Click **Add Product**

### Making Sales
1. Go to the **Sell** tab
2. Tap products to add them to the cart (adds 1)
3. Long-press (hold for 500ms) to enter a custom quantity
4. Review the cart at the bottom of the screen
5. Adjust quantities with +/- buttons or remove items
6. Click **Checkout**
7. Enter customer name
8. Click **Complete Order**

### Viewing Order History
1. Go to the **History** tab
2. View today's orders with statistics
3. Edit orders by clicking **Edit** (marked as EDITED)
4. Delete orders if needed
5. Export orders:
   - **Copy Summary**: Quick text summary for WhatsApp/SMS
   - **Download CSV**: Detailed spreadsheet for record-keeping
6. Click **Clear Today** to remove all orders after successful export

### Managing Inventory
- When inventory tracking is enabled:
  - Stock levels update automatically with each sale
  - Products show remaining stock
  - Products with <10 items show a warning ⚠️
  - Out-of-stock items are disabled
  - Deleted/edited orders restore inventory

## Deployment

### GitHub Pages (Automated)
This project is configured for automatic deployment to GitHub Pages:

1. Push to the `main` branch
2. GitHub Actions automatically builds and deploys
3. Access at: `https://quick-store.crawlingsloth.cloud`

### Manual Deployment
```bash
# Build the project
npm run build

# Deploy the 'dist' folder to your hosting service
```

The `public/CNAME` file is configured for the custom domain `quick-store.crawlingsloth.cloud`.

## Project Structure

```
quick-store/
├── src/
│   ├── components/        # React components
│   │   ├── ProductsTab.jsx
│   │   ├── SellTab.jsx
│   │   └── HistoryTab.jsx
│   ├── screens/           # Main screen components
│   │   ├── HomeScreen.jsx
│   │   └── StoreScreen.jsx
│   ├── context/           # React Context for state
│   │   └── AppContext.jsx
│   ├── utils/             # Utility functions
│   │   ├── storage.js     # localStorage operations
│   │   └── export.js      # Export/download utilities
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── CNAME              # Custom domain config
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Actions workflow
```

## Data Structure

All data is stored in browser localStorage:

### Stores
```javascript
{
  storeId: {
    id: string,
    name: string,
    trackInventory: boolean,
    products: [...],
    combos: [...]
  }
}
```

### Orders
```javascript
{
  orderId: {
    id: string,
    storeId: string,
    customerName: string,
    items: [{productId, productName, quantity, price}],
    total: number,
    timestamp: ISO string,
    isEdited: boolean,
    editHistory: [...]
  }
}
```

## Browser Support

- Chrome/Edge (recommended)
- Safari (iOS/macOS)
- Firefox
- Any modern browser with localStorage and service worker support

## Privacy & Data

- All data is stored locally on your device
- No data is sent to any server
- Clearing browser data will erase all stores and orders
- Export your data regularly for backup

## Future Enhancements

Potential features for future versions:
- Barcode scanning
- Receipt printing via Bluetooth
- Cloud backup (Google Drive, Dropbox)
- Multi-currency support
- Sales analytics dashboard
- Tax calculations
- Discount/coupon codes

## License

MIT
