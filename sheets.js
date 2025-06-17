const { google } = require('googleapis');
const path = require('path');

// ✅ Safely parse GOOGLE_CREDENTIALS env var
let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (error) {
  console.error("❌ Failed to parse GOOGLE_CREDENTIALS. Check your Railway environment variable.");
  process.exit(1); // crash early with clear reason
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Replace with your actual sheet ID and tab name
const SPREADSHEET_ID = '1fZjlWYa6tdGCthamdWHPN5MtsbiLaJpB_IVRsInjj2E';
const SHEET_NAME = 'Responses';

async function appendRow(rowData) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [rowData],
    },
  });
}

module.exports = { appendRow };