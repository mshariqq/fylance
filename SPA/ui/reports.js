import { fmt, badge, emptyRow } from "./common.js";

export async function renderReports() {
  const [txns, invoices] = await Promise.all([
    FB.getAll("transactions", "date"),
    FB.getAll("invoices", "createdAt"),
  ]);
  let income = 0, expense = 0;
  txns.forEach(t => {
    if (t.type === "Income")  income  += Number(t.amount) || 0;
    if (t.type === "Expense") expense += Number(t.amount) || 0;
  });
  const pending  = invoices.filter(i => i.status === "Sent").reduce((s, i) => s + (Number(i.total)||0), 0);
  const overdue  = invoices.filter(i => i.status === "Overdue").reduce((s, i) => s + (Number(i.total)||0), 0);
  const paid     = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + (Number(i.total)||0), 0);

  // CSV export
  function exportCSV() {
    const rows = [["Date","Type","Amount","Method","Project","Notes"]];
    txns.forEach(t => rows.push([t.date||"",t.type||"",t.amount||0,t.method||"",t.projectTitle||"",t.notes||""]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "transactions.csv"; a.click();
  }
  window._exportCSV = exportCSV;

  return `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Total Earned</div><div class="stat-value green">${fmt(income)}</div></div>
      <div class="stat-card"><div class="stat-label">Total Expenses</div><div class="stat-value red">${fmt(expense)}</div></div>
      <div class="stat-card"><div class="stat-label">Net Income</div><div class="stat-value yellow">${fmt(income - expense)}</div></div>
      <div class="stat-card"><div class="stat-label">Invoiced (Paid)</div><div class="stat-value blue">${fmt(paid)}</div></div>
      <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value yellow">${fmt(pending)}</div></div>
      <div class="stat-card"><div class="stat-label">Overdue</div><div class="stat-value red">${fmt(overdue)}</div></div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div class="section-title">Transaction Breakdown</div>
      <button class="btn btn-ghost btn-sm" onclick="window._exportCSV()">⬇ Export CSV</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Method</th><th>Project</th><th>Notes</th></tr></thead>
        <tbody>
          ${txns.length ? txns.map(t => `
            <tr>
              <td style="font-family:var(--font-mono);font-size:12px">${t.date||"—"}</td>
              <td>${badge(t.type)}</td>
              <td style="font-family:var(--font-mono)">${fmt(t.amount)}</td>
              <td>${t.method||"—"}</td>
              <td>${t.projectTitle||"—"}</td>
              <td style="color:var(--muted);font-size:12px">${t.notes||"—"}</td>
            </tr>`).join("") : emptyRow(6)}
        </tbody>
      </table>
    </div>`;
}
