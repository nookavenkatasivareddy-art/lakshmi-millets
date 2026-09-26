const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const productTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: String,
  isActive: { type: Boolean, default: true }
});

productTypeSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('ProductType', productTypeSchema);
