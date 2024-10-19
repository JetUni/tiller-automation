import { Account, MappedAccount } from "../models/account.interface";
import { BalanceHistory, MappedBalanceHistory } from "../models/balance-history.interface";
import { MappedTransaction, Transaction } from "../models/transaction.interface";

const commonNameMap: Record<string, "accountNumber"> = {
  "Account #": "accountNumber",
};

const accountMap: Record<string, "accountNumber" | "uniqueIdentifier" | "id" | "classBH" | "equityType"> = {
  ...commonNameMap,
  "Unique Account Identifier": "uniqueIdentifier",
  "Account Id": "id",
  "Class (BH)": "classBH",
  Class: "equityType",
};

const balanceHistoryMap: Record<string, "accountNumber" | "equityType"> = {
  ...commonNameMap,
  Class: "equityType",
};

const transactionMap: Record<string, "accountNumber"> = {
  ...commonNameMap,
};

function camelCase<T>(str: string): keyof T {
  return str
    .toLowerCase()
    .replace(/\s(.)/g, (a) => a.toUpperCase())
    .replace(/\s/g, "")
    .replace(/^(.)/, (b) => b.toLowerCase()) as keyof T;
}

function getMapsForData<T extends { [key: string]: string }>(
  headerRow: string[],
  baseMap: Record<string, Partial<keyof T>>
): {
  keyToIndexMap: { [P in keyof T]: number };
  indexToKeyMap: (keyof T)[];
} {
  return headerRow.reduce<{
    keyToIndexMap: { [P in keyof T]: number };
    indexToKeyMap: (keyof T)[];
  }>(
    (map, columnName, idx) => {
      const key = baseMap[columnName] || camelCase<T>(columnName);
      map["keyToIndexMap"][key] = idx;
      map["indexToKeyMap"].push(key);
      return map;
    },
    { keyToIndexMap: {} as { [P in keyof T]: number }, indexToKeyMap: [] }
  );
}

export function transformAccountData(accountRows: string[][]): Account[] {
  // Get pre-assigned mapped values, or camelCase values to use as keys for JSON structure data transformation
  const { keyToIndexMap, indexToKeyMap } = getMapsForData<MappedAccount>(accountRows[0], accountMap);

  const transformedRows = accountRows.slice(1).map((row: string[]) => {
    // Map all key/value pairs using the maps created
    const account: Account = {} as Account;
    const transformedRow = indexToKeyMap.reduce((map, val, idx) => {
      (map as any)[val] = row[idx] || null;
      return map;
    }, account);
    // Transform any unique data types that aren't strings
    transformedRow["lastBalance"] = parseFloat(row[keyToIndexMap["lastBalance"]].replace(/[\$,]/g, ""));
    transformedRow["lastUpdate"] = new Date(row[keyToIndexMap["lastUpdate"]]);
    transformedRow["opened"] = new Date(row[keyToIndexMap["opened"]]);
    transformedRow["closed"] = new Date(row[keyToIndexMap["closed"]]);
    return transformedRow;
  });
  return transformedRows;
}

export function transformBalanceHistoryData(balanceHistoryRows: string[][]): BalanceHistory[] {
  // Get pre-assigned mapped values, or camelCase values to use as keys for JSON structure data transformation
  const { keyToIndexMap, indexToKeyMap } = getMapsForData<MappedBalanceHistory>(
    balanceHistoryRows[0],
    balanceHistoryMap
  );

  const transformedRows = balanceHistoryRows.slice(1).map((row: string[]) => {
    // Map all key/value pairs using the maps created
    const balanceHistory: BalanceHistory = {} as BalanceHistory;
    const transformedRow = indexToKeyMap.reduce((map, val, idx) => {
      (map as any)[val] = row[idx] || null;
      return map;
    }, balanceHistory);
    // Transform any unique data types that aren't strings
    transformedRow["balance"] =
      parseFloat(row[keyToIndexMap["balance"]].replace(/[\$,]/g, "")) *
      (transformedRow["equityType"] === "Liability" ? -1 : 1);
    transformedRow["date"] = new Date(row[keyToIndexMap["date"]]);
    transformedRow["dateAdded"] = transformedRow["dateAdded"] ? new Date(row[keyToIndexMap["dateAdded"]]) : null;
    transformedRow["month"] = new Date(row[keyToIndexMap["month"]]);
    transformedRow["week"] = new Date(row[keyToIndexMap["week"]]);
    return transformedRow;
  });
  return transformedRows;
}

export function transformTransactionData(transactionRows: string[][]): Transaction[] {
  // Get pre-assigned mapped values, or camelCase values to use as keys for JSON structure data transformation
  const { keyToIndexMap, indexToKeyMap } = getMapsForData<MappedTransaction>(transactionRows[0], transactionMap);

  const transformedRows = transactionRows.slice(1).map((row: string[]) => {
    // Map all key/value pairs using the maps created
    const account: Transaction = {} as Transaction;
    const transformedRow = indexToKeyMap.reduce((map, val, idx) => {
      (map as any)[val] = row[idx] || null;
      return map;
    }, account);
    // Transform any unique data types that aren't strings
    transformedRow["amount"] = parseFloat(row[keyToIndexMap["amount"]].replace(/[\$,]/g, ""));
    transformedRow["categorizedDate"] = new Date(row[keyToIndexMap["categorizedDate"]]);
    transformedRow["date"] = new Date(row[keyToIndexMap["date"]]);
    transformedRow["dateAdded"] = new Date(row[keyToIndexMap["dateAdded"]]);
    transformedRow["month"] = new Date(row[keyToIndexMap["month"]]);
    transformedRow["week"] = new Date(row[keyToIndexMap["week"]]);
    transformedRow["metadata"] = transformedRow["metadata"] ? JSON.parse(row[keyToIndexMap["metadata"]]) : null;
    return transformedRow;
  });
  return transformedRows;
}
