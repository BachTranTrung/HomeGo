require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User      = require('../models/User');
const Category  = require('../models/Category');
const Product   = require('../models/Product');
const Promotion = require('../models/Promotion');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/homego_db';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Kiểm tra đã có data chưa
    const count = await User.countDocuments();
    if (count > 0) {
      console.log('ℹ️  Dữ liệu đã tồn tại. Chạy với flag --force để seed lại.');
      if (!process.argv.includes('--force')) {
        await mongoose.disconnect();
        return;
      }
      // Xóa hết data cũ
      await Promise.all([User.deleteMany(), Category.deleteMany(), Product.deleteMany(), Promotion.deleteMany()]);
      console.log('🗑️  Đã xóa dữ liệu cũ.');
    }

    console.log('🌱 Đang tạo dữ liệu mẫu...');

    // ── Users ──────────────────────────────────────────
    const adminPwd = await bcrypt.hash('admin123', 10);
    const userPwd  = await bcrypt.hash('user123', 10);

    const [admin, user1] = await User.create([
      { username: 'admin', email: 'admin@homego.vn', password: adminPwd, fullName: 'Quản Trị Viên', phone: '0901234567', role: 'admin' },
      { username: 'nguyenvan', email: 'nguyenvan@gmail.com', password: userPwd, fullName: 'Nguyễn Văn A', phone: '0912345678', role: 'customer' },
      { username: 'tranthib', email: 'tranthib@gmail.com', password: userPwd, fullName: 'Trần Thị B', phone: '0923456789', role: 'customer' },
    ]);

    // ── Categories ─────────────────────────────────────
    const cats = await Category.create([
      { name: 'Nồi & Chảo',    icon: '🍳', description: 'Nồi inox, chảo chống dính, nồi áp suất' },
      { name: 'Máy Lọc Nước',  icon: '💧', description: 'Máy lọc RO, bình lọc, máy lọc gốm' },
      { name: 'Máy Giặt',      icon: '🌀', description: 'Máy giặt lồng ngang, lồng đứng, mini' },
      { name: 'Tủ Lạnh',       icon: '❄️', description: 'Tủ lạnh 1 cánh, 2 cánh, Side by Side' },
      { name: 'Máy Hút Bụi',   icon: '🧹', description: 'Máy hút bụi cầm tay, robot, nhà xưởng' },
      { name: 'Bếp Nấu',       icon: '🔥', description: 'Bếp từ, bếp hồng ngoại, bếp gas âm' },
      { name: 'Máy Xay & Ép',  icon: '🥤', description: 'Máy xay sinh tố, ép trái cây, xay thịt' },
      { name: 'Điều Hòa',      icon: '❄️', description: 'Điều hòa 1 chiều, 2 chiều, inverter' },
    ]);

    const [c1, c2, c3, c4, c5, c6, c7, c8] = cats;

    // ── Products ───────────────────────────────────────
    await Product.create([
      { category: c1._id, name: 'Nồi Inox 3 Đáy Elmich 24cm',       price: 450000,  discount: 10, stock: 50, isFeatured: true,  imageUrl: 'https://images.unsplash.com/photo-1585789575965-a7ea0ae1c8c7?w=400', description: 'Nồi inox cao cấp 3 đáy phù hợp bếp từ, bếp hồng ngoại, bếp gas. Thân nồi dày, tay cầm chống nóng.' },
      { category: c1._id, name: 'Chảo Chống Dính Tefal 28cm',        price: 350000,  discount: 15, stock: 80, isFeatured: true,  imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', description: 'Chảo chống dính bề mặt Titanium Excellence 5 lớp, không PFOA, dùng được bếp từ.' },
      { category: c1._id, name: 'Nồi Áp Suất Sunhouse 6L',           price: 680000,  discount: 5,  stock: 30, isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400', description: 'Dung tích 6 lít, van xả áp tự động, thân nồi 304 không gỉ.' },
      { category: c2._id, name: 'Máy Lọc Nước RO Kangaroo 9 Cấp',   price: 3200000, discount: 20, stock: 15, isFeatured: true,  imageUrl: 'https://images.unsplash.com/photo-1584473457409-ae5c91d211ff?w=400', description: 'Lọc 9 cấp độ, công suất 10 lít/giờ, đèn UV diệt khuẩn, bình chứa 10 lít.' },
      { category: c2._id, name: 'Bình Lọc Nước Brita 3.5L',          price: 450000,  discount: 0,  stock: 40, isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400', description: 'Lọc clo, tạp chất, giảm đá vôi. Lõi dùng được 4 tuần hoặc 150 lít.' },
      { category: c3._id, name: 'Máy Giặt Samsung 9kg Inverter',     price: 7500000, discount: 10, stock: 10, isFeatured: true,  imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Inverter tiết kiệm điện, EcoBubble, 15 chương trình giặt.' },
      { category: c3._id, name: 'Máy Giặt LG 8kg AI DD',             price: 8200000, discount: 8,  stock: 8,  isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=400', description: 'Động cơ AI DD giảm ma sát, kết nối Wi-Fi điều khiển qua app.' },
      { category: c4._id, name: 'Tủ Lạnh Panasonic 2 Cánh 290L',    price: 9800000, discount: 12, stock: 5,  isFeatured: true,  imageUrl: 'https://images.unsplash.com/photo-1536353284924-9220c464e963?w=400', description: 'Ngăn đá dưới, Econavi tiết kiệm điện, khử mùi nano bạc.' },
      { category: c5._id, name: 'Robot Hút Bụi Xiaomi Vacuum S12',   price: 4500000, discount: 25, stock: 20, isFeatured: true,  imageUrl: 'https://images.unsplash.com/photo-1588534510807-86dfb5ed5d5b?w=400', description: 'Lực hút 4000Pa, LiDAR, pin 5200mAh, điều khiển qua Mi Home.' },
      { category: c6._id, name: 'Bếp Từ Chefs EH-MIX366',           price: 2800000, discount: 10, stock: 25, isFeatured: true,  imageUrl: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400', description: 'Bếp từ đôi, công suất 3500W, mặt kính Schott Ceran Đức.' },
      { category: c7._id, name: 'Máy Xay Sinh Tố Philips 2L',        price: 1200000, discount: 5,  stock: 35, isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400', description: 'Động cơ 600W, cối thủy tinh 2 lít chịu nhiệt, 3 tốc độ.' },
      { category: c8._id, name: 'Điều Hòa Daikin 1.5HP Inverter',   price: 12500000,discount: 0,  stock: 7,  isFeatured: true,  imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400', description: 'Điều hòa 2 chiều inverter A++, lọc PM2.5, màng lọc enzyme.' },
      { category: c6._id, name: 'Bếp Gas Âm Hafele 2 Vùng',         price: 1900000, discount: 8,  stock: 18, isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400', description: 'Mặt kính đen, 2 vòng lửa, tự ngắt gas khi tắt lửa.' },
      { category: c5._id, name: 'Máy Hút Bụi Cầm Tay Dyson V12',    price: 9200000, discount: 5,  stock: 6,  isFeatured: false, imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400', description: 'Lực hút 150AW, pin 60 phút, phát hiện bụi laser, chống xoắn.' },
    ]);

    // ── Promotions ─────────────────────────────────────
    await Promotion.create([
      { code: 'HOMEGO10', discount: 10, minOrder: 500000,  expiryDate: new Date('2025-12-31') },
      { code: 'WELCOME20',discount: 20, minOrder: 1000000, expiryDate: new Date('2025-09-30') },
      { code: 'SALE15',   discount: 15, minOrder: 2000000, expiryDate: new Date('2025-08-31') },
    ]);

    console.log('✅ Seed dữ liệu thành công!');
    console.log('');
    console.log('👤 Admin:  admin@homego.vn     / admin123');
    console.log('👤 User:   nguyenvan@gmail.com / user123');
    console.log('');
    console.log('🏷️  Mã giảm giá: HOMEGO10 | WELCOME20 | SALE15');
  } catch (err) {
    console.error('❌ Lỗi seed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
