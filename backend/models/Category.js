const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: String,
  icon: String,
  image: String,
  isActive: { type: Boolean, default: true }
});

categorySchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Category', categorySchema);
