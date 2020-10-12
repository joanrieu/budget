import { filter, groupBy, sumBy } from "lodash";
import { makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import ReactDOM from "react-dom";
import transactions from "../transactions.json";
import config, { Category } from "./config";

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
  constructor() {
    makeAutoObservable(this);
  }

  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;

  get datePrefix() {
    return this.year + "-" + this.month.toString().padStart(2, "0") + "-";
  }
}

const ui = new UI();

const App = observer(() => (
  <div>
    <Title />
    <Calendar />
    <CategoryList />
    <TransactionList />
  </div>
));

const Title = observer(() => (
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
));

const Section = observer(
  ({ name, children }: { name: string; children: React.ReactNode }) => (
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
  )
);

const Subsection = observer(
  ({ name, children }: { name: string; children: React.ReactNode }) => (
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
  )
);

const Calendar = observer(() => (
  <Section name="Calendar">
    <form
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 96px 64px 1fr",
        gap: "16px",
      }}
      onSubmit={(event) => event.preventDefault()}
    >
      <input
        type="number"
        name="year"
        defaultValue={ui.year}
        onChange={(event) =>
          runInAction(() => (ui.year = Number(event.target.value)))
        }
        style={{ fontSize: "150%", gridColumn: "2" }}
      />
      <input
        type="number"
        name="month"
        min={1}
        max={12}
        defaultValue={ui.month}
        onChange={(event) =>
          runInAction(() => (ui.month = Number(event.target.value)))
        }
        style={{ fontSize: "150%", gridColumn: "3" }}
      />
    </form>
  </Section>
));

const CategoryList = observer(() => (
  <Section name="Categories">
    {Object.entries(config.groups).map(
      ([name, group]) =>
        !isGroupExcluded(name) && (
          <Subsection key={name} name={name}>
            {Object.entries(group).map(([name, category]) => (
              <CategoryLine key={name} name={name} category={category} />
            ))}
          </Subsection>
        )
    )}
  </Section>
));

const CategoryLine = observer(
  ({ name, category }: { name: string; category: Category }) => {
    const activity = sumBy(
      filter(
        transactions,
        (transaction) =>
          transaction.Category === name &&
          transaction.Date.startsWith(ui.datePrefix)
      ),
      (transaction) => transaction.Amount
    );
    return (
      <div
        style={{
          borderBottom: "1px solid #bbb",
          marginBottom: "-1px",
        }}
      >
        <div
          style={{
            padding: "16px 32px",
            display: "grid",
            gridTemplateColumns: "16px 1fr auto",
            gap: "16px",
            lineHeight: "1",
            opacity: activity ? undefined : "0.3",
          }}
        >
          <div style={{ placeSelf: "center" }}>{getCategoryIcon(name)}</div>
          <div style={{ placeSelf: "center start" }}>{name}</div>
          <div style={{ placeSelf: "center end" }}>
            {new Intl.NumberFormat(navigator.language, {
              style: "currency",
              currency: "CAD",
              signDisplay: "exceptZero",
            } as Intl.NumberFormatOptions).format(activity)}
          </div>
        </div>
      </div>
    );
  }
);

const TransactionList = observer(() => {
  const byDate = groupBy(
    filter(transactions, (transaction) =>
      transaction.Date.startsWith(ui.datePrefix)
    ),
    "Date"
  );
  const dates = Object.keys(byDate).sort().reverse();
  const intl = new Intl.DateTimeFormat(navigator.language, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
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
});

const TransactionLine = observer(
  ({ transaction }: { transaction: Transaction }) => (
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
  )
);

ReactDOM.render(<App />, document.getElementById("root"));
