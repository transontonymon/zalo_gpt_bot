const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// URL GPT backend (có thể update sau)
const GPT_BACKEND_URL = "https://gpt-backend.replit.app/gpt";

app.post("/webhook", async (req, res) => {
  try {
    console.log("Zalo gửi message:", req.body);

    const response = await axios.post(
      GPT_BACKEND_URL,
      req.body,
      { headers: req.headers }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Lỗi proxy:", error.message);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("Proxy server chạy trên port 3000");
});
