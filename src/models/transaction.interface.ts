export interface Transaction {
  account: string | null;
  accountId: string | null;
  accountNumber: string;
  amount: number;
  categorizedDate: Date;
  category: string | null;
  checkNumber: string | null;
  date: Date;
  dateAdded: Date;
  description: string;
  fullDescription: string | null;
  institution: string;
  labels: string | null;
  metadata: {
    [importedFrom: string]: {
      type: string;
      "Original Description": string;
      "Transaction Type": string;
    };
  } | null;
  month: Date;
  note: string | null;
  transactionId: string | null;
  week: Date;
}

export type MappedTransaction = {
  [P in keyof Transaction]: string;
};
