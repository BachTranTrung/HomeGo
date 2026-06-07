/* ============================================================
   api.js — Axios-like fetch wrapper dùng Fetch API
   ============================================================ */
const BASE_URL = 'http://localhost:5000/api';

async function request(method, endpoint, body = null) {
  const token = localStorage.getItem('token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);

  const res  = await fetch(BASE_URL + endpoint, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || `Lỗi ${res.status}`);
  return data;
}

const api = {
  get:    (url)         => request('GET',    url),
  post:   (url, body)   => request('POST',   url, body),
  put:    (url, body)   => request('PUT',    url, body),
  delete: (url)         => request('DELETE', url),
};

/* ── AUTH HELPERS ─────────────────────────────────────── */
function getUser()  { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }
function getToken() { return localStorage.getItem('token'); }
function isLoggedIn()  { return !!getToken(); }
function isAdmin()     { return getUser()?.role === 'admin'; }

function saveAuth(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user',  JSON.stringify(data.user));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = '/pages/customer/login.html';
}

/* ── CART HELPERS (Server API khi login, localStorage khi chưa) ─── */
function getCart() {
  try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
}
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }

// Thêm vào giỏ — gọi server nếu đã đăng nhập
async function addToCart(product, qty = 1) {
  if (isLoggedIn()) {
    try {
      await api.post('/cart', { productId: product._id, quantity: qty });
      await syncCartBadgeFromServer();
      return;
    } catch (e) { console.warn('Cart API lỗi, fallback localStorage:', e.message); }
  }
  // fallback localStorage
  const cart = getCart();
  const idx  = cart.findIndex(i => i.productId === product._id);
  if (idx >= 0) cart[idx].quantity += qty;
  else cart.push({
    productId: product._id,
    name:      product.name,
    imageUrl:  product.imageUrl,
    price:     product.salePrice || Math.round(product.price*(1-(product.discount||0)/100)),
    discount:  product.discount || 0,
    quantity:  qty,
  });
  saveCart(cart);
  updateCartBadge();
}

function removeFromCart(productId) {
  saveCart(getCart().filter(i => i.productId !== productId));
  updateCartBadge();
}

function updateCartQty(productId, qty) {
  const cart = getCart();
  const idx  = cart.findIndex(i => i.productId === productId);
  if (idx >= 0) {
    if (qty <= 0) cart.splice(idx, 1);
    else cart[idx].quantity = qty;
  }
  saveCart(cart);
  updateCartBadge();
}

function cartTotal() { return getCart().reduce((s, i) => s + i.price * i.quantity, 0); }
function cartCount() { return getCart().reduce((s, i) => s + i.quantity, 0); }

async function syncCartBadgeFromServer() {
  try {
    const data = await api.get('/cart');
    document.querySelectorAll('.cart-badge').forEach(el => { el.textContent = data.count || 0; });
  } catch { updateCartBadge(); }
}

function updateCartBadge() {
  document.querySelectorAll('.cart-badge').forEach(el => { el.textContent = cartCount(); });
}

/* ── FORMAT HELPERS ───────────────────────────────────── */
function fmtPrice(n) { return new Intl.NumberFormat('vi-VN').format(n) + '₫'; }
function fmtDate(d)  { return new Date(d).toLocaleDateString('vi-VN'); }
function fmtDateTime(d) { return new Date(d).toLocaleString('vi-VN'); }

function stars(avg) {
  avg = Math.round(avg || 0);
  return '★'.repeat(avg) + '☆'.repeat(5 - avg);
}

/* ── TOAST ────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast-msg toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3000);
}

/* ── GUARD ────────────────────────────────────────────── */
function requireLogin() {
  if (!isLoggedIn()) { window.location.href = '/pages/customer/login.html'; return false; }
  return true;
}
function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) { window.location.href = '/index.html'; return false; }
  return true;
}

/* ── NAVBAR ACTIVE LINK ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Đồng bộ số lượng giỏ hàng từ server nếu đã login
  if (isLoggedIn()) {
    api.get('/cart').then(data => {
      document.querySelectorAll('.cart-badge').forEach(el => { el.textContent = data.count || 0; });
    }).catch(() => updateCartBadge());
  } else {
    updateCartBadge();
  }

  // Avatar / user menu
  const userMenu = document.getElementById('userMenuName');
  const user = getUser();
  if (userMenu && user) userMenu.textContent = user.fullName || user.username || user.email;

  const loginLink  = document.getElementById('navLoginLink');
  const logoutLink = document.getElementById('navLogoutLink');
  const adminLink  = document.getElementById('navAdminLink');

  if (isLoggedIn()) {
    if (loginLink)  loginLink.classList.add('d-none');
    if (logoutLink) logoutLink.classList.remove('d-none');
    if (adminLink && isAdmin()) adminLink.classList.remove('d-none');
  } else {
    if (logoutLink) logoutLink.classList.add('d-none');
    if (adminLink)  adminLink.classList.add('d-none');
  }

  if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); logout(); });
});
