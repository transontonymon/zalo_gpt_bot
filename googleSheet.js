const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const CREDENTIALS_PATH = path.join(__dirname, "abiding-bongo-456602-j4-652a94256801.json");
const SPREADSHEET_ID = "1IsOUJIaLeIAy8MgpUtE3sgeYlBlMcAWUaWrcgtgYcXI";

async function appendToSheet(data) {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

  const currentTime = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const values = [[
    currentTime,
    data.name || "unknown",
    data.phone || "",
    data.image || "",
    data.location || ""
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });

  console.log("✅ Đã ghi dữ liệu vào Google Sheet.");
}

module.exports = { appendToSheet };
