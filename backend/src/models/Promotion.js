const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount:   { type: Number, required: true, min: 0, max: 100 },   // phần trăm
  minOrder:   { type: Number, default: 0 },
  expiryDate: { type: Date },
  status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
