import csv from "csvtojson";
import { writeFileSync } from "fs";
import config from "../config.json";

Promise.all(
  [...config.transactions.savings, ...config.transactions.credit].map((path) =>
    csv({
      delimiter: "auto",
      colParser: {
        Amount: (x) => (config.transactions.credit.includes(path) ? -x : +x),
      },
    }).fromFile(path)
  )
)
  .then(([file, ...files]) => file.concat(...files))
  .then((file) =>
    writeFileSync("transactions.json", JSON.stringify(file, null, 2))
  );
