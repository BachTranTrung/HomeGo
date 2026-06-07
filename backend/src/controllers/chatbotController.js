// POST /api/chatbot/message
// Nếu chưa cấu hình Dialogflow, trả về câu trả lời mặc định theo keyword
exports.sendMessage = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'Thiếu nội dung tin nhắn' });

  // ── Thử Dialogflow nếu đã cấu hình ──────────────────
  const projectId = process.env.DIALOGFLOW_PROJECT_ID;
  if (projectId && projectId !== 'your_dialogflow_project_id') {
    try {
      const dialogflow = require('@google-cloud/dialogflow');
      const sessionClient = new dialogflow.SessionsClient({
        keyFilename: process.env.DIALOGFLOW_CREDENTIALS_PATH,
      });
      const sessionPath = sessionClient.projectAgentSessionPath(projectId, 'homego-session-' + Date.now());
      const [response] = await sessionClient.detectIntent({
        session: sessionPath,
        queryInput: { text: { text: message, languageCode: 'vi' } },
      });
      const reply = response.queryResult.fulfillmentText;
      return res.json({ reply });
    } catch (err) {
      console.warn('⚠️  Dialogflow lỗi, fallback sang keyword:', err.message);
    }
  }

  // ── Fallback: keyword-based chatbot ─────────────────
  const msg = message.toLowerCase();
  let reply = 'Xin chào! Tôi có thể giúp gì cho bạn? Bạn có thể hỏi về sản phẩm, đơn hàng, hoặc chính sách của HomeGo. 😊';

  if (/chào|hello|hi|xin chào/.test(msg))
    reply = 'Xin chào! Chào mừng bạn đến với HomeGo 🏠 Bạn cần tư vấn sản phẩm gia dụng nào?';
  else if (/bếp từ|bep tu/.test(msg))
    reply = 'HomeGo có nhiều dòng bếp từ: Bếp Từ Chefs EH-MIX366 (2.800.000₫), Bếp Gas Âm Hafele (1.900.000₫). Bạn muốn xem chi tiết sản phẩm nào? 🔥';
  else if (/tủ lạnh|tu lanh/.test(msg))
    reply = 'HomeGo có Tủ Lạnh Panasonic 2 Cánh 290L giá 9.800.000₫, đang giảm 12%. Tủ sử dụng công nghệ Econavi tiết kiệm điện! ❄️';
  else if (/máy giặt|may giat/.test(msg))
    reply = 'HomeGo có Samsung 9kg Inverter (7.500.000₫) và LG 8kg AI DD (8.200.000₫). Cả hai đều inverter tiết kiệm điện. Bạn cần tư vấn thêm không? 🌀';
  else if (/điều hòa|dieu hoa|điều hoa/.test(msg))
    reply = 'Điều Hòa Daikin 1.5HP Inverter là sản phẩm bán chạy, giá 12.500.000₫. Inverter 2 chiều, lọc PM2.5. ❄️';
  else if (/nồi|chảo|noi|chao/.test(msg))
    reply = 'Chúng tôi có Nồi Inox Elmich 24cm (450.000₫ -10%) và Chảo Chống Dính Tefal 28cm (350.000₫ -15%). Chất lượng châu Âu! 🍳';
  else if (/robot|hút bụi|hut bui/.test(msg))
    reply = 'Robot Hút Bụi Xiaomi Vacuum S12 đang ưu đãi -25%, còn 3.375.000₫. Lực hút 4000Pa, lập bản đồ LiDAR thông minh! 🧹';
  else if (/giảm giá|mã giảm|khuyen mai|khuyến mãi/.test(msg))
    reply = 'HomeGo đang có 3 mã giảm giá:\n• HOMEGO10: Giảm 10% (đơn từ 500k)\n• WELCOME20: Giảm 20% (đơn từ 1tr)\n• SALE15: Giảm 15% (đơn từ 2tr) 🏷️';
  else if (/giao hàng|ship|vận chuyển/.test(msg))
    reply = 'HomeGo giao hàng toàn quốc! Miễn phí vận chuyển đơn từ 500.000₫. Thời gian giao: 1-3 ngày (nội thành), 3-7 ngày (tỉnh). 🚚';
  else if (/bảo hành|đổi trả/.test(msg))
    reply = 'Chính sách của HomeGo:\n• Bảo hành chính hãng 12-24 tháng\n• Đổi trả miễn phí trong 30 ngày nếu lỗi NSX\n• Hỗ trợ 24/7 qua hotline 1800 1234 ↩️';
  else if (/thanh toán|payment|cod|vnpay/.test(msg))
    reply = 'HomeGo hỗ trợ 2 phương thức:\n• COD: Thanh toán khi nhận hàng\n• VNPAY: Thanh toán online qua thẻ ATM, Visa, ví điện tử 💳';
  else if (/đơn hàng|theo dõi/.test(msg))
    reply = 'Bạn có thể theo dõi đơn hàng tại mục "Đơn hàng của tôi" sau khi đăng nhập. Cần hỗ trợ gấp, gọi 1800 1234! 📦';
  else if (/địa chỉ|cửa hàng|showroom/.test(msg))
    reply = 'HomeGo có showroom tại:\n• HCM: 123 Nguyễn Văn Linh, Q.7\n• HN: 456 Trần Duy Hưng, Cầu Giấy\nBản đồ xem trên trang Liên hệ! 📍';

  res.json({ reply });
};
