const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const COZE_API_URL = "https://api.coze.com/open_api/v2/chat";
const COZE_BOT_ID = "7491980474345291777";
const COZE_ACCESS_TOKEN = "pat_GCZAzVh7OxTCNBtsN9WbpT1doazwpdDxQju0cGOtHwN9ieI29fHtkNcl9aLdGj3E";

app.post("/webhook", async (req, res) => {
  const userMessage = req.body.message?.text || "Xin chào";
  const senderId = req.body.sender?.id || "zalo_user";

  try {
    const cozeRes = await axios.post(
      COZE_API_URL,
      {
        bot_id: COZE_BOT_ID,
        user: senderId,
        query: userMessage
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

    // Sau này có thể thêm đoạn gửi reply về Zalo tại đây

    res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ Lỗi gọi Coze:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("🚀 Webhook Zalo x Coze đang chạy trên port 3000");
});
