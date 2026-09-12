const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  review: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

reviewSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Review', reviewSchema);
