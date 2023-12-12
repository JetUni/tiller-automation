import dotenv from "dotenv";
import { JWT } from "google-auth-library";
import { google } from "googleapis";
import {
  checkForNecesarySheets as checkForNecessarySheets,
  createDataDir,
  getSheetProperties,
  getValues,
} from "./src/utils/sheet";

dotenv.config();
const credentials = require(process.env.PROJECT_KEY_FILENAME || "");
export const dataDir = "./data/";

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

async function main() {
  try {
    createDataDir();
    const sheetProperties = await getSheetProperties(sheetsApi);
    checkForNecessarySheets(sheetProperties);

    await getValues(sheetsApi, "accounts.json", "Accounts!F:Q");
    await getValues(sheetsApi, "balance-history.json", "'Balance History'!A:O");
    await getValues(sheetsApi, "transactions.json", "Transactions!A:S");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
