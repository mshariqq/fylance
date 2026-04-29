// ─────────────────────────────────────────────────────────────
//  app/invoices.js  —  Invoice Management
// ─────────────────────────────────────────────────────────────
import { clientOptions } from "./clients.js";
import { projectOptions } from "./projects.js";

async function invoiceHelperOptions() {
  const [cOpts, pOpts, num] = await Promise.all([clientOptions(), projectOptions(), FB.nextInvoiceNumber()]);
  return { cOpts, pOpts, num };
}

export async function showAddInvoice() {
  const { cOpts, pOpts, num } = await invoiceHelperOptions();
  UI.openModal("New Invoice", `
    <div class="form-row">
      <div class="form-group"><label>Invoice #</label><input id="inv-num" value="${num}" type="text"/></div>
      <div class="form-group"><label>Status</label>
        <select id="inv-status"><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Client</label>
        <select id="inv-client"><option value="">— None —</option>${cOpts}</select></div>
      <div class="form-group"><label>Project</label>
        <select id="inv-project"><option value="">— None —</option>${pOpts}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Due Date</label><input id="inv-due" type="date"/></div>
      <div class="form-group"><label>Tax %</label><input id="inv-tax" type="number" min="0" max="100" value="0" oninput="APP.calcInvoiceTotal()"/></div>
    </div>
    <div class="form-group"><label>Discount (₹)</label><input id="inv-discount" type="number" value="0" min="0" oninput="APP.calcInvoiceTotal()"/></div>
    <div style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:12px;font-weight:700;color:var(--muted)">LINE ITEMS</div>
        <button class="btn btn-ghost btn-sm" onclick="APP.addLineItem()">+ Add Item</button>
      </div>
      <div id="line-items">
        <div class="line-item" style="display:grid;grid-template-columns:1fr 60px 80px 20px;gap:6px;margin-bottom:6px">
          <input type="text" placeholder="Description" class="li-desc"/>
          <input type="number" placeholder="Qty" value="1" class="li-qty" oninput="APP.calcInvoiceTotal()"/>
          <input type="number" placeholder="Rate" class="li-rate" oninput="APP.calcInvoiceTotal()"/>
          <button onclick="this.closest('.line-item').remove();APP.calcInvoiceTotal()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">×</button>
        </div>
      </div>
    </div>
    <div style="text-align:right;margin-top:12px;font-size:15px;font-weight:700;font-family:var(--font-mono)">
      Total: <span id="inv-total-display" style="color:var(--accent)">₹0</span>
    </div>
    <div class="form-group" style="margin-top:12px"><label>Notes</label><textarea id="inv-notes" placeholder="Payment terms, thank you note…"></textarea></div>
  `, `
    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="APP.saveInvoice()">Save Invoice</button>
  `);
}

export async function showEditInvoice(id) {
  const inv = await FB.getOne("invoices", id);
  if (!inv) return;
  const [cOpts, pOpts] = await Promise.all([clientOptions(inv.clientId), projectOptions(inv.projectId)]);
  const items = inv.items || [{ desc: "", qty: 1, rate: 0 }];
  UI.openModal("Edit Invoice", `
    <input type="hidden" id="inv-edit-id" value="${id}"/>
    <div class="form-row">
      <div class="form-group"><label>Invoice #</label><input id="inv-num" value="${inv.number||""}" type="text"/></div>
      <div class="form-group"><label>Status</label>
        <select id="inv-status">${["Draft","Sent","Paid","Overdue"].map(s=>`<option ${inv.status===s?"selected":""}>${s}</option>`).join("")}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Client</label>
        <select id="inv-client"><option value="">— None —</option>${cOpts}</select></div>
      <div class="form-group"><label>Project</label>
        <select id="inv-project"><option value="">— None —</option>${pOpts}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Due Date</label><input id="inv-due" type="date" value="${inv.dueDate||""}"/></div>
      <div class="form-group"><label>Tax %</label><input id="inv-tax" type="number" value="${inv.tax||0}" oninput="APP.calcInvoiceTotal()"/></div>
    </div>
    <div class="form-group"><label>Discount (₹)</label><input id="inv-discount" type="number" value="${inv.discount||0}" min="0" oninput="APP.calcInvoiceTotal()"/></div>
    <div style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:12px;font-weight:700;color:var(--muted)">LINE ITEMS</div>
        <button class="btn btn-ghost btn-sm" onclick="APP.addLineItem()">+ Add Item</button>
      </div>
      <div id="line-items">
        ${items.map(i=>`
          <div class="line-item" style="display:grid;grid-template-columns:1fr 60px 80px 20px;gap:6px;margin-bottom:6px">
            <input type="text" placeholder="Description" class="li-desc" value="${i.desc||""}"/>
            <input type="number" placeholder="Qty" value="${i.qty||1}" class="li-qty" oninput="APP.calcInvoiceTotal()"/>
            <input type="number" placeholder="Rate" value="${i.rate||0}" class="li-rate" oninput="APP.calcInvoiceTotal()"/>
            <button onclick="this.closest('.line-item').remove();APP.calcInvoiceTotal()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">×</button>
          </div>`).join("")}
      </div>
    </div>
    <div style="text-align:right;margin-top:12px;font-size:15px;font-weight:700;font-family:var(--font-mono)">
      Total: <span id="inv-total-display" style="color:var(--accent)">${UI.fmt(inv.total)}</span>
    </div>
    <div class="form-group" style="margin-top:12px"><label>Notes</label><textarea id="inv-notes">${inv.notes||""}</textarea></div>
  `, `
    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="APP.saveInvoice()">Update Invoice</button>
  `);
}

export function addLineItem() {
  const wrap = document.getElementById("line-items");
  if (!wrap) return;
  const div = document.createElement("div");
  div.className = "line-item";
  div.style.cssText = "display:grid;grid-template-columns:1fr 60px 80px 20px;gap:6px;margin-bottom:6px";
  div.innerHTML = `
    <input type="text" placeholder="Description" class="li-desc"/>
    <input type="number" placeholder="Qty" value="1" class="li-qty" oninput="APP.calcInvoiceTotal()"/>
    <input type="number" placeholder="Rate" class="li-rate" oninput="APP.calcInvoiceTotal()"/>
    <button onclick="this.closest('.line-item').remove();APP.calcInvoiceTotal()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">×</button>`;
  wrap.appendChild(div);
}

export function calcInvoiceTotal() {
  const items = document.querySelectorAll(".line-item");
  let subtotal = 0;
  items.forEach(item => {
    const qty  = parseFloat(item.querySelector(".li-qty")?.value) || 0;
    const rate = parseFloat(item.querySelector(".li-rate")?.value) || 0;
    subtotal += qty * rate;
  });
  const tax      = parseFloat(document.getElementById("inv-tax")?.value) || 0;
  const discount = parseFloat(document.getElementById("inv-discount")?.value) || 0;
  const total    = subtotal + (subtotal * tax / 100) - discount;
  const el = document.getElementById("inv-total-display");
  if (el) el.textContent = UI.fmt(Math.max(0, total));
}

export async function saveInvoice() {
  const id  = document.getElementById("inv-edit-id")?.value;
  const items = [...document.querySelectorAll(".line-item")].map(item => ({
    desc: item.querySelector(".li-desc")?.value.trim() || "",
    qty:  parseFloat(item.querySelector(".li-qty")?.value) || 1,
    rate: parseFloat(item.querySelector(".li-rate")?.value) || 0,
  }));
  const subtotal  = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const tax       = parseFloat(document.getElementById("inv-tax")?.value) || 0;
  const discount  = parseFloat(document.getElementById("inv-discount")?.value) || 0;
  const total     = Math.max(0, subtotal + (subtotal * tax / 100) - discount);

  const clientSel  = document.getElementById("inv-client");
  const projectSel = document.getElementById("inv-project");
  const clientId   = clientSel.value;
  const projectId  = projectSel.value;
  const clientName = clientId  ? clientSel.options[clientSel.selectedIndex].text  : "";
  const projectTitle = projectId ? projectSel.options[projectSel.selectedIndex].text : "";

  const data = {
    number:       document.getElementById("inv-num").value.trim(),
    status:       document.getElementById("inv-status").value,
    clientId, clientName,
    projectId, projectTitle,
    dueDate:      document.getElementById("inv-due").value,
    tax, discount, subtotal, total,
    items,
    notes:        document.getElementById("inv-notes").value.trim(),
  };
  try {
    if (id) await FB.updateItem("invoices", id, data);
    else    await FB.addItem("invoices", data);
    UI.closeModal();
    UI.toast(id ? "Invoice updated!" : "Invoice created!");
    APP.reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

export async function deleteInvoice(id) {
  if (!confirm("Delete this invoice?")) return;
  await FB.deleteItem("invoices", id);
  UI.toast("Invoice deleted."); APP.reloadPage();
}

export async function openInvoiceDetail(id) {
  const html = await UI.renderInvoiceDetail(id);
  document.getElementById("page-content").innerHTML = html;
  document.getElementById("page-title").textContent = "Invoice Detail";
}

export async function markInvoicePaid(id) {
  await FB.updateItem("invoices", id, { status: "Paid" });
  UI.toast("Marked as Paid!");
  const html = await UI.renderInvoiceDetail(id);
  document.getElementById("page-content").innerHTML = html;
}
