const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

settingSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Setting', settingSchema);
