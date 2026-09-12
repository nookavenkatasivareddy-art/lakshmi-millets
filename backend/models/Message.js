const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

messageSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Message', messageSchema);
