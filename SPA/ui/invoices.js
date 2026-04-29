import { fmt, fmtDate, emptyRow, badge } from "./common.js";

export async function renderInvoices() {
  const invoices = await FB.getAll("invoices", "createdAt");
  return `
    <div class="filter-row">
      <input style="max-width:220px" type="text" id="inv-search" placeholder="Search…" oninput="UI.filterTable('inv-search','inv-tbody',0)"/>
      <select onchange="UI.reloadPage()">
        <option value="">All Statuses</option>
        <option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option>
      </select>
      <button class="btn btn-primary" onclick="APP.showAddInvoice()">+ New Invoice</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Invoice #</th><th>Client</th><th>Project</th><th>Amount</th><th>Due Date</th><th>Status</th><th></th>
        </tr></thead>
        <tbody id="inv-tbody">
          ${invoices.length ? invoices.map(i => `
            <tr>
              <td><strong style="font-family:var(--font-mono)">${i.number || "—"}</strong></td>
              <td>${i.clientName || "—"}</td>
              <td>${i.projectTitle || "—"}</td>
              <td style="font-family:var(--font-mono)">${fmt(i.total)}</td>
              <td style="font-family:var(--font-mono);font-size:12px">${i.dueDate || "—"}</td>
              <td>${badge(i.status || "Draft")}</td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="APP.openInvoiceDetail('${i.id}')">View</button>
                <button class="btn btn-ghost btn-sm" onclick="APP.showEditInvoice('${i.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="APP.deleteInvoice('${i.id}')">Del</button>
              </td>
            </tr>`).join("") : emptyRow(7)}
        </tbody>
      </table>
    </div>`;
}

export async function renderInvoiceDetail(id) {
  const inv = await FB.getOne("invoices", id);
  if (!inv) return "<p>Invoice not found.</p>";
  const items = inv.items || [];
  return `
    <div class="invoice-preview">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
        <div>
          <h2>INVOICE</h2>
          <div style="font-family:var(--font-mono);color:var(--muted)">${inv.number || "—"}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:18px;font-weight:700">${badge(inv.status||"Draft")}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px">Due: ${inv.dueDate||"—"}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px">
        <div><div style="font-size:11px;color:var(--muted);font-weight:700;margin-bottom:4px">BILL TO</div>
          <div style="font-size:14px;font-weight:600">${inv.clientName||"—"}</div></div>
        <div><div style="font-size:11px;color:var(--muted);font-weight:700;margin-bottom:4px">PROJECT</div>
          <div style="font-size:14px;font-weight:600">${inv.projectTitle||"—"}</div></div>
      </div>
      <div class="line-items-table table-wrap" style="margin-bottom:20px">
        <table>
          <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>
            ${items.map(i => `<tr>
              <td>${i.desc||"—"}</td>
              <td style="font-family:var(--font-mono)">${i.qty||1}</td>
              <td style="font-family:var(--font-mono)">${fmt(i.rate)}</td>
              <td style="font-family:var(--font-mono)">${fmt((i.qty||1)*(i.rate||0))}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div style="text-align:right">
        ${inv.tax ? `<div style="color:var(--muted);margin-bottom:6px">Tax (${inv.tax}%): ${fmt(inv.subtotal*(inv.tax/100))}</div>` : ""}
        ${inv.discount ? `<div style="color:var(--muted);margin-bottom:6px">Discount: -${fmt(inv.discount)}</div>` : ""}
        <div style="font-size:22px;font-weight:800;font-family:var(--font-mono);color:var(--accent)">Total: ${fmt(inv.total)}</div>
      </div>
      ${inv.notes ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);font-size:13px;color:var(--muted)">${inv.notes}</div>` : ""}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-ghost" onclick="window.print()">🖨 Print</button>
      <button class="btn btn-ghost" onclick="APP.showEditInvoice('${id}')">Edit</button>
      <button class="btn btn-primary" onclick="APP.markInvoicePaid('${id}')">Mark Paid</button>
    </div>`;
}
