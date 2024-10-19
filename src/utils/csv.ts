import { mkdirSync, writeFileSync } from "fs";
import { BalanceHistory } from "../models/balance-history.interface";

export function saveBalanceHistoryCsv(balanceHistory: BalanceHistory[], filename: string) {
  const headers = "Date,Account,Balance,Institution";
  // "Date,Time,Account,Account #,Account ID,Balance ID,Institution,Balance,Month,Week,Type,Class,Account Status,Date Added";
  const now = new Date().toLocaleDateString();

  const rows = balanceHistory.map((history) => {
    const {
      date,
      time,
      account,
      accountNumber,
      accountId,
      balanceId,
      balance,
      equityType,
      institution,
      type,
      accountStatus,
    } = history;
    const weekDateTime = new Date(`${date.toLocaleDateString()} 00:00:00 AM`);
    weekDateTime.setDate(weekDateTime.getDate() - weekDateTime.getDay());
    const monthDateTime = new Date(`${date.toLocaleDateString()} 00:00:00 AM`);
    monthDateTime.setDate(1);

    return `${date.toLocaleDateString()},${time},${account},${accountNumber},${accountId},${balanceId},${institution},${(
      balance / 100
    ).toFixed(
      2
    )},${monthDateTime.toLocaleDateString()},${weekDateTime.toLocaleDateString()},${type},${equityType},${accountStatus},${now}`;
  });

  mkdirSync("./data/output", { recursive: true });
  writeFileSync(`./data/output/${filename}`, [headers, ...rows].join("\n"), { encoding: "utf-8" });
}
