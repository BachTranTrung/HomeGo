const User      = require('../models/User');
const Product   = require('../models/Product');
const Category  = require('../models/Category');
const Order     = require('../models/Order');
const Promotion = require('../models/Promotion');

// GET /api/admin/statistics
exports.getStatistics = async (req, res) => {
  try {
    const [revenue, totalOrders, totalUsers, totalProducts, recentOrders, topProducts, monthlyRevenue] =
      await Promise.all([
        Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$totalMoney' } } }]),
        Order.countDocuments(),
        User.countDocuments({ role: 'customer' }),
        Product.countDocuments(),
        Order.find().populate('user', 'fullName email').sort({ createdAt: -1 }).limit(10),
        Order.aggregate([
          { $unwind: '$items' },
          { $group: { _id: '$items.product', name: { $first: '$items.name' }, sold: { $sum: '$items.quantity' } } },
          { $sort: { sold: -1 } },
          { $limit: 5 },
        ]),
        Order.aggregate([
          { $match: { status: 'delivered' } },
          { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$totalMoney' } } },
          { $sort: { _id: -1 } },
          { $limit: 12 },
        ]),
      ]);

    res.json({
      revenue:       revenue[0]?.total || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      recentOrders,
      topProducts,
      monthlyRevenue: monthlyRevenue.map(m => ({ month: m._id, revenue: m.revenue })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    // Đếm số sản phẩm mỗi danh mục
    const withCount = await Promise.all(cats.map(async c => {
      const count = await Product.countDocuments({ category: c._id });
      return { ...c.toObject(), productCount: count };
    }));
    res.json(withCount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/categories (admin)
exports.createCategory = async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ message: 'Thêm danh mục thành công', category: cat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/categories/:id (admin)
exports.updateCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Cập nhật danh mục thành công', category: cat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/categories/:id (admin)
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa danh mục' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/promotions/check
exports.checkPromotion = async (req, res) => {
  const { code } = req.body;
  try {
    const promo = await Promotion.findOne({
      code: code.toUpperCase(),
      status: 'active',
      $or: [{ expiryDate: null }, { expiryDate: { $gte: new Date() } }],
    });
    if (!promo) return res.status(404).json({ message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
    res.json(promo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/promotions
exports.getAllPromotions = async (req, res) => {
  try {
    const promos = await Promotion.find().sort({ createdAt: -1 });
    res.json(promos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/promotions
exports.createPromotion = async (req, res) => {
  try {
    const promo = await Promotion.create(req.body);
    res.status(201).json({ message: 'Thêm mã giảm giá thành công', promotion: promo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
