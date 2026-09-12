const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const Setting = require('../models/Setting');
const router = express.Router();

function dateFilter(range) {
  const now = new Date();
  const start = new Date();
  if (range === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (range === 'week') {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
  } else if (range === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (range === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    return {};
  }
  return { createdAt: { $gte: start, $lte: now } };
}

router.get('/dashboard-stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalSales, totalOrders, totalProducts, totalUsers, pendingOrders, deliveredOrders, cancelledOrders] = await Promise.all([
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'CANCELLED' }, paymentStatus: { $in: ['PAID', 'PENDING'] } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments(),
      Order.countDocuments({ orderStatus: 'PLACED' }),
      Order.countDocuments({ orderStatus: 'DELIVERED' }),
      Order.countDocuments({ orderStatus: 'CANCELLED' })
    ]);

    const lowStockThreshold = 10;
    const lowStockProducts = await Product.find({ stock: { $lt: lowStockThreshold } }).limit(10).lean();

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalOrders,
      totalProducts,
      totalUsers,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      lowStockProducts: (lowStockProducts || []).map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        image: p.image,
        price: p.price
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/sales', protect, adminOnly, async (req, res) => {
  try {
    const range = req.query.range || 'month';
    const filter = dateFilter(range);

    const salesData = await Order.aggregate([
      { $match: { ...filter, orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);

    const salesByDay = await Order.aggregate([
      { $match: { ...filter, orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      total: salesData[0]?.total || 0,
      count: salesData[0]?.count || 0,
      byDay: (salesByDay || []).map(d => ({ date: d._id, total: d.total, count: d.count }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/orders', protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (search) {
      filter.$or = [
        { id: { $regex: search, $options: 'i' } },
        { 'userId.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email phone'),
      Order.countDocuments(filter)
    ]);

    const shaped = await Promise.all(orders.map(async (o) => {
      const loc = await require('../models/DeliveryLocation').findById(o.deliveryLocationId);
      const obj = o.toJSON();
      obj.deliveryLocation = loc || null;
      obj.userId = o.userId || null;
      return obj;
    }));

    res.json({ orders: shaped, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(filter)
    ]);

    const usersWithOrders = await Promise.all(users.map(async (u) => {
      const orders = await Order.find({ userId: u.id }).sort({ createdAt: -1 }).limit(5).lean();
      const orderCount = await Order.countDocuments({ userId: u.id });
      const totalSpent = orders.reduce((s, o) => s + (o.grandTotal || 0), 0);
      return { ...u.toJSON(), orderCount, totalSpent };
    }));

    res.json({ users: usersWithOrders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const orders = await Order.find({ userId: user.id }).sort({ createdAt: -1 }).lean();
    const orderCount = await Order.countDocuments({ userId: user.id });
    const totalSpent = orders.reduce((s, o) => s + (o.grandTotal || 0), 0);
    res.json({ ...user.toJSON(), orders, orderCount, totalSpent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/users/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.body.status === 'active' || req.body.status === 'inactive') {
      user.status = req.body.status;
    }
    if (req.body.blocked !== undefined) {
      user.blocked = req.body.blocked;
    }
    await user.save();
    res.json({ ...user.toJSON(), message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/messages', protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { read } = req.query;

    const filter = {};
    if (read === 'true') filter.isRead = true;
    if (read === 'false') filter.isRead = false;

    const [messages, total] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Message.countDocuments(filter)
    ]);

    res.json({ messages, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/messages/:id/read', protect, adminOnly, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    msg.isRead = true;
    await msg.save();
    res.json({ ...msg.toJSON(), message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/messages/:id/unread', protect, adminOnly, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    msg.isRead = false;
    await msg.save();
    res.json({ ...msg.toJSON(), message: 'Marked as unread' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/messages/:id', protect, adminOnly, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/messages', protect, adminOnly, async (req, res) => {
  try {
    const msg = await Message.create(req.body);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/notifications', protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments()
    ]);

    res.json({ notifications, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/notifications/:id/read', protect, adminOnly, async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    n.isRead = true;
    await n.save();
    res.json({ ...n.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/notifications/read-all', protect, adminOnly, async (req, res) => {
  try {
    await Notification.updateMany({}, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/notifications/:id', protect, adminOnly, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/notifications', protect, adminOnly, async (req, res) => {
  try {
    const n = await Notification.create(req.body);
    res.status(201).json(n);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/reviews', protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};
    if (status === 'approved') filter.isApproved = true;
    if (status === 'pending') filter.isApproved = false;
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { review: { $regex: search, $options: 'i' } }
      ];
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('productId', 'name').populate('userId', 'name'),
      Review.countDocuments(filter)
    ]);

    res.json({ reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/reviews/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const r = await Review.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Review not found' });
    r.isApproved = true;
    await r.save();
    res.json({ ...r.toJSON(), message: 'Review approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/reviews/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const r = await Review.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Review not found' });
    r.isApproved = false;
    await r.save();
    res.json({ ...r.toJSON(), message: 'Review rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/reviews/:id', protect, adminOnly, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/reviews', protect, adminOnly, async (req, res) => {
  try {
    const r = await Review.create(req.body);
    res.status(201).json(r);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/invoices', protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { id: { $regex: search, $options: 'i' } },
        { 'userId.name': { $regex: search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email phone'),
      Order.countDocuments(filter)
    ]);

    const invoices = (orders || []).map(o => {
      const obj = o.toJSON();
      obj.invoiceNumber = `INV-${String(o.id).slice(-8).toUpperCase()}`;
      return obj;
    });

    res.json({ invoices, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/settings', protect, adminOnly, async (req, res) => {
  try {
    const settings = await Setting.find({});
    const settingsMap = {};
    (settings || []).forEach(s => { settingsMap[s.key] = s.value; });
    res.json({ settings: settingsMap });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings', protect, adminOnly, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ message: 'key is required' });
    await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
    res.json({ message: 'Setting saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/products', protect, adminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const { search, category, status } = req.query;

    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.categoryId = category;
    if (status === 'active') filter.stock = { $gt: 0 };
    if (status === 'inactive') filter.stock = 0;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);

    const productsWithCategory = await Promise.all((products || []).map(async (p) => {
      const cat = await Category.findById(p.categoryId);
      return { ...p, category: cat ? { id: cat.id, name: cat.name } : null };
    }));

    res.json({ products: productsWithCategory, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/categories', protect, adminOnly, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/notifications/unread-count', protect, adminOnly, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/messages/unread-count', protect, adminOnly, async (req, res) => {
  try {
    const count = await Message.countDocuments({ isRead: false });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
