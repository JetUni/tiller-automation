import { randomUUID } from "crypto";
import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { JWT } from "google-auth-library";
import { google } from "googleapis";
import { groupBy } from "lodash";
import { Account } from "./src/models/account.interface";
import { BalanceHistory } from "./src/models/balance-history.interface";
import { Transaction } from "./src/models/transaction.interface";
import { saveBalanceHistoryCsv } from "./src/utils/csv";
import { transformAccountData, transformBalanceHistoryData, transformTransactionData } from "./src/utils/data-mapping";
import {
  checkForNecesarySheets as checkForNecessarySheets,
  createDataDir,
  getSheetProperties,
  getValues,
} from "./src/utils/sheet";

dotenv.config({ path: "./.env.business" });
const credentials = require("./" + process.env.PROJECT_KEY_FILENAME || "");
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

    // ACCOUNTS
    const accountRows = await getValues(sheetsApi, "accounts.json", "Accounts!F:S");
    const accounts: Account[] = transformAccountData(accountRows);
    writeFileSync(dataDir + "accounts.json", JSON.stringify(accounts));

    // TRANSACTIONS
    const transactionRows = await getValues(sheetsApi, "transactions.json", "Transactions!B:R");
    const transactions: Transaction[] = transformTransactionData(transactionRows);
    writeFileSync(dataDir + "transactions.json", JSON.stringify(transactions));

    // BALANCE HISTORY
    const balanceHistoryRows = await getValues(sheetsApi, "balance-history.json", "'Balance History'!B:O");
    const balanceHistory: BalanceHistory[] = transformBalanceHistoryData(balanceHistoryRows);
    writeFileSync(dataDir + "balance-history.json", JSON.stringify(balanceHistory));

    // GENERATE DAILY BALANCE HISTORY
    const transactionsByAccount = groupBy(transactions, "accountId");
    const existingBalancesByAccount = groupBy(balanceHistory, "accountId");
    const balancesByAccount: Record<string, BalanceHistory[]> = {};

    for (const accountId of Object.keys(transactionsByAccount)) {
      const account = accounts.find((acc) => acc.id === accountId);
      if (!account) {
        throw new Error("Cannot find account linked to balance history");
      }

      const transactionsForAccount = transactionsByAccount[accountId];
      const existingBalances = existingBalancesByAccount[accountId];
      let currentBalance = existingBalances[existingBalances.length - 1];
      currentBalance.balance = currentBalance.balance * 100;
      let currentDate = new Date(currentBalance.date);

      balancesByAccount[accountId] = [{ ...currentBalance }];

      while (currentDate <= account.closed) {
        const balanceId = "jarrett" + randomUUID().replaceAll(/-/g, "").substring(7);
        const dailyTransactions = transactionsForAccount.filter(
          (transaction) => transaction.date.toLocaleDateString() === currentDate.toLocaleDateString()
        );

        if (dailyTransactions.length === 0) {
          const lastBalance = balancesByAccount[accountId][balancesByAccount[accountId].length - 1];
          if (lastBalance.date.getTime() !== currentDate.getTime()) {
            // No new transactions, insert last balance for currentDate
            balancesByAccount[accountId].unshift({
              ...currentBalance,
              balanceId,
              date: new Date(currentDate),
              time: "11:59 PM",
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const sum = dailyTransactions.reduce(
          (acc, transaction) => acc + Math.round(transaction.amount * 100),
          currentBalance.balance
        );
        // sum transactions and insert balance
        balancesByAccount[accountId].unshift({
          ...currentBalance,
          balance: sum,
          balanceId,
          date: new Date(currentDate),
          time: "11:59 PM",
        });
        currentBalance = balancesByAccount[accountId][0];
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // flatten balances to write them all to the same csv
    const historyAll = Object.values(balancesByAccount).flat();
    writeFileSync(dataDir + "net-worth.json", JSON.stringify(historyAll));
    saveBalanceHistoryCsv(historyAll, "balance-history.csv");

    // get a summary of the ending balance for each account
    const historySummary = Object.values(balancesByAccount).map((balance) => balance[0]);
    writeFileSync(dataDir + "balance-history-summary.json", JSON.stringify(historySummary));
    saveBalanceHistoryCsv(historySummary, "balance-history-summary.csv");

    console.log("Finished");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
