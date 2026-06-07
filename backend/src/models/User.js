const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },   // null nếu đăng nhập bằng Google
  fullName: { type: String, default: '' },
  phone:    { type: String, default: '' },
  address:  { type: String, default: '' },
  avatar:   { type: String, default: '' },
  role:     { type: String, enum: ['admin', 'customer'], default: 'customer' },
  googleId: { type: String, default: null },   // Google OAuth ID
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash password trước khi lưu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// So sánh password
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Ẩn password khi trả về JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
