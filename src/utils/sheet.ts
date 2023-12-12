import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { sheets_v4 } from "googleapis";
import { dataDir } from "../..";

function notNullishFilterPredicate<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function createDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
  }
}

export async function getSheetProperties(
  sheetsApi: sheets_v4.Sheets
): Promise<sheets_v4.Schema$SheetProperties[]> {
  const jsonFilename = "spreadsheet-properties.json";
  let sheetProperties: sheets_v4.Schema$SheetProperties[] = [];

  try {
    const stringSheetProperties = readFileSync(
      dataDir + jsonFilename
    )?.toString();
    return JSON.parse(stringSheetProperties);
  } catch (error) {}

  const spreadsheet = await sheetsApi.spreadsheets.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
  });
  console.log("Status:", spreadsheet.status);

  if (spreadsheet.status === 200) {
    const sheets = spreadsheet.data.sheets || [];
    const sheetProperties = sheets
      .map((sheet) => sheet.properties)
      .filter(notNullishFilterPredicate);
    writeFileSync(dataDir + jsonFilename, JSON.stringify(sheetProperties));
  }
  return sheetProperties;
}

export function checkForNecesarySheets(
  sheetProperties: sheets_v4.Schema$SheetProperties[]
): void {
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
}

export async function getAccounts(
  sheetsApi: sheets_v4.Sheets
): Promise<sheets_v4.Schema$ValueRange["values"]> {
  const jsonFilename = "accounts.json";

  try {
    const stringAccounts = readFileSync(dataDir + jsonFilename)?.toString();
    return JSON.parse(stringAccounts);
  } catch (error) {}

  // // Read data from the spreadsheet
  const response = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: "Accounts!F:Q",
  });
  console.log("Status:", response.status);

  if (response.status === 200) {
    const values = response.data.values || [];
    writeFileSync(dataDir + jsonFilename, JSON.stringify(values));
    return values;
  }
}
