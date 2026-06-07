const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:      { type: String, required: true },   // snapshot tên khi đặt
  imageUrl:  { type: String },
  unitPrice: { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
});

orderItemSchema.virtual('subtotal').get(function () {
  return this.unitPrice * this.quantity;
});

const shippingSchema = new mongoose.Schema({
  customerName: String,
  email:        String,
  phone:        String,
  address:      String,
});

const orderSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:         [orderItemSchema],
  shipping:      shippingSchema,
  promoCode:     { type: String, default: '' },
  discountAmt:   { type: Number, default: 0 },
  totalMoney:    { type: Number, required: true },
  notes:         { type: String, default: '' },
  paymentMethod: { type: String, enum: ['cod', 'vnpay'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
    default: 'pending',
  },
  vnpayTxnRef:   { type: String, default: '' },
}, { timestamps: true, toJSON: { virtuals: true } });

module.exports = mongoose.model('Order', orderSchema);
