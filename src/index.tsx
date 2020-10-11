import _ from "lodash";
import React from "react";
import ReactDOM from "react-dom";
import config from "../config.json";
import transactions from "../transactions.json";

type Transaction = typeof transactions[0];

function getCategoryIcon(category: string) {
  return category in config.icons
    ? config.icons[category as keyof typeof config.icons]
    : category.charAt(0);
}

function isExcluded(transaction: Transaction) {
  return config.exclude.includes(transaction.Category);
}

const App = () => (
  <div>
    <TransactionList />
  </div>
);

const TransactionList = () => {
  const byDate = _.groupBy(transactions, "Date");
  const dates = Object.keys(byDate).sort().reverse();
  const intl = new Intl.DateTimeFormat(navigator.language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div>
      <h1
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "200%",
          letterSpacing: ".2ch",
          fontVariant: "small-caps",
          paddingTop: "32px",
        }}
      >
        Budget
      </h1>
      <h2
        style={{
          textAlign: "center",
          fontSize: "130%",
          letterSpacing: ".2ch",
          padding: "16px",
        }}
      >
        Transactions
      </h2>
      {dates.map((date) => (
        <div key={date}>
          <h3
            style={{
              textAlign: "center",
              textTransform: "uppercase",
              fontSize: "80%",
              letterSpacing: ".2ch",
              color: "grey",
              border: "1px solid #bbb",
              borderWidth: "1px 0",
              padding: "16px",
            }}
          >
            {intl.format(new Date(date).getTime())}
          </h3>
          {byDate[date].map((transaction, i) => (
            <TransactionLine key={i} transaction={transaction} />
          ))}
        </div>
      ))}
    </div>
  );
};

const TransactionLine = ({ transaction }: { transaction: Transaction }) => (
  <div
    style={{
      display: "grid",
      gridTemplateAreas: '"icon payee amount" "icon category amount"',
      gridTemplateColumns: "auto 1fr auto",
      opacity: isExcluded(transaction) ? "0.3" : "1",
      padding: "16px",
    }}
  >
    <div
      style={{
        gridArea: "icon",
        placeSelf: "center",
        border: "1px solid grey",
        borderRadius: "100%",
        width: "48px",
        height: "48px",
        color: "grey",
        background: "lightgrey",
        fontSize: "150%",
        display: "grid",
      }}
    >
      <div
        style={{
          placeSelf: "center",
          lineHeight: "0",
        }}
      >
        {getCategoryIcon(transaction.Category)}
      </div>
    </div>
    <div
      style={{
        gridArea: "payee",
        placeSelf: "end start",
        margin: "0 16px",
        textTransform: "capitalize",
      }}
    >
      {transaction.Payee.toLowerCase().replace(/[^a-z0-9]/g, " ")}
    </div>
    <div
      style={{
        gridArea: "category",
        placeSelf: "start start",
        fontSize: "80%",
        color: "grey",
        margin: "0 16px",
      }}
    >
      {transaction.Category}
    </div>
    <pre style={{ gridArea: "amount", placeSelf: "center" }}>
      {transaction.Amount.toFixed(2)}
    </pre>
  </div>
);

ReactDOM.render(<App />, document.getElementById("root"));
