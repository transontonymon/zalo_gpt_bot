const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// === THÔNG TIN CẤU HÌNH ===
const COZE_API_URL = "https://api.coze.com/open_api/v2/chat";
const COZE_BOT_ID = "7491980474345291777";
const COZE_ACCESS_TOKEN = "pat_Ls7QUGDP0u2DEvU0hxPd8ksNbDNHPEQmCUVJtmOjrGTaNsbQHebsi3s5kYWZlwcd";
const ZALO_ACCESS_TOKEN = "5X90T6ymeHWG4aDyPpUi4HyGI79XBDn1Qtm-KcyDYq5ZUmLjUpFgILnJUN9IAjjIMNm-V5e2f7bX8JX3Lrw0820P3mqxGkjhCZTeJqiMvYqqN7CEC2tjFoPsVWag2C8JN5L_26KCvJ4SBcOK95xP8XrrEn0U0gCMV6Kr5Nmuk0jWVmGeIYVYDMvWVJbW6y0qU49G94K3oo5kA5X5TLBb8qivLbfYGTL7MI19M5S6x6z8ENrIJsFeRtC21dLlMRrJKIyIVqr_zrzfNnL3NWIWJMLZC7vj6ejuR7zaIaezrqHGR75dKmZEU4r8Aset2QjwLMC4RoaZlt4vLZ54BpsKAHf6Soqb4PSuArew61qPcWWeVIKE5pp54XPYQmqrFDuBCdWzAY8Qf1G1C1Wl7qE76GCx4tuLQ_L7JnBNL6qkf1a";
// ===========================

app.post("/webhook", async (req, res) => {
  console.log("📥 Nhận webhook:", JSON.stringify(req.body, null, 2));

  const senderId = req.body.sender?.id;
  const event = req.body.event_name;
  let userMessage = "";

  if (!senderId) {
    console.error("❗Không tìm thấy senderId trong request.");
    return res.sendStatus(400);
  }

  // Xử lý các loại sự kiện từ Zalo
  switch (event) {
    case "user_send_text":
      userMessage = req.body.message?.text || "Tin nhắn trống";
      break;
    case "user_send_image":
      const imageUrl = req.body.message?.attachments?.[0]?.payload?.url;
      userMessage = `Người dùng đã gửi ảnh: ${imageUrl}`;
      break;
    case "user_send_contact":
      const contact = req.body.message?.contact;
      userMessage = `Người dùng gửi số điện thoại: ${contact?.phone_number}, tên: ${contact?.name}`;
      break;
    case "user_send_location":
      const location = req.body.message?.location;
      userMessage = `Người dùng đã gửi vị trí: ${location?.label} (lat: ${location?.latitude}, long: ${location?.longitude})`;
      break;
    default:
      userMessage = `Sự kiện chưa hỗ trợ: ${event}`;
  }

  console.log("👤 User ID:", senderId);
  console.log("💬 Tin nhắn xử lý:", userMessage);

  try {
    // Gửi dữ liệu tổng hợp sang Coze
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

    // Gửi phản hồi về Zalo OA
    try {
      const zaloRes = await axios.post(
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

      console.log("📩 Zalo API trả về:", zaloRes.data);
    } catch (zaloErr) {
      console.error("🚫 Lỗi gửi tin nhắn Zalo:", zaloErr.response?.data || zaloErr.message);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Lỗi webhook xử lý:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("🚀 Webhook Zalo OA x Coze đang chạy trên port 3000");
});
