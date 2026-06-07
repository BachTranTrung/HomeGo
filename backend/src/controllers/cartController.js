const Cart    = require('../models/Cart');
const Product = require('../models/Product');

// Helper: populate cart items đầy đủ
async function getPopulatedCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name price discount imageUrl stock category',
    populate: { path: 'category', select: 'name' },
  });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    const items = cart.items
      .filter(i => i.product) // lọc sản phẩm đã bị xóa
      .map(i => ({
        cartItemId: i._id,
        productId:  i.product._id,
        name:       i.product.name,
        imageUrl:   i.product.imageUrl,
        price:      i.product.price,
        discount:   i.product.discount,
        salePrice:  Math.round(i.product.price * (1 - (i.product.discount || 0) / 100)),
        stock:      i.product.stock,
        category:   i.product.category?.name,
        quantity:   i.quantity,
        subtotal:   Math.round(i.product.price * (1 - (i.product.discount || 0) / 100)) * i.quantity,
      }));
    const total = items.reduce((s, i) => s + i.subtotal, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    res.json({ items, total, count });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/cart  { productId, quantity }
exports.addItem = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (product.stock < 1) return res.status(400).json({ message: 'Sản phẩm đã hết hàng' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const idx = cart.items.findIndex(i => String(i.product) === String(productId));
    if (idx >= 0) {
      const newQty = cart.items[idx].quantity + quantity;
      cart.items[idx].quantity = Math.min(newQty, product.stock);
    } else {
      cart.items.push({ product: productId, quantity: Math.min(quantity, product.stock) });
    }
    await cart.save();
    res.json({ message: 'Đã thêm vào giỏ hàng' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/cart/:itemId  { quantity }
exports.updateItem = async (req, res) => {
  const { quantity } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Sản phẩm không có trong giỏ' });

    if (quantity <= 0) cart.items.pull({ _id: req.params.itemId });
    else item.quantity = quantity;

    await cart.save();
    res.json({ message: 'Đã cập nhật giỏ hàng' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/cart/:itemId
exports.removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
    cart.items.pull({ _id: req.params.itemId });
    await cart.save();
    res.json({ message: 'Đã xóa khỏi giỏ hàng' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
