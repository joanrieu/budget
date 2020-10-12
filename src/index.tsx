import _ from "lodash";
import { observable } from "mobx";
import React from "react";
import ReactDOM from "react-dom";
import transactions from "../transactions.json";
import config from "./config";

type Transaction = typeof transactions[0];

function isGroupExcluded(group: string) {
  return group.startsWith("-");
}

function getParentGroupName(category: string) {
  return Object.entries(config.groups)
    .map(([name, group]) => ({ name, group }))
    .find(({ group }) => category in group)?.name;
}

function getCategoryConfig(category: string) {
  const group = Object.values(config.groups).find((group) => category in group);
  return group?.[category];
}

function getCategoryIcon(category: string) {
  return getCategoryConfig(category)?.icon ?? category.charAt(0);
}

function isCategoryExcluded(category: string) {
  const group = getParentGroupName(category);
  return group && isGroupExcluded(group);
}

function getAccount(account: string) {
  return config.accounts[account as keyof typeof config.accounts] ?? null;
}

class UI {
  @observable month = new Date("2020-09").toISOString().slice(0, 8);
}

const ui = new UI();

const App = () => (
  <div>
    <Title />
    <CategoryList />
    <TransactionList />
  </div>
);

const Title = () => (
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
);

const Section = ({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) => (
  <div>
    <h2
      style={{
        textAlign: "center",
        fontSize: "130%",
        letterSpacing: ".2ch",
        padding: "16px",
      }}
    >
      {name}
    </h2>
    {children}
  </div>
);

const Subsection = ({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) => (
  <div>
    <h3
      style={{
        textAlign: "center",
        textTransform: "uppercase",
        fontSize: "80%",
        letterSpacing: ".2ch",
        color: "grey",
        background: "#ddd",
        border: "1px solid #bbb",
        borderWidth: "1px 0",
        padding: "16px",
      }}
    >
      {name}
    </h3>
    {children}
  </div>
);

const CategoryList = () => (
  <Section name="Categories">
    {Object.entries(config.groups).map(
      ([name, group]) =>
        !isGroupExcluded(name) && (
          <Subsection key={name} name={name}>
            {Object.entries(group).map(([name, category]) => (
              <div
                key={name}
                style={{
                  padding: "16px 32px",
                  borderBottom: "1px solid #bbb",
                  marginBottom: "-1px",
                  display: "grid",
                  gridTemplateColumns: "16px 1fr auto",
                  gap: "16px",
                  lineHeight: "1",
                }}
              >
                <div style={{ placeSelf: "center" }}>
                  {getCategoryIcon(name)}
                </div>
                <div style={{ placeSelf: "center start" }}>{name}</div>
                <div style={{ placeSelf: "center end" }}>
                  {new Intl.NumberFormat(navigator.language, {
                    style: "currency",
                    currency: "CAD",
                    signDisplay: "exceptZero",
                  } as Intl.NumberFormatOptions).format(
                    _.sumBy(
                      _.filter(
                        transactions,
                        (transaction) =>
                          transaction.Category === name &&
                          transaction.Date.startsWith(ui.month)
                      ),
                      (transaction) => transaction.Amount
                    )
                  )}
                </div>
              </div>
            ))}
          </Subsection>
        )
    )}
  </Section>
);

const TransactionList = () => {
  const byDate = _.groupBy(
    transactions.filter((transaction) => getAccount(transaction.Account)),
    "Date"
  );
  const dates = Object.keys(byDate).sort().reverse();
  const intl = new Intl.DateTimeFormat(navigator.language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <Section name="Transactions">
      {dates.map((date) => (
        <Subsection key={date} name={intl.format(new Date(date).getTime())}>
          {byDate[date].map((transaction, i) => (
            <TransactionLine key={i} transaction={transaction} />
          ))}
        </Subsection>
      ))}
    </Section>
  );
};

const TransactionLine = ({ transaction }: { transaction: Transaction }) => (
  <div
    style={{
      display: "grid",
      gridTemplateAreas: '"icon payee amount" "icon category amount"',
      gridTemplateColumns: "auto 1fr auto",
      opacity: isCategoryExcluded(transaction.Category) ? "0.3" : "1",
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
