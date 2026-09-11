/**
 * WhatsApp notification service (zero external dependencies).
 *
 * Flow (matches the Wati-style model):
 *  1. Customer places an order  -> "New Food Order Received!" goes to the admin
 *     number (ADMIN_WHATSAPP_NUMBER, default 918897626612).
 *  2. Admin reviews it in the admin panel and updates PLACED -> CONFIRMED.
 *  3. On confirm, a "your order has been confirmed successfully" message goes
 *     to the customer.
 *
 * If Wati (wati.io) credentials are present in .env, messages are sent
 * automatically through the WhatsApp Business API. Otherwise the functions
 * return a wa.me deep link (pre-filled text) that the app opens with one
 * click — works today, no API key needed.
 */

const https = require('https');

const ADMIN_NUMBER = (process.env.ADMIN_WHATSAPP_NUMBER || '918897626612').replace(/\D/g, '');

function rupees(n) {
  return 'Rs.' + Number(n || 0).toFixed(2);
}

function orderLabel(order) {
  const id = String((order && (order.id || order._id)) || '');
  return id ? '#' + id.slice(-8).toUpperCase() : '#NEW';
}

function itemsText(order) {
  return (order.items || [])
    .map(it => `${it.quantity}x ${it.name}${it.weight ? ' (' + it.weight + ')' : ''}`)
    .join('\n');
}

function adminNewOrderText(order) {
  const a = order.shippingAddress || {};
  const name = (order.userId && order.userId.name) || a.fullName || 'Customer';
  return (
    `🔔 New Food Order Received!\n\n` +
    `Order ID: ${orderLabel(order)}\n` +
    `Customer: ${name}\n` +
    `Phone: ${a.phone || '-'}\n\n` +
    `Items:\n${itemsText(order)}\n\n` +
    `Total: ${rupees(order.grandTotal)}\n` +
    `Payment: ${order.paymentMethod}\n\n` +
    `Please check the admin panel for complete order details.`
  );
}

function customerConfirmationText(order) {
  const a = order.shippingAddress || {};
  const name = a.fullName || (order.userId && order.userId.name) || 'Customer';
  return (
    `Hi ${name}, your food order ${orderLabel(order)} has been confirmed successfully.\n\n` +
    `Items:\n${itemsText(order)}\n\n` +
    `Total amount: ${rupees(order.grandTotal)}. Thank you for ordering with us.`
  );
}

function waMeLink(phone, message) {
  const to = String(phone || '').replace(/\D/g, '').slice(-10);
  return `https://wa.me/91${to}?text=${encodeURIComponent(message)}`;
}

function postJson(url, body, token) {
  return new Promise(resolve => {
    try {
      const u = new URL(url);
      const data = JSON.stringify(body);
      const req = https.request(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(data)
          },
          timeout: 10000
        },
        res => {
          let chunks = '';
          res.on('data', c => { chunks += c; });
          res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
        }
      );
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(data);
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

async function watiSend(to, message) {
  const endpoint = process.env.WATI_ENDPOINT;
  const token = process.env.WATI_API_TOKEN;
  if (!endpoint || !token) return null; // not configured -> wa.me fallback
  return postJson(endpoint, { to: `91${String(to).replace(/\D/g, '').slice(-10)}`, message }, token);
}

/** Send "new order" notification to the admin. Never throws. */
async function notifyAdminNewOrder(order) {
  const text = adminNewOrderText(order);
  const res = await watiSend(ADMIN_NUMBER, text);
  const sent = !!(res && res.status >= 200 && res.status < 300);
  console.log(sent ? '[whatsapp] admin notification sent via Wati' : '[whatsapp] Wati not configured - checkout opens wa.me fallback to admin');
  return { sent, whatsappUrl: waMeLink(ADMIN_NUMBER, text) };
}

/** Send "order confirmed" message to the customer. Never throws. */
async function notifyCustomerConfirmation(order) {
  const phone = order.shippingAddress && order.shippingAddress.phone;
  const res = await watiSend(phone, customerConfirmationText(order));
  const sent = !!(res && res.status >= 200 && res.status < 300);
  return { sent, whatsappUrl: waMeLink(phone, customerConfirmationText(order)) };
}

module.exports = {
  ADMIN_NUMBER,
  notifyAdminNewOrder,
  notifyCustomerConfirmation,
  adminNewOrderText,
  customerConfirmationText,
  waMeLink
};
