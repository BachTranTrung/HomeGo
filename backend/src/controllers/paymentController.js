const crypto = require('crypto');
const Order  = require('../models/Order');
require('dotenv').config();

const VNP_URL        = process.env.VNPAY_URL        || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_TMN_CODE   = process.env.VNPAY_TMN_CODE   || 'DEMOV210';
const VNP_HASH_SECRET= process.env.VNPAY_HASH_SECRET|| 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';
const VNP_RETURN_URL = process.env.VNPAY_RETURN_URL  || 'http://localhost:5000/api/payment/vnpay-return';

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach(k => { sorted[k] = obj[k]; });
  return sorted;
}

// POST /api/payment/create-url
exports.createPaymentUrl = async (req, res) => {
  const { orderId, amount, orderInfo } = req.body;
  try {
    const date   = new Date();
    const pad    = (n, l = 2) => String(n).padStart(l, '0');
    const createDate = `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    const txnRef = `${orderId}-${Date.now()}`;

    const params = sortObject({
      vnp_Version:   '2.1.0',
      vnp_Command:   'pay',
      vnp_TmnCode:   VNP_TMN_CODE,
      vnp_Amount:    amount * 100,
      vnp_CreateDate: createDate,
      vnp_CurrCode:  'VND',
      vnp_IpAddr:    req.ip || '127.0.0.1',
      vnp_Locale:    'vn',
      vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: VNP_RETURN_URL,
      vnp_TxnRef:    txnRef,
    });

    const signData  = new URLSearchParams(params).toString();
    const hmac      = crypto.createHmac('sha512', VNP_HASH_SECRET);
    const signed    = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    params.vnp_SecureHash = signed;

    // Lưu txnRef vào order để đối soát
    await Order.findByIdAndUpdate(orderId, { vnpayTxnRef: txnRef });

    const payUrl = `${VNP_URL}?${new URLSearchParams(params).toString()}`;
    res.json({ payUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payment/vnpay-return  (VNPay redirect về)
exports.vnpayReturn = async (req, res) => {
  const params = { ...req.query };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted    = sortObject(params);
  const signData  = new URLSearchParams(sorted).toString();
  const hmac      = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const checkSum  = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const FRONTEND  = process.env.FRONTEND_URL || 'http://localhost:5500';

  if (checkSum !== secureHash) {
    return res.redirect(`${FRONTEND}/pages/customer/order-success.html?status=invalid`);
  }

  const txnRef  = params.vnp_TxnRef;
  const rspCode = params.vnp_ResponseCode;

  const order = await Order.findOne({ vnpayTxnRef: txnRef });
  if (order) {
    if (rspCode === '00') {
      order.paymentStatus = 'paid';
      order.status        = 'confirmed';
    } else {
      order.paymentStatus = 'failed';
    }
    await order.save();
  }

  const status = rspCode === '00' ? 'success' : 'failed';
  res.redirect(`${FRONTEND}/pages/customer/order-success.html?status=${status}&orderId=${order?._id || ''}`);
};
