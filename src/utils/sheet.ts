import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { sheets_v4 } from "googleapis";
import { dataDir } from "../..";

function notNullishFilterPredicate<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function createDataDir() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir);
  }
  if (!existsSync(dataDir + "values/")) {
    mkdirSync(dataDir + "values/");
  }
}

export async function getSheetProperties(sheetsApi: sheets_v4.Sheets): Promise<sheets_v4.Schema$SheetProperties[]> {
  const jsonFilename = "spreadsheet-properties.json";
  let sheetProperties: sheets_v4.Schema$SheetProperties[] = [];

  try {
    const stringSheetProperties = readFileSync(dataDir + jsonFilename)?.toString();
    return JSON.parse(stringSheetProperties);
  } catch (error) {}

  const spreadsheet = await sheetsApi.spreadsheets.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
  });
  console.log("Status:", spreadsheet.status);

  if (spreadsheet.status === 200) {
    const sheets = spreadsheet.data.sheets || [];
    sheetProperties = sheets.map((sheet) => sheet.properties).filter(notNullishFilterPredicate);
    writeFileSync(dataDir + jsonFilename, JSON.stringify(sheetProperties));
  }
  return sheetProperties;
}

export function checkForNecesarySheets(sheetProperties: sheets_v4.Schema$SheetProperties[]): void {
  const requiredSheets = ["Accounts", "Balance History", "Transactions"];

  requiredSheets.forEach((sheetName) => {
    const sheetProperty = sheetProperties.find((sheet) => sheet.title?.includes(sheetName));
    if (!sheetProperty) {
      throw new Error(`Missing ${sheetName.toLowerCase()} sheet`);
    }
  });
}

export async function getValues(
  sheetsApi: sheets_v4.Sheets,
  jsonFilename: string,
  range: string,
  pullFresh = false
): Promise<string[][]> {
  try {
    if (!pullFresh) {
      const stringAccounts = readFileSync(dataDir + "values/" + jsonFilename)?.toString();
      const result = JSON.parse(stringAccounts);
      console.log(`Loaded data from ${jsonFilename}: ${result.length} rows`);
      return result;
    }
  } catch (error) {}

  // Read data from the spreadsheet
  const response = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range,
  });
  console.log("Status:", response.status);

  if (response.status === 200) {
    const values = response.data.values;
    if (values) {
      writeFileSync(dataDir + "values/" + jsonFilename, JSON.stringify(values));
      console.log(`Retrieved ${values.length} rows from Google Sheets and saved to ${jsonFilename}`);
      return values;
    }
    throw new Error("No values found for " + range);
  }
  throw new Error(response.statusText);
}
