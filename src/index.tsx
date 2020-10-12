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
    <div>
      <Menu />
      <Filters />
    </div>
    <div
      style={{
        border: "1px solid #bbb",
        borderWidth: "0 1px",
        background: "#eee",
        display: "grid",
        overflow: "hidden",
      }}
    >
      {ui.page === "budget" && <CategoryList />}
      {ui.page === "transactions" && <TransactionList />}
    </div>
  </div>
));

const SidebarItem = observer(
  ({
    style,
    children,
  }: {
    style?: CSSProperties;
    children: React.ReactNode;
  }) => (
    <div
      style={{
        border: "1px solid #bbb",
        background: "#eee",
        margin: "32px",
        marginLeft: "0",
        ...style,
      }}
    >
      {children}
    </div>
  )
);

const Title = observer(() => (
  <h1
    style={{
      textAlign: "center",
      color: "firebrick",
      fontWeight: "bold",
      fontSize: "200%",
      letterSpacing: ".2ch",
      fontVariant: "small-caps",
      padding: "16px 32px",
    }}
  >
    Budget
  </h1>
));

const SectionHeader = observer(
  ({ children }: { children: React.ReactNode }) => (
    <h2
      style={{
        fontSize: "130%",
        letterSpacing: ".2ch",
        padding: "32px 32px 16px",
        borderBottom: "4px solid firebrick",
      }}
    >
      {children}
    </h2>
  )
);

const SubsectionHeader = observer(
  ({ children }: { children: React.ReactNode }) => (
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
      {children}
    </h3>
  )
);

const Amount = observer(
  ({ amount, currency }: { amount: number; currency: string }) => (
    <div
      style={{
        opacity: amount ? undefined : "0.3",
      }}
    >
      {new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        signDisplay: "exceptZero",
      } as Intl.NumberFormatOptions).format(amount)}
    </div>
  )
);

const Filters = observer(() => (
  <SidebarItem
    style={{
      padding: "32px",
    }}
  >
    <strong
      style={{
        display: "block",
        marginBottom: "16px",
        fontWeight: "bold",
      }}
    >
      Filters
    </strong>
    <form
      style={{
        display: "grid",
        gridTemplateColumns: "80px 64px",
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
      />
    </form>
  </SidebarItem>
));

const Menu = observer(() => (
  <SidebarItem>
    <Title />
    <MenuItem page="budget">Budget</MenuItem>
    <MenuItem page="transactions">Transactions</MenuItem>
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
      className={ui.page === page ? "active" : undefined}
      style={{
        display: "block",
        lineHeight: 3,
        padding: "0 32px",
        ...(ui.page === page
          ? {
              borderRight: "4px solid firebrick",
            }
          : {}),
      }}
    >
      {children}
    </a>
  )
);

const CategoryList = observer(() => (
  <div
    style={{
      display: "grid",
      gridTemplateRows: "auto 1fr",
      overflow: "hidden",
    }}
  >
    <SectionHeader>
      Budget for{" "}
      {new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
      }).format(new Date(ui.datePrefix + 1))}
    </SectionHeader>
    <div
      style={{
        overflow: "auto",
      }}
    >
      {Object.entries(config.budget.groups).map(
        ([name, group]) =>
          !isGroupExcluded(name) && (
            <div key={name}>
              <SubsectionHeader>{name}</SubsectionHeader>
              {Object.entries(group).map(([name, category]) => (
                <CategoryLine key={name} name={name} category={category} />
              ))}
            </div>
          )
      )}
    </div>
  </div>
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
  const intl = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        overflow: "hidden",
      }}
    >
      <SectionHeader>
        Transactions from{" "}
        {new Intl.DateTimeFormat(undefined, {
          month: "long",
          year: "numeric",
        }).format(new Date(ui.datePrefix + 1))}
      </SectionHeader>
      <div
        style={{
          overflow: "auto",
        }}
      >
        {dates.map((date) => (
          <div key={date}>
            <SubsectionHeader>
              {intl.format(new Date(date).getTime())}
            </SubsectionHeader>
            {byDate[date].map((transaction, i) => (
              <TransactionLine key={i} transaction={transaction} />
            ))}
          </div>
        ))}
      </div>
    </div>
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
