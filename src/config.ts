import configJson from "../config.json";

export interface Config {
  accounts: Record<string, Account>;
  groups: Record<string, Record<string, Category>>;
}

export type Account = {
  type: "debit" | "credit";
  files: string[];
};

export type Category = {
  icon: string;
  income?: true;
};

const config: Config = configJson as any;

export default config;
