const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// === THÔNG TIN CẤU HÌNH ===
const COZE_API_URL = "https://api.coze.com/open_api/v2/chat";
const COZE_BOT_ID = "7491980474345291777";
const COZE_ACCESS_TOKEN = "pat_Ls7QUGDP0u2DEvU0hxPd8ksNbDNHPEQmCUVJtmOjrGTaNsbQHebsi3s5kYWZlwcd";

// Access token của Zalo OA
const ZALO_ACCESS_TOKEN = "xonQ8HnrHnFfB5af579A6kOkKYSIQHLkl79m71fv7IIATaDR7taCARX34rGD74njh1i-K1imPoEGT7fy3q81EvL-JrqfJpiItHD2SIe030kRFKf9DnmsDhSCJKij9Y8BZm9pPZ1OFYsGNYTI7rLeRvCEBnGH5sLRi2eFA049Rb6m0oOX02zzUwCkPXa12ISYzrDkOrDN8pcX3p5O1oDOOwrd7IOQP5H9fayv9L1bUc6dUXbRALzQCDjfGr9DPL0rmLijMMfXVmJeEX4ZIofpNiKW5m9m7mHbrXj4AqaKAKZQALKkMI8aGzWRP0f8C3Xdvczq8r1DF13z5d5YSIOV3iGzJcWsOm0AgpDSOWyv5G--O7bm575g8qF5QIiA7cj24W"; // ← thay bằng token thật

// ===========================

app.post("/webhook", async (req, res) => {
  // Tạm dùng user cố định giống khi test trong Coze để đảm bảo bot phản hồi đúng
const userMessage = req.body.message?.text || "Xin chào";
const senderId = "admin_test"; // ← Thay bằng đúng user_id mà anh dùng test trong Coze Studio
  try {
    // Gọi Coze API
   const cozeRes = await axios.post(
  COZE_API_URL,
  {
    bot_id: COZE_BOT_ID,
    user: senderId,
    query: userMessage,
    metadata: {
      system_prompt: "Bạn là trợ lý AI của KCN Bảo Minh. Trả lời bằng tiếng Việt, chỉ dựa vào dữ liệu công ty cung cấp. Nếu không chắc chắn, hãy xin lỗi người dùng."
    }
  },
  {
    headers: {
      Authorization: `Bearer ${COZE_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    }
  }
);
    const reply = cozeRes.data?.messages?.[0]?.content || "Xin lỗi, tôi chưa có câu trả lời.";

    console.log("✅ Phản hồi từ Coze:", reply);

    // Gửi lại phản hồi cho người dùng Zalo
    await axios.post(
      "https://openapi.zalo.me/v3.0/oa/message/cs",
      {
        recipient: { user_id: senderId },
        message: { text: reply }
      },
      {
        headers: {
          access_token: ZALO_ACCESS_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Lỗi webhook:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("🚀 Webhook Zalo OA x Coze đang chạy trên port 3000");
});
