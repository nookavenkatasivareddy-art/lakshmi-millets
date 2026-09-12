const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['new_order', 'new_customer', 'new_message', 'new_review', 'low_stock', 'payment_received', 'order_cancelled', 'order_delivered', 'info'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

notificationSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Notification', notificationSchema);
