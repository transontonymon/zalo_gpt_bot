const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// Webhook URL của n8n
const N8N_WEBHOOK_URL = "https://09e38a.n8nhosting.app/webhook/zalo-gpt";

// Zalo OA access token (cần thay bằng token thực tế)
const ZALO_ACCESS_TOKEN = "YOUR_ZALO_OA_ACCESS_TOKEN"; // <-- THAY bằng token thật

// Gửi tin nhắn lại qua Zalo OA (nếu muốn phản hồi lại người dùng)
async function replyToUser(userId, message) {
  try {
    await axios.post(
      "https://openapi.zalo.me/v3.0/oa/message",
      {
        recipient: { user_id: userId },
        message: { text: message },
      },
      {
        headers: {
          access_token: ZALO_ACCESS_TOKEN,
        },
      }
    );
  } catch (err) {
    console.error("Lỗi gửi tin nhắn Zalo:", err.response?.data || err.message);
  }
}

// Xử lý webhook từ Zalo
app.post("/", async (req, res) => {
  try {
    const body = req.body;
    console.log("Zalo webhook payload:", JSON.stringify(body, null, 2));

    // Gửi payload sang webhook n8n
    await axios.post(N8N_WEBHOOK_URL, body);

    // Tuỳ chọn: phản hồi người dùng Zalo (có thể bỏ qua nếu không cần)
    const senderId = body?.data?.uidFrom;
    const userMessage = body?.data?.content;
    if (senderId && userMessage) {
      await replyToUser(senderId, "Cảm ơn bạn đã gửi tin nhắn! Chúng tôi sẽ phản hồi sớm.");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Lỗi webhook:", error.message);
    res.sendStatus(500);
  }
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zalo bot is listening on port ${PORT}`);
});
