import configJson from "../config.json";

export interface Config {
  accounts: Record<string, Account>;
  budget: Budget;
}

export type Account = {
  type: "debit" | "credit";
  currency: string;
  files: string[];
};

export type Budget = {
  currency: string;
  groups: Record<string, Record<string, Category>>;
};

export type Category = {
  icon: string;
  income?: true;
};

const config: Config = configJson as any;

export default config;
