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
const ZALO_ACCESS_TOKEN = "RR7tJJ6g7dnhiVH5EQqJTMIp_qi_jb8b6yx3GXQKH18kZC5EFi5O1Ww9isOrnmPSFQMw1WVF2Lu6gU0GNjjCQsA7omHR_IDFMRcmF5JN7GT7agvcLFmK6awMdYTXa2TYJikK0Mkn0dvcov4rHO8WT4cPfoz5WHjqTU2MAbAVAcfGrv8FNAHyOK7ExaLCdqa-G_huP1ZWJpyhZDXX2ynW8bBJvKDxhcujI-txPaQAHpXyal9oUEnQFrIml7q8_G0jBFkkTNQtEXSlrQjS0xKi0Yteh49-d2jcVT2d9KsCB6OAdeGC1O9lVL_4XH9WW0v2UVARBrUw2MrKvPbKMle5R5YSgbD0WZmiVPpMOLx5EY5ZZvrmF9ma06R0oMT2WbGtVVdZ2KITSsnXyEy7VOi9R4ZfuXGQhbfxLrbgAzy9CxGRVG"; // ← thay bằng token thật

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
      "https://openapi.zalo.me/v3.0/oa/message",
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
