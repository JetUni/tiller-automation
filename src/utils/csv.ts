import { mkdirSync, writeFileSync } from "fs";
import { BalanceHistory } from "../models/balance-history.interface";

export function saveBalanceHistoryCsv(balanceHistory: BalanceHistory[], filename: string, isSummary = false) {
  const headers = isSummary
    ? "Date,Account,Balance,Institution"
    : "Date,Time,Account,Account #,Account ID,Balance ID,Institution,Balance,Month,Week,Type,Class,Account Status,Date Added";
  const now = new Date().toLocaleDateString();

  const rows = balanceHistory.map((history) => {
    const {
      account,
      accountId,
      accountNumber,
      accountStatus,
      balance,
      balanceId,
      date,
      equityType,
      institution,
      time,
      type,
    } = history;
    const weekDateTime = new Date(`${date.toLocaleDateString()} 00:00:00 AM`);
    weekDateTime.setDate(weekDateTime.getDate() - weekDateTime.getDay());
    const monthDateTime = new Date(`${date.toLocaleDateString()} 00:00:00 AM`);
    monthDateTime.setDate(1);

    return isSummary
      ? `${date.toLocaleDateString()},${account},${(balance / 100).toFixed(2)},${institution}`
      : `${date.toLocaleDateString()},${time},${account},${accountNumber},${accountId},${balanceId},${institution},${(
          balance / 100
        ).toFixed(
          2
        )},${monthDateTime.toLocaleDateString()},${weekDateTime.toLocaleDateString()},${type},${equityType},${accountStatus},${now}`;
  });

  mkdirSync("./data/output", { recursive: true });
  writeFileSync(`./data/output/${filename}`, [headers, ...rows].join("\n"), { encoding: "utf-8" });
}
