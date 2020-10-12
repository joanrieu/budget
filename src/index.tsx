import { filter, groupBy, sumBy } from "lodash";
import { makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react";
import React, { CSSProperties } from "react";
import ReactDOM from "react-dom";
import transactions from "../transactions.json";
import config, { Category } from "./config";

type Transaction = typeof transactions[0];

function isGroupExcluded(group: string) {
  return group.startsWith("-");
}

function getParentGroupName(category: string) {
  return Object.entries(config.budget.groups)
    .map(([name, group]) => ({ name, group }))
    .find(({ group }) => category in group)?.name;
}

function getCategoryConfig(category: string) {
  const group = Object.values(config.budget.groups).find(
    (group) => category in group
  );
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

  page: "budget" | "transactions" = "budget";

  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;

  get datePrefix() {
    return this.year + "-" + this.month.toString().padStart(2, "0") + "-";
  }
}

const ui = new UI();

const App = observer(() => (
  <div
    style={{
      margin: "auto",
      maxWidth: "120ch",
      display: "grid",
      gridTemplateColumns: "1fr 3fr",
    }}
  >
    <div style={{ overflow: "auto" }}>
      <Title />
      <Calendar />
      <Menu />
    </div>
    <div
      style={{
        border: "1px solid #bbb",
        borderWidth: "0 1px",
        height: "100%",
        overflow: "auto",
        background: "#eee",
      }}
    >
      {ui.page === "budget" && <CategoryList />}
      {ui.page === "transactions" && <TransactionList />}
    </div>
  </div>
));

const SidebarItem = observer(({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      border: "1px solid #bbb",
      background: "#eee",
      margin: "32px",
      marginLeft: "0",
    }}
  >
    {children}
  </div>
));

const Title = observer(() => (
  <SidebarItem>
    <h1
      style={{
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "200%",
        letterSpacing: ".2ch",
        fontVariant: "small-caps",
        padding: "32px",
      }}
    >
      Budget
    </h1>
  </SidebarItem>
));

const Section = observer(
  ({
    name,
    children,
    style,
  }: {
    name: string;
    children: React.ReactNode;
    style?: CSSProperties;
  }) => (
    <div
      style={{
        paddingBottom: "32px",
        ...style,
      }}
    >
      <h2
        style={{
          fontSize: "130%",
          letterSpacing: ".2ch",
          padding: "32px",
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
          textTransform: "uppercase",
          fontSize: "80%",
          letterSpacing: ".2ch",
          color: "grey",
          background: "#ddd",
          border: "1px solid #bbb",
          borderWidth: "1px 0",
          padding: "16px 32px",
        }}
      >
        {name}
      </h3>
      {children}
    </div>
  )
);

const Amount = observer(
  ({ amount, currency }: { amount: number; currency: string }) => (
    <div
      style={{
        opacity: amount ? undefined : "0.3",
      }}
    >
      {new Intl.NumberFormat(navigator.language, {
        style: "currency",
        currency,
        signDisplay: "exceptZero",
      } as Intl.NumberFormatOptions).format(amount)}
    </div>
  )
);

const Calendar = observer(() => (
  <SidebarItem>
    <Section name="Calendar">
      <form
        style={{
          display: "grid",
          gridTemplateColumns: "80px 64px",
          padding: "0 32px",
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
          style={{ font: "inherit", padding: "8px" }}
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
          style={{ font: "inherit", padding: "8px" }}
        />
      </form>
    </Section>
  </SidebarItem>
));

const Menu = observer(() => (
  <SidebarItem>
    <Section name="Menu">
      <MenuItem page="budget">Budget</MenuItem>
      <MenuItem page="transactions">Transactions</MenuItem>
    </Section>
  </SidebarItem>
));

const MenuItem = observer(
  ({ page, children }: { page: typeof ui.page; children: React.ReactNode }) => (
    <a
      href="#"
      onClick={(event) => {
        event.preventDefault();
        runInAction(() => {
          ui.page = page;
        });
      }}
      style={{
        display: "block",
        font: "inherit",
        color: "inherit",
        textDecoration: "inherit",
        padding: "16px 32px",
        background: ui.page === page ? "#ccc" : "#ddd",
        fontWeight: ui.page === page ? "bold" : undefined,
      }}
    >
      {children}
    </a>
  )
);

const CategoryList = observer(() => (
  <Section name="Categories">
    {Object.entries(config.budget.groups).map(
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
          padding: "16px 32px",
          display: "grid",
          gridTemplateColumns: "16px 1fr auto",
          gap: "16px",
          lineHeight: "1",
        }}
      >
        <div style={{ placeSelf: "center" }}>{getCategoryIcon(name)}</div>
        <div style={{ placeSelf: "center start" }}>{name}</div>
        <div
          style={{
            placeSelf: "center end",
          }}
        >
          <Amount amount={activity} currency={config.budget.currency} />
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
      <div style={{ gridArea: "amount", placeSelf: "center" }}>
        <Amount
          amount={transaction.Amount}
          currency={getAccount(transaction.Account).currency}
        />
      </div>
    </div>
  )
);

ReactDOM.render(<App />, document.getElementById("root"));
