const express = require('express');
const router  = express.Router();

const auth    = require('../controllers/authController');
const product = require('../controllers/productController');
const cart    = require('../controllers/cartController');
const order   = require('../controllers/orderController');
const admin   = require('../controllers/adminController');
const payment = require('../controllers/paymentController');
const chatbot = require('../controllers/chatbotController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ── AUTH ──────────────────────────────────────────────
router.post('/auth/register',         auth.register);
router.post('/auth/login',            auth.login);
router.post('/auth/google',           auth.googleLogin);
router.get ('/auth/profile',          authMiddleware, auth.getProfile);
router.put ('/auth/profile',          authMiddleware, auth.updateProfile);
router.put ('/auth/change-password',  authMiddleware, auth.changePassword);

// ── CATEGORIES (public) ───────────────────────────────
router.get ('/categories',            admin.getAllCategories);
// Admin CRUD
router.post  ('/categories',          authMiddleware, adminMiddleware, admin.createCategory);
router.put   ('/categories/:id',      authMiddleware, adminMiddleware, admin.updateCategory);
router.delete('/categories/:id',      authMiddleware, adminMiddleware, admin.deleteCategory);

// ── PRODUCTS (public) ─────────────────────────────────
router.get('/products',               product.getAll);
router.get('/products/:id',           product.getById);
router.post('/products/:id/reviews',  authMiddleware, product.addReview);
// Admin CRUD
router.post  ('/products',            authMiddleware, adminMiddleware, product.create);
router.put   ('/products/:id',        authMiddleware, adminMiddleware, product.update);
router.delete('/products/:id',        authMiddleware, adminMiddleware, product.remove);

// ── PROMOTIONS ────────────────────────────────────────
router.post('/promotions/check',      authMiddleware, admin.checkPromotion);
router.get ('/admin/promotions',      authMiddleware, adminMiddleware, admin.getAllPromotions);
router.post('/admin/promotions',      authMiddleware, adminMiddleware, admin.createPromotion);

// ── CART ──────────────────────────────────────────────
router.get   ('/cart',           authMiddleware, cart.getCart);
router.post  ('/cart',           authMiddleware, cart.addItem);
router.put   ('/cart/:itemId',   authMiddleware, cart.updateItem);
router.delete('/cart/:itemId',   authMiddleware, cart.removeItem);
router.delete('/cart',           authMiddleware, cart.clearCart);

// ── ORDERS ────────────────────────────────────────────
router.post('/orders',                authMiddleware, order.create);
router.get ('/orders/my',             authMiddleware, order.getMyOrders);
router.get ('/orders/:id',            authMiddleware, order.getById);
router.put ('/orders/:id/cancel',     authMiddleware, order.cancel);
// Admin
router.get ('/admin/orders',          authMiddleware, adminMiddleware, order.getAllOrders);
router.put ('/admin/orders/:id/status', authMiddleware, adminMiddleware, order.updateStatus);

// ── PAYMENT (VNPay) ───────────────────────────────────
router.post('/payment/create-url',    authMiddleware, payment.createPaymentUrl);
router.get ('/payment/vnpay-return',  payment.vnpayReturn);   // VNPay redirect (GET)

// ── CHATBOT ───────────────────────────────────────────
router.post('/chatbot/message',       chatbot.sendMessage);

// ── ADMIN ─────────────────────────────────────────────
router.get('/admin/statistics',       authMiddleware, adminMiddleware, admin.getStatistics);
router.get('/admin/users',            authMiddleware, adminMiddleware, admin.getAllUsers);

module.exports = router;
