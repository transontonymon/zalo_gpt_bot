const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const { appendToSheet } = require("./googleSheet");

const app = express();
app.use(bodyParser.json());

// === THÔNG TIN CẤU HÌNH ===
const COZE_API_URL = "https://api.coze.com/open_api/v2/chat";
const COZE_BOT_ID = "7491980474345291777";
const COZE_ACCESS_TOKEN = "pat_Ls7QUGDP0u2DEvU0hxPd8ksNbDNHPEQmCUVJtmOjrGTaNsbQHebsi3s5kYWZlwcd";

const ZALO_ACCESS_TOKEN = "RR7tJJ6g7dnhiVH5EQqJTMIp_qi_jb8b6yx3GXQKH18kZC5EFi5O1Ww9isOrnmPSFQMw1WVF2Lu6gU0GNjjCQsA7omHR_IDFMRcmF5JN7GT7agvcLFmK6awMdYTXa2TYJikK0Mkn0dvcov4rHO8WT4cPfoz5WHjqTU2MAbAVAcfGrv8FNAHyOK7ExaLCdqa-G_huP1ZWJpyhZDXX2ynW8bBJvKDxhcujI-txPaQAHpXyal9oUEnQFrIml7q8_G0jBFkkTNQtEXSlrQjS0xKi0Yteh49-d2jcVT2d9KsCB6OAdeGC1O9lVL_4XH9WW0v2UVARBrUw2MrKvPbKMle5R5YSgbD0WZmiVPpMOLx5EY5ZZvrmF9ma06R0oMT2WbGtVVdZ2KITSsnXyEy7VOi9R4ZfuXGQhbfxLrbgAzy9CxGRVG";
// ===========================

const sessionData = {}; // Bộ nhớ tạm theo user

app.post("/webhook", async (req, res) => {
  console.log("📥 Webhook đến:", JSON.stringify(req.body, null, 2));

  const senderId = req.body.sender?.id;
  const name = req.body.sender?.name || "unknown";
  const message = req.body.message;
  const type = message?.type || message?.attachments?.[0]?.type;

  if (!senderId || !message) {
    return res.sendStatus(200);
  }

  if (!sessionData[senderId]) {
    sessionData[senderId] = {
      name,
      phone: "",
      image: "",
      location: ""
    };
  }

  let userMessage = "";

  if (type === "text") {
    const text = message.text;
    userMessage = text;
    if (/^\d{9,11}$/.test(text)) {
      sessionData[senderId].phone = text;
    }
  }

  if (type === "location") {
    const coords = message.attachments?.[0]?.payload?.coordinates;
    if (coords?.latitude && coords?.longitude) {
      sessionData[senderId].location = `${coords.latitude}, ${coords.longitude}`;
    }
  }

  if (type === "image") {
    const imageUrl = message.attachments?.[0]?.payload?.url || message.url;
    if (imageUrl) {
      sessionData[senderId].image = imageUrl;
    }
  }

  const { phone, image, location } = sessionData[senderId];

  if (phone && image && location) {
    try {
      await appendToSheet({
        name: sessionData[senderId].name,
        phone,
        image,
        location
      });

      console.log("✅ Đã ghi vào Google Sheet");

      await axios.post(
        "https://openapi.zalo.me/v3.0/oa/message/cs",
        {
          recipient: { user_id: senderId },
          message: { text: "✅ Cảm ơn bạn! Thông tin đã được ghi nhận." }
        },
        {
          headers: {
            access_token: ZALO_ACCESS_TOKEN,
            "Content-Type": "application/json"
          }
        }
      );

      delete sessionData[senderId];
    } catch (err) {
      console.error("❌ Lỗi ghi Google Sheet:", err);
    }
  }

  // Gửi tất cả tin nhắn text sang Coze bất kể trạng thái
  if (userMessage) {
    try {
      console.log("👉 Gửi tới Coze:", userMessage);

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

      const reply = cozeRes.data?.messages?.[0]?.content || "🤖 Bot chưa hiểu, bạn nói lại nhé!";
      console.log("🧠 Phản hồi từ Coze:", reply);

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
    } catch (err) {
      console.error("❌ Lỗi gọi Coze API:", err.response?.data || err.message);
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("🚀 Webhook Zalo OA x Coze đang chạy trên port 3000");
});
