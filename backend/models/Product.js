const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

  // Optional references - existing products can remain without these initially
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  productTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductType' },

  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  weight: String,
  isPopular: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  image: String,
  description: String,
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Helpful for /api/products?search= and category filtering
productSchema.index({ name: 'text' });

productSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Product', productSchema);
