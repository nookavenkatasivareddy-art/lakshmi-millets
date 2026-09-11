const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DeliveryLocation = require('../models/DeliveryLocation');
const { protect, adminOnly } = require('../middleware/auth');
const whatsapp = require('../services/whatsapp');
const router = express.Router();

async function attachDeliveryLocation(order) {
  const loc = await DeliveryLocation.findById(order.deliveryLocationId);
  const obj = order.toJSON();
  obj.deliveryLocation = loc || null;
  return obj;
}

// POST /api/orders - place a new order (COD or after payment verification)
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
    const paymentStatus = paymentMethod === 'COD' ? 'PENDING' : (paymentId ? 'PAID' : 'PENDING');

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
      orderStatus: 'PLACED'
    });

    for (const { product, qty } of productsToDecrement) {
      product.stock = Math.max(0, product.stock - qty);
      await product.save();
    }

    // Image-2 flow: notify the admin on WhatsApp about the new order.
    // Automatic via Wati if configured; otherwise the checkout page opens the
    // wa.me link so the customer's send delivers the details to the admin.
    whatsapp.notifyAdminNewOrder(order).catch(() => {});

    res.status(201).json(await attachDeliveryLocation(order));
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

    // Image-2 flow: on PLACED -> CONFIRMED, the customer gets a WhatsApp
    // confirmation. Automatic via Wati when configured; otherwise the response
    // carries a pre-filled wa.me link the admin panel opens with one click.
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
