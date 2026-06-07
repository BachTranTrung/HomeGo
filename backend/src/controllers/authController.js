const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'homego_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
exports.register = async (req, res) => {
  const { username, email, password, fullName, phone } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Vui lòng điền email và mật khẩu' });
  try {
    const exist = await User.findOne({ $or: [{ email }, { username }] });
    if (exist) return res.status(400).json({ message: 'Email hoặc username đã tồn tại' });

    const user = await User.create({ username, email, password, fullName, phone });
    const token = signToken(user);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    const token = signToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/google  (nhận id_token từ Google Sign-In frontend)
exports.googleLogin = async (req, res) => {
  const { googleId, email, fullName, avatar } = req.body;
  if (!googleId || !email) return res.status(400).json({ message: 'Thiếu thông tin Google' });
  try {
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({ googleId, email, fullName, avatar, username: email.split('@')[0] });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      await user.save();
    }
    const token = signToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  res.json(req.user);
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  const { fullName, phone, address } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, address },
      { new: true }
    );
    res.json({ message: 'Cập nhật thành công', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user.password) return res.status(400).json({ message: 'Tài khoản Google không có mật khẩu' });
    const ok = await user.comparePassword(oldPassword);
    if (!ok) return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
