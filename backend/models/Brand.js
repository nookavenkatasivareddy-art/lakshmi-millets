const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: String,
  logo: String,
  isActive: { type: Boolean, default: true }
});

brandSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Brand', brandSchema);
