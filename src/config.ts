import configJson from "../config.json";

export interface Config {
  accounts: Record<
    string,
    {
      type: "debit" | "credit";
      files: string[];
    }
  >;
  groups: Record<
    string,
    Record<
      string,
      {
        icon: string;
        income?: true;
      }
    >
  >;
}

const config: Config = configJson as any;

export default config;
