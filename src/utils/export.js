// Export utility for generating reports in different formats

// Format date for display
const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format time for display
const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format currency
const formatCurrency = (amount, currencySymbol = '$') => {
  return `${currencySymbol}${amount.toFixed(2)}`;
};

// ============ TEXT SUMMARY FORMAT ============

export const generateTextSummary = (storeName, orders, date = new Date(), currencySymbol = '$') => {
  if (!orders || orders.length === 0) {
    return `Store: ${storeName}\nDate: ${formatDate(date.toISOString())}\n\nNo orders for this date.`;
  }

  // Aggregate items across all orders
  const itemsMap = new Map();
  let totalRevenue = 0;

  orders.forEach(order => {
    totalRevenue += order.total;
    order.items.forEach(item => {
      const key = item.productName;
      if (itemsMap.has(key)) {
        const existing = itemsMap.get(key);
        itemsMap.set(key, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.price * item.quantity),
        });
      } else {
        itemsMap.set(key, {
          quantity: item.quantity,
          revenue: item.price * item.quantity,
        });
      }
    });
  });

  // Build text summary
  let summary = `Store: ${storeName}\n`;
  summary += `Date: ${formatDate(date.toISOString())}\n`;
  summary += `Orders: ${orders.length}\n\n`;
  summary += `Items Sold:\n`;

  // Sort items by revenue (highest first)
  const sortedItems = Array.from(itemsMap.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue);

  sortedItems.forEach(([productName, data]) => {
    summary += `- ${productName}: ${data.quantity} units - ${formatCurrency(data.revenue, currencySymbol)}\n`;
  });

  summary += `\nTotal Revenue: ${formatCurrency(totalRevenue, currencySymbol)}`;

  if (orders.some(order => order.isEdited)) {
    summary += `\n\n⚠️  Note: Some orders were edited after creation`;
  }

  return summary;
};

// ============ CSV FORMAT ============

export const generateCSV = (storeName, orders) => {
  if (!orders || orders.length === 0) {
    return `No orders to export for ${storeName}`;
  }

  // CSV Header
  let csv = 'Order ID,Date,Time,Customer,Product,Quantity,Unit Price,Line Total,Order Total,Edited\n';

  orders.forEach(order => {
    const orderDate = formatDate(order.timestamp);
    const orderTime = formatTime(order.timestamp);
    const edited = order.isEdited ? 'Yes' : 'No';

    order.items.forEach((item, index) => {
      const lineTotal = item.price * item.quantity;

      csv += `"${order.id}",`;
      csv += `"${orderDate}",`;
      csv += `"${orderTime}",`;
      csv += `"${order.customerName}",`;
      csv += `"${item.productName}",`;
      csv += `${item.quantity},`;
      csv += `${item.price.toFixed(2)},`;
      csv += `${lineTotal.toFixed(2)},`;

      // Only show order total on first item line
      if (index === 0) {
        csv += `${order.total.toFixed(2)},`;
      } else {
        csv += `,`;
      }

      csv += `"${edited}"\n`;
    });
  });

  return csv;
};

// ============ DETAILED TEXT FORMAT ============

export const generateDetailedText = (storeName, orders, date = new Date(), currencySymbol = '$') => {
  if (!orders || orders.length === 0) {
    return `Store: ${storeName}\nDate: ${formatDate(date.toISOString())}\n\nNo orders for this date.`;
  }

  let text = `SALES REPORT\n`;
  text += `${'='.repeat(50)}\n`;
  text += `Store: ${storeName}\n`;
  text += `Date: ${formatDate(date.toISOString())}\n`;
  text += `Total Orders: ${orders.length}\n`;
  text += `${'='.repeat(50)}\n\n`;

  // Sort orders by timestamp
  const sortedOrders = [...orders].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  sortedOrders.forEach((order, index) => {
    text += `Order #${index + 1} - ${formatTime(order.timestamp)}${order.isEdited ? ' [EDITED]' : ''}\n`;
    text += `-`.repeat(50) + `\n`;
    text += `Customer: ${order.customerName}\n`;
    text += `Items:\n`;

    order.items.forEach(item => {
      text += `  ${item.quantity}x ${item.productName} @ ${formatCurrency(item.price, currencySymbol)} = ${formatCurrency(item.price * item.quantity, currencySymbol)}\n`;
    });

    text += `\nTotal: ${formatCurrency(order.total, currencySymbol)}\n`;
    text += `\n`;
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  text += `${'='.repeat(50)}\n`;
  text += `TOTAL REVENUE: ${formatCurrency(totalRevenue, currencySymbol)}\n`;
  text += `${'='.repeat(50)}\n`;

  return text;
};

// ============ COPY TO CLIPBOARD ============

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// ============ DOWNLOAD FILE ============

export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to download file:', error);
    return false;
  }
};

// ============ EXPORT HELPERS ============

export const exportTodayAsSummary = async (storeName, orders, currencySymbol = '$') => {
  const summary = generateTextSummary(storeName, orders, new Date(), currencySymbol);
  return await copyToClipboard(summary);
};

export const exportTodayAsCSV = (storeName, orders) => {
  const csv = generateCSV(storeName, orders);
  const dateStr = formatDate(new Date().toISOString()).replace(/\s+/g, '-');
  const filename = `${storeName}-${dateStr}.csv`;
  return downloadFile(csv, filename, 'text/csv');
};

export const exportTodayAsDetailedText = (storeName, orders, currencySymbol = '$') => {
  const text = generateDetailedText(storeName, orders, new Date(), currencySymbol);
  const dateStr = formatDate(new Date().toISOString()).replace(/\s+/g, '-');
  const filename = `${storeName}-${dateStr}.txt`;
  return downloadFile(text, filename, 'text/plain');
};

// ============ INVENTORY REPORT ============

export const generateInventoryReport = (store) => {
  if (!store.trackInventory) {
    return `Inventory tracking is not enabled for ${store.name}`;
  }

  let report = `INVENTORY REPORT\n`;
  report += `${'='.repeat(50)}\n`;
  report += `Store: ${store.name}\n`;
  report += `Date: ${formatDate(new Date().toISOString())}\n`;
  report += `${'='.repeat(50)}\n\n`;

  if (store.products.length === 0) {
    report += `No products in inventory\n`;
  } else {
    // Group by category if available
    const productsByCategory = store.products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});

    Object.entries(productsByCategory).forEach(([category, products]) => {
      report += `${category}:\n`;
      report += `-`.repeat(50) + `\n`;

      products.forEach(product => {
        const stock = product.inventory !== undefined ? product.inventory : 'N/A';
        const lowStock = product.inventory !== undefined && product.inventory < 10 ? ' ⚠️  LOW STOCK' : '';
        report += `  ${product.name}: ${stock} units${lowStock}\n`;
      });

      report += `\n`;
    });
  }

  return report;
};
