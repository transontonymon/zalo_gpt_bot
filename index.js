require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(express.json());

// ENV config
let accessToken = process.env.ZALO_ACCESS_TOKEN;
const refreshToken = process.env.ZALO_REFRESH_TOKEN;
const appId = process.env.ZALO_APP_ID;
const appSecret = process.env.ZALO_APP_SECRET;
const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

// Hàm cập nhật file .env (tùy chọn)
function updateEnvValue(key, value) {
  const envPath = ".env";
  let content = fs.readFileSync(envPath, "utf-8");
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (content.match(regex)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }

  fs.writeFileSync(envPath, content);
}

// Làm mới token nếu hết hạn
async function refreshAccessToken() {
  try {
    const res = await axios.post("https://oauth.zaloapp.com/v4/oa/access_token", {
      app_id: appId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      app_secret: appSecret,
    });

    if (res.data.access_token) {
      accessToken = res.data.access_token;
      console.log("✅ Refreshed ZALO_ACCESS_TOKEN");
      updateEnvValue("ZALO_ACCESS_TOKEN", accessToken);
    } else {
      console.error("❌ Không nhận được access token mới:", res.data);
    }
  } catch (err) {
    console.error("❌ Lỗi khi refresh token:", err.response?.data || err.message);
  }
}

// Gửi lại tin nhắn cho người dùng
async function replyToUser(userId, message) {
  try {
    await axios.post(
      "https://openapi.zalo.me/v3.0/oa/message",
      {
        recipient: { user_id: userId },
        message: { text: message },
      },
      {
        headers: { access_token: accessToken },
      }
    );
  } catch (err) {
    const errorCode = err.response?.data?.error;
    if (errorCode === -201) {
      console.log("🔁 Token hết hạn, đang làm mới...");
      await refreshAccessToken();
      return replyToUser(userId, message);
    }
    console.error("❌ Lỗi gửi tin nhắn:", err.response?.data || err.message);
  }
}

// Webhook từ Zalo OA gửi về
app.post("/", async (req, res) => {
  try {
    const body = req.body;
    console.log("📩 Nhận webhook từ Zalo:", JSON.stringify(body, null, 2));

    // Gửi dữ liệu sang N8N
    await axios.post(n8nWebhookUrl, body);

    // Tuỳ chọn trả lời khách
    const senderId = body?.data?.uidFrom;
    const msg = body?.data?.content;
    if (senderId && msg) {
      await replyToUser(senderId, "✅ Bot đã nhận được tin nhắn của bạn!");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Lỗi xử lý webhook:", err.message);
    res.sendStatus(500);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
