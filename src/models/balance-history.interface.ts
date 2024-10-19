import { EquityType } from "./tiller.interface";

export interface BalanceHistory {
  account: string;
  accountClass: string;
  accountId: string;
  accountNumber: string | null;
  accountStatus: string | null;
  balance: number;
  balanceId: string | null;
  date: Date;
  dateAdded: Date | null;
  equityType: EquityType;
  institution: string | null;
  month: Date;
  time: string;
  type: string;
  week: Date;
}

export type MappedBalanceHistory = {
  [P in keyof BalanceHistory]: string;
};
