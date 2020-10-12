import csv from "csvtojson";
import { writeFileSync } from "fs";
import config from "../config.json";

Promise.all(
  Object.entries(config.accounts).flatMap(([name, account]) =>
    account.files.map((path) =>
      csv({
        delimiter: "auto",
        colParser: {
          Amount: account.type === "credit" ? (x) => -x : Number,
        },
      })
        .fromFile(path)
        .then((file) => file.map((row) => ({ Account: name, ...row })))
    )
  )
)
  .then(([file, ...files]) => file.concat(...files))
  .then((file) =>
    writeFileSync("transactions.json", JSON.stringify(file, null, 2))
  );
