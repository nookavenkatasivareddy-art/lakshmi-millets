/**
 * WhatsApp notification service (zero external dependencies).
 *
 * Flow (matches the Wati-style model):
 *  1. Customer places an order  -> "New Food Order Received!" goes to the admin
 *     number (ADMIN_WHATSAPP_NUMBER, default 918897626612).
 *  2. For UPI orders, payment link is included in the notification.
 *  3. Customer submits payment proof (screenshot + UTR) -> notification to admin.
 *  4. Admin reviews and verifies payment -> "Payment verified" goes to customer.
 *  5. Admin can also reject payment -> "Payment failed" goes to customer.
 *  6. Admin updates PLACED -> CONFIRMED -> SHIPPED -> DELIVERED.
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
  const paymentDetails = order.paymentDetails || {};
  let paymentInfo = `Payment: ${order.paymentMethod}\n`;
  if (order.paymentMethod === 'UPI' && paymentDetails.upiLink) {
    paymentInfo += `UPI Link: ${paymentDetails.upiLink}\n`;
    paymentInfo += `UPI ID: ${paymentDetails.upiId}\n`;
  }
  
  return (
    `🔔 New Food Order Received!\n\n` +
    `Order ID: ${orderLabel(order)}\n` +
    `Customer: ${name}\n` +
    `Phone: ${a.phone || '-'}\n\n` +
    `Items:\n${itemsText(order)}\n\n` +
    `Total: ${rupees(order.grandTotal)}\n` +
    `${paymentInfo}\n` +
    `Please check the admin panel for complete order details.`
  );
}

function adminPaymentVerificationText(order) {
  const a = order.shippingAddress || {};
  const name = (order.userId && order.userId.name) || a.fullName || 'Customer';
  const paymentDetails = order.paymentDetails || {};
  
  return (
    `💰 Payment Verification Submitted!\n\n` +
    `Order ID: ${orderLabel(order)}\n` +
    `Customer: ${name}\n` +
    `Phone: ${a.phone || '-'}\n\n` +
    `Amount: ${rupees(order.grandTotal)}\n` +
    `UTR: ${paymentDetails.utr || 'Not provided'}\n` +
    `Screenshot: ${paymentDetails.screenshot ? 'Attached' : 'Not provided'}\n\n` +
    `Please verify in admin panel.`
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

function customerPaymentVerifiedText(order) {
  const a = order.shippingAddress || {};
  const name = a.fullName || (order.userId && order.userId.name) || 'Customer';
  return (
    `✅ Payment Verified!\n\n` +
    `Hi ${name}, your payment for order ${orderLabel(order)} has been verified.\n\n` +
    `Amount: ${rupees(order.grandTotal)}\n` +
    `Your order is now confirmed and will be processed for delivery soon.\n\n` +
    `Thank you for ordering with Lakshmi Millets!`
  );
}

function customerPaymentFailedText(order) {
  const a = order.shippingAddress || {};
  const name = a.fullName || (order.userId && order.userId.name) || 'Customer';
  return (
    `❌ Payment Verification Failed\n\n` +
    `Hi ${name}, we couldn't verify your payment for order ${orderLabel(order)}.\n\n` +
    `Please check the UTR and screenshot, then resubmit in the app.\n\n` +
    `If you need help, contact us at 8897626612.`
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

/** Send "payment verification submitted" notification to admin. Never throws. */
async function notifyAdminPaymentVerification(order) {
  const text = adminPaymentVerificationText(order);
  const res = await watiSend(ADMIN_NUMBER, text);
  const sent = !!(res && res.status >= 200 && res.status < 300);
  console.log(sent ? '[whatsapp] admin payment verification sent via Wati' : '[whatsapp] Wati not configured - wa.me fallback for payment verification');
  return { sent, whatsappUrl: waMeLink(ADMIN_NUMBER, text) };
}

/** Send "order confirmed" message to the customer. Never throws. */
async function notifyCustomerConfirmation(order) {
  const phone = order.shippingAddress && order.shippingAddress.phone;
  const res = await watiSend(phone, customerConfirmationText(order));
  const sent = !!(res && res.status >= 200 && res.status < 300);
  return { sent, whatsappUrl: waMeLink(phone, customerConfirmationText(order)) };
}

/** Send "payment verified" message to the customer. Never throws. */
async function notifyCustomerPaymentVerified(order) {
  const phone = order.shippingAddress && order.shippingAddress.phone;
  const res = await watiSend(phone, customerPaymentVerifiedText(order));
  const sent = !!(res && res.status >= 200 && res.status < 300);
  return { sent, whatsappUrl: waMeLink(phone, customerPaymentVerifiedText(order)) };
}

/** Send "payment failed" message to the customer. Never throws. */
async function notifyCustomerPaymentFailed(order) {
  const phone = order.shippingAddress && order.shippingAddress.phone;
  const res = await watiSend(phone, customerPaymentFailedText(order));
  const sent = !!(res && res.status >= 200 && res.status < 300);
  return { sent, whatsappUrl: waMeLink(phone, customerPaymentFailedText(order)) };
}

module.exports = {
  ADMIN_NUMBER,
  notifyAdminNewOrder,
  notifyAdminPaymentVerification,
  notifyCustomerConfirmation,
  notifyCustomerPaymentVerified,
  notifyCustomerPaymentFailed,
  adminNewOrderText,
  adminPaymentVerificationText,
  customerConfirmationText,
  customerPaymentVerifiedText,
  customerPaymentFailedText,
  waMeLink
};
