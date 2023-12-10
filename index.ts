import dotenv from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { JWT } from "google-auth-library";
import { google, sheets_v4 } from "googleapis";

dotenv.config();
const credentials = require(process.env.PROJECT_KEY_FILENAME || "");

// Create a new JWT client using the credentials
console.log("Creating JWT client");
const client = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Authorize and create a Google Sheets API instance
console.log("Connecting to Google Sheets API with JWT client");
const sheetsApi = google.sheets({ version: "v4", auth: client });

function notNullishFilterPredicate<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

async function getSheetProperties(
  sheetsApi: sheets_v4.Sheets
): Promise<sheets_v4.Schema$SheetProperties[]> {
  let sheetProperties: sheets_v4.Schema$SheetProperties[] = [];

  try {
    const stringSheetProperties = readFileSync(
      "./data/spreadsheet-properties.json"
    )?.toString();

    if (stringSheetProperties) {
      sheetProperties = JSON.parse(stringSheetProperties);
    }

    const spreadsheet = await sheetsApi.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
    });
    console.log("Status:", spreadsheet.status);

    if (spreadsheet.status === 200) {
      const sheets = spreadsheet.data.sheets || [];
      const sheetProperties = sheets
        .map((sheet) => sheet.properties)
        .filter(notNullishFilterPredicate);
      mkdirSync("./data/");
      writeFileSync(
        "./data/spreadsheet-properties.json",
        JSON.stringify(sheetProperties)
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    return sheetProperties;
  }
}

async function main() {
  try {
    const sheetProperties = await getSheetProperties(sheetsApi);

    const transactionsSheet = sheetProperties.find((sheet) =>
      sheet.title?.includes("Transactions")
    );
    if (!transactionsSheet) {
      throw new Error("Missing transactions sheet");
    }

    const balanceHistorySheet = sheetProperties.find((sheet) =>
      sheet.title?.includes("Balance History")
    );
    if (!balanceHistorySheet) {
      throw new Error("Missing balance history sheet");
    }

    // // Read data from the spreadsheet
    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "'Balance History'!A1:B2",
    });

    const values = response.data.values;

    if (!values) {
      console.log("No data found.");
    } else {
      console.log("Data:");
      console.table(values);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
