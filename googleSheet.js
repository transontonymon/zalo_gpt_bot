const { google } = require("googleapis");
const keys = require("./credentials.json");

const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1IsOUJIaLeIAy8MgpUtE3sgeYlBlMcAWUaWrcgtgYcXI";

async function appendToSheet({ name, phone, image, location }) {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const values = [[now, name, phone, image, location]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "A:E", // Đảm bảo không bị ghi đè dòng tiêu đề
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}

module.exports = { appendToSheet };
