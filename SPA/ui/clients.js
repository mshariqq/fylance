import { fmt, fmtDate, emptyRow, openPane, badge } from "./common.js";

export async function renderClients() {
  const clients = await FB.getAll("clients", "createdAt");
  return `
    <div class="search-bar">
      <input id="client-search" type="text" placeholder="Search clients…" oninput="UI.filterTable('client-search','clients-tbody',0)"/>
      <button class="btn btn-primary" onclick="APP.showAddClient()">+ Add Client</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Added</th><th></th>
        </tr></thead>
        <tbody id="clients-tbody">
          ${clients.length ? clients.map(c => `
            <tr>
              <td><strong>${c.name}</strong></td>
              <td>${c.company || "—"}</td>
              <td>${c.email || "—"}</td>
              <td>${c.phone || "—"}</td>
              <td style="font-family:var(--font-mono);font-size:12px">${fmtDate(c.createdAt)}</td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="APP.openClientPane('${c.id}')">View</button>
                <button class="btn btn-ghost btn-sm" onclick="APP.showEditClient('${c.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="APP.deleteClient('${c.id}')">Del</button>
              </td>
            </tr>`).join("") : emptyRow(6)}
        </tbody>
      </table>
    </div>`;
}

export async function renderClientPane(id) {
  const c = await FB.getOne("clients", id);
  if (!c) return;
  const [projects, invoices, txns] = await Promise.all([
    FB.getAll("projects","createdAt"), FB.getAll("invoices","createdAt"), FB.getAll("transactions","date")
  ]);
  const cp = projects.filter(p => p.clientId === id);
  const ci = invoices.filter(i => i.clientId === id);
  const ct = txns.filter(t => t.clientId === id);

  const html = `
    <div class="pane-left" style="border-right:none;width:100%;max-width:100%">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="pane-field"><label>Name</label><div class="value">${c.name}</div></div>
        <div class="pane-field"><label>Company</label><div class="value">${c.company||"—"}</div></div>
        <div class="pane-field"><label>Email</label><div class="value">${c.email||"—"}</div></div>
        <div class="pane-field"><label>Phone</label><div class="value">${c.phone||"—"}</div></div>
      </div>
      ${c.notes ? `<div class="pane-field"><label>Notes</label><div class="value" style="color:var(--muted);font-size:12px">${c.notes}</div></div>` : ""}
      <div class="section-title" style="margin-top:16px">Projects (${cp.length})</div>
      <table style="width:100%;margin-bottom:20px"><thead><tr><th>Title</th><th>Status</th><th>Deadline</th></tr></thead>
        <tbody>${cp.map(p=>`<tr><td>${p.title||"—"}</td><td>${badge(p.status)}</td><td style="font-family:var(--font-mono);font-size:11px">${p.deadline||"—"}</td></tr>`).join("")||`<tr><td colspan="3" style="color:var(--muted);font-size:12px;padding:8px">None</td></tr>`}</tbody></table>
      <div class="section-title">Invoices (${ci.length})</div>
      <table style="width:100%;margin-bottom:20px"><thead><tr><th>Invoice #</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>${ci.map(i=>`<tr><td style="font-family:var(--font-mono);font-size:12px">${i.number||"—"}</td><td style="font-family:var(--font-mono)">${fmt(i.total)}</td><td>${badge(i.status)}</td></tr>`).join("")||`<tr><td colspan="3" style="color:var(--muted);font-size:12px;padding:8px">None</td></tr>`}</tbody></table>
      <div class="section-title">Transactions (${ct.length})</div>
      <table style="width:100%"><thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
        <tbody>${ct.map(t=>`<tr><td style="font-family:var(--font-mono);font-size:11px">${t.date||"—"}</td><td>${badge(t.type)}</td><td style="font-family:var(--font-mono)">${fmt(t.amount)}</td></tr>`).join("")||`<tr><td colspan="3" style="color:var(--muted);font-size:12px;padding:8px">None</td></tr>`}</tbody></table>
    </div>`;

  openPane(c.name, html);
}
