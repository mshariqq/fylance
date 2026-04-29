import { fmt, badge, emptyRow } from "./common.js";

export async function renderTransactions() {
  const txns = await FB.getAll("transactions", "date");
  let total = { income: 0, expense: 0 };
  txns.forEach(t => {
    if (t.type === "Income") total.income += Number(t.amount) || 0;
    if (t.type === "Expense") total.expense += Number(t.amount) || 0;
  });
  return `
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card"><div class="stat-label">Total Income</div><div class="stat-value green">${fmt(total.income)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Expenses</div><div class="stat-value red">${fmt(total.expense)}</div></div>
      <div class="stat-card"><div class="stat-label">Net</div><div class="stat-value yellow">${fmt(total.income - total.expense)}</div></div>
    </div>
    <div class="filter-row">
      <input style="max-width:220px" type="text" id="txn-search" placeholder="Search…" oninput="UI.filterTable('txn-search','txn-tbody',0)"/>
      <select onchange="UI.reloadPage()">
        <option value="">All Types</option><option>Income</option><option>Expense</option>
      </select>
      <button class="btn btn-primary" onclick="APP.showAddTransaction()">+ Add Transaction</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Date</th><th>Type</th><th>Amount</th><th>Method</th><th>Project</th><th>Notes</th><th></th>
        </tr></thead>
        <tbody id="txn-tbody">
          ${txns.length ? txns.map(t => `
            <tr>
              <td style="font-family:var(--font-mono);font-size:12px">${t.date || "—"}</td>
              <td>${badge(t.type)}</td>
              <td style="font-family:var(--font-mono)">${fmt(t.amount)}</td>
              <td>${t.method || "—"}</td>
              <td>${t.projectTitle || "—"}</td>
              <td style="color:var(--muted);font-size:12px">${t.notes || "—"}</td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="APP.showEditTransaction('${t.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="APP.deleteTransaction('${t.id}')">Del</button>
              </td>
            </tr>`).join("") : emptyRow(7)}
        </tbody>
      </table>
    </div>`;
}
