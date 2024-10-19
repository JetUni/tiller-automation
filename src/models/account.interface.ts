export interface Account {
  account: string;
  accountNumber: string | null;
  classBH: string;
  closed: Date;
  equityType: "Asset" | "Liability";
  group: string;
  hide: "Hide" | null;
  id: string;
  institution: string | null;
  lastBalance: number;
  lastUpdate: Date;
  opened: Date;
  type: string;
  uniqueIdentifier: string;
}

export type MappedAccount = {
  [P in keyof Account]: string;
};
