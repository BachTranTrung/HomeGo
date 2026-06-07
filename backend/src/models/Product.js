const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true, min: 0 },
  discount:    { type: Number, default: 0, min: 0, max: 100 },   // phần trăm
  stock:       { type: Number, default: 0, min: 0 },
  imageUrl:    { type: String, default: '' },
  description: { type: String, default: '' },
  isFeatured:  { type: Boolean, default: false },
  reviews:     [reviewSchema],
  // Virtual: salePrice = price * (1 - discount/100)
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('salePrice').get(function () {
  return Math.round(this.price * (1 - this.discount / 100));
});

productSchema.virtual('avgRating').get(function () {
  if (!this.reviews.length) return 0;
  return +(this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length).toFixed(1);
});

productSchema.virtual('reviewCount').get(function () {
  return this.reviews.length;
});

// Text index để tìm kiếm
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
