const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DeliveryLocation = require('../models/DeliveryLocation');
const { protect, adminOnly } = require('../middleware/auth');
const whatsapp = require('../services/whatsapp');
const router = express.Router();

const UPI_ID = process.env.UPI_ID || '8897626612@sbi';
const UPI_PAYEE_NAME = process.env.UPI_PAYEE_NAME || 'Lakshmi Millets';

async function attachDeliveryLocation(order) {
  const loc = await DeliveryLocation.findById(order.deliveryLocationId);
  const obj = order.toJSON();
  obj.deliveryLocation = loc || null;
  return obj;
}

function generateUpiLink(amount, orderId) {
  const tn = `Lakshmi Millets order ${orderId}`;
  return `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(tn)}`;
}

// POST /api/orders - place a new order (COD or UPI with payment link)
router.post('/', protect, async (req, res) => {
  try {
    const { items, deliveryLocationId, shippingAddress, paymentMethod, paymentId } = req.body;

    if (!items || !items.length) return res.status(400).json({ message: 'Cart is empty' });
    if (!shippingAddress) return res.status(400).json({ message: 'Shipping address is required' });

    let location = null;
    if (deliveryLocationId) {
      location = await DeliveryLocation.findById(deliveryLocationId);
      if (!location) return res.status(404).json({ message: 'Delivery location not found' });
    } else {
      location = await DeliveryLocation.findOne({ isActive: true }).sort({ city: 1 });
      if (!location) return res.status(404).json({ message: 'No active delivery location found' });
    }

    let itemsTotal = 0;
    const orderItems = [];
    const productsToDecrement = [];

    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product) return res.status(404).json({ message: `Product ${it.productId} not found` });

      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);

      if (product.stock <= 0) {
        return res.status(409).json({ message: `${product.name} is out of stock` });
      }
      if (product.stock < qty) {
        return res.status(409).json({
          message: `Only ${product.stock} unit(s) of ${product.name} left in stock`
        });
      }

      itemsTotal += product.price * qty;
      orderItems.push({
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: qty,
        weight: product.weight || ''
      });
      productsToDecrement.push({ product, qty });
    }

    const deliveryCharge = itemsTotal >= location.freeDeliveryAbove ? 0 : location.deliveryCharge;
    const grandTotal = itemsTotal + deliveryCharge;

    let paymentStatus = 'PENDING';
    let paymentDetails = {};

    if (paymentMethod === 'UPI') {
      // For UPI, generate payment link and set status to VERIFICATION_PENDING
      const upiLink = generateUpiLink(grandTotal, '');
      paymentDetails = {
        upiId: UPI_ID,
        upiLink: upiLink
      };
      paymentStatus = 'VERIFICATION_PENDING';
    } else if (paymentMethod === 'COD') {
      paymentStatus = 'PENDING';
    } else {
      paymentStatus = paymentId ? 'PAID' : 'PENDING';
    }

    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      deliveryLocationId: location.id,
      shippingAddress,
      itemsTotal,
      deliveryCharge,
      gstAmount: 0,
      grandTotal,
      paymentMethod,
      paymentStatus,
      paymentId: paymentId || null,
      paymentDetails,
      orderStatus: 'PLACED'
    });

    // Update UPI link with actual order ID
    if (paymentMethod === 'UPI') {
      order.paymentDetails.upiLink = generateUpiLink(grandTotal, order.id);
      await order.save();
    }

    for (const { product, qty } of productsToDecrement) {
      product.stock = Math.max(0, product.stock - qty);
      await product.save();
    }

    // Notify admin on WhatsApp about new order
    whatsapp.notifyAdminNewOrder(order).catch(() => {});

    res.status(201).json(await attachDeliveryLocation(order));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders/:id/payment-verification - customer submits payment proof (screenshot + UTR)
router.post('/:id/payment-verification', protect, async (req, res) => {
  try {
    const { utr, screenshot } = req.body;
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentMethod !== 'UPI') return res.status(400).json({ message: 'Payment verification only for UPI orders' });
    if (order.paymentStatus === 'PAID') return res.status(400).json({ message: 'Payment already verified' });

    if (!utr || !screenshot) {
      return res.status(400).json({ message: 'Both UTR and screenshot are required' });
    }

    order.paymentDetails.utr = utr;
    order.paymentDetails.screenshot = screenshot;
    order.paymentStatus = 'VERIFICATION_PENDING';
    await order.save();

    // Notify admin on WhatsApp about payment verification submitted
    whatsapp.notifyAdminPaymentVerification(order).catch(() => {});

    res.json({ message: 'Payment verification submitted. Admin will verify shortly.', order: await attachDeliveryLocation(order) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my - logged-in user's orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const shaped = await Promise.all(orders.map(attachDeliveryLocation));
    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders - admin: list all orders
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('userId', 'name email phone');
    res.json(await Promise.all(orders.map(attachDeliveryLocation)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/status - admin: update order status / payment status
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const wasConfirmed = order.orderStatus === 'CONFIRMED';
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    let whatsappUrl = null;
    let whatsappSent = false;
    if (order.orderStatus === 'CONFIRMED' && !wasConfirmed) {
      try {
        const wa = await whatsapp.notifyCustomerConfirmation(order);
        whatsappUrl = wa.whatsappUrl;
        whatsappSent = wa.sent;
      } catch (waErr) { /* never block the admin action */ }
    }

    const shaped = await attachDeliveryLocation(order);
    res.json({ ...shaped, whatsappUrl, whatsappSent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/verify-payment - admin: verify UPI payment (screenshot + UTR)
router.patch('/:id/verify-payment', protect, adminOnly, async (req, res) => {
  try {
    const { verified, utr } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentMethod !== 'UPI') return res.status(400).json({ message: 'Payment verification only for UPI orders' });

    if (verified) {
      order.paymentStatus = 'PAID';
      order.paymentDetails.verifiedAt = new Date();
      order.paymentDetails.verifiedBy = req.user.id;
      if (utr) order.paymentDetails.utr = utr;
      order.orderStatus = 'CONFIRMED';
    } else {
      order.paymentStatus = 'FAILED';
    }

    await order.save();

    // Notify customer about payment verification result
    if (verified) {
      whatsapp.notifyCustomerConfirmation(order).catch(() => {});
    } else {
      whatsapp.notifyCustomerPaymentFailed(order).catch(() => {});
    }

    const shaped = await attachDeliveryLocation(order);
    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(await attachDeliveryLocation(order));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
