const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Load your credentials
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Your Google Sheet ID and tab name
const SPREADSHEET_ID = '1fZjlWYa6tdGCthamdWHPN5MtsbiLaJpB_IVRsInjj2E';
const SHEET_NAME = 'Responses';

// Append a row to the Google Sheet
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