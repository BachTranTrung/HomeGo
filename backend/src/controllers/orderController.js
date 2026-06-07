const Order     = require('../models/Order');
const Product   = require('../models/Product');
const Promotion = require('../models/Promotion');

// POST /api/orders
exports.create = async (req, res) => {
  const { items, promoCode, notes, paymentMethod, shipping } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'Giỏ hàng trống' });

  try {
    let discountPct = 0;
    let promoUsed   = '';

    // Kiểm tra mã giảm giá
    if (promoCode) {
      const promo = await Promotion.findOne({
        code: promoCode.toUpperCase(),
        status: 'active',
        $or: [{ expiryDate: null }, { expiryDate: { $gte: new Date() } }],
      });
      if (promo) { discountPct = promo.discount; promoUsed = promo.code; }
    }

    // Tính tổng + kiểm tra tồn kho
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ message: `Sản phẩm không tồn tại` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `${product.name} không đủ hàng (còn ${product.stock})` });

      const unitPrice = product.salePrice;
      subtotal += unitPrice * item.quantity;

      orderItems.push({
        product:  product._id,
        name:     product.name,
        imageUrl: product.imageUrl,
        unitPrice,
        quantity: item.quantity,
      });

      // Trừ tồn kho
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const discountAmt = Math.round(subtotal * discountPct / 100);
    const totalMoney  = subtotal - discountAmt;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shipping,
      promoCode:     promoUsed,
      discountAmt,
      totalMoney,
      notes,
      paymentMethod: paymentMethod || 'cod',
    });

    res.status(201).json({ message: 'Đặt hàng thành công!', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/my  — đơn của user hiện tại
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order
      .find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/:id
exports.getById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/cancel
exports.cancel = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Chỉ có thể hủy đơn đang chờ xử lý' });

    order.status = 'cancelled';
    await order.save();

    // Hoàn lại tồn kho
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
    res.json({ message: 'Đã hủy đơn hàng' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── ADMIN ────────────────────────────────────────────

// GET /api/admin/orders  — có pagination
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(filter);
    const orders = await Order
      .find(filter)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/orders/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json({ message: 'Cập nhật trạng thái thành công', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
