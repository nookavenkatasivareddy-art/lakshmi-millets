/**
 * Lightweight event → notification helper for the Admin Dashboard.
 * Creates a Notification document for admin events (new order, new
 * customer, new message, low stock, ...). Never throws — a failed
 * notification must not break the customer-facing request.
 */
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');
const Product = require('../models/Product');

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

async function createNotification(data) {
  try {
    await Notification.create({
      type: data.type || 'info',
      title: data.title || 'Notification',
      message: data.message || '',
      link: data.link || null,
      orderId: data.orderId || null,
      userId: data.userId || null
    });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

/** Reads the admin-configured low stock threshold from Settings (default 10). */
async function getLowStockThreshold() {
  try {
    const s = await Setting.findOne({ key: 'lowStockThreshold' });
    const n = Number(s && s.value);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_LOW_STOCK_THRESHOLD;
  } catch {
    return DEFAULT_LOW_STOCK_THRESHOLD;
  }
}

/**
 * Checks a product against the low-stock threshold and, if it has fallen
 * to/below it, creates a single low_stock notification for it.
 */
async function checkLowStock(product) {
  try {
    const threshold = await getLowStockThreshold();
    if (product && Number(product.stock) <= threshold) {
      await createNotification({
        type: 'low_stock',
        title: 'Low stock alert',
        message: `${product.name} is running low — only ${product.stock} unit(s) left.`,
        link: '/admin/products'
      });
    }
  } catch (err) {
    console.error('Low stock check error:', err.message);
  }
}

module.exports = { createNotification, getLowStockThreshold, checkLowStock };
