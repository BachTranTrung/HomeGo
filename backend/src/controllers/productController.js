const Product  = require('../models/Product');
const Category = require('../models/Category');

// GET /api/products  — có pagination, filter, search, sort
exports.getAll = async (req, res) => {
  try {
    const { category, search, sort, featured, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (featured === '1') filter.isFeatured = true;
    if (search) filter.$text = { $search: search };

    // Sắp xếp
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc')  sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'discount')   sortObj = { discount: -1 };

    // Pagination (server-side)
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product
      .find(filter)
      .populate('category', 'name icon')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      products,
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
exports.getById = async (req, res) => {
  try {
    const product = await Product
      .findById(req.params.id)
      .populate('category', 'name icon')
      .populate('reviews.user', 'fullName avatar');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/products  (admin)
exports.create = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ message: 'Thêm sản phẩm thành công', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/products/:id  (admin)
exports.update = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json({ message: 'Cập nhật thành công', product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/products/:id  (admin)
exports.remove = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa sản phẩm' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/products/:id/reviews  (customer)
exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    // Mỗi user chỉ review 1 lần
    const existIdx = product.reviews.findIndex(r => String(r.user) === String(req.user._id));
    if (existIdx >= 0) {
      product.reviews[existIdx].rating  = rating;
      product.reviews[existIdx].comment = comment;
    } else {
      product.reviews.push({ user: req.user._id, rating, comment });
    }
    await product.save();
    res.json({ message: 'Cảm ơn đánh giá của bạn!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
