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

// Access token của Zalo OA
const ZALO_ACCESS_TOKEN = "RR7tJJ6g7dnhiVH5EQqJTMIp_qi_jb8b6yx3GXQKH18kZC5EFi5O1Ww9isOrnmPSFQMw1WVF2Lu6gU0GNjjCQsA7omHR_IDFMRcmF5JN7GT7agvcLFmK6awMdYTXa2TYJikK0Mkn0dvcov4rHO8WT4cPfoz5WHjqTU2MAbAVAcfGr[...]";

// Bộ nhớ tạm cho từng user
const sessionData = {};

app.post("/webhook", async (req, res) => {
    const senderId = req.body.sender?.id;
    const name = req.body.sender?.name || "unknown";
    const message = req.body.message;
    const type = message?.type || message?.attachments?.[0]?.type;

    if (!sessionData[senderId]) {
        sessionData[senderId] = {
            name,
            phone: "",
            image: "",
            location: ""
        };
    }

    if (type === "text") {
        const text = message.text;
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

    const userMessage = req.body.message?.text || "Xin chào";

    if (userMessage) {
        try {
            console.log("👉 Gửi tới Coze:", userMessage);

            const cozeRes = await axios.post(
                COZE_API_URL,
                {
                    bot_id: COZE_BOT_ID,
                    user: senderId,
                    query: userMessage,
                    metadata: {
                        system_prompt: "Bạn là trợ lý AI của KCN Bảo Minh. Trả lời bằng tiếng Việt, chỉ dựa vào dữ liệu công ty cung cấp. Nếu không chắc chắn, hãy xin lỗi..."
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
    }
});

app.listen(3000, () => {
    console.log("🚀 Webhook Zalo OA x Coze đang chạy trên port 3000");
});
