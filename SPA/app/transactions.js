// ─────────────────────────────────────────────────────────────
//  app/transactions.js  —  Transaction Management
// ─────────────────────────────────────────────────────────────
import { clientOptions } from "./clients.js";
import { projectOptions } from "./projects.js";

export async function showAddTransaction() {
  const [cOpts, pOpts] = await Promise.all([clientOptions(), projectOptions()]);
  UI.openModal("Add Transaction", `
    <div class="form-row">
      <div class="form-group"><label>Type</label>
        <select id="txn-type"><option>Income</option><option>Expense</option></select></div>
      <div class="form-group"><label>Amount (₹) *</label><input id="txn-amount" type="number" min="0" placeholder="5000"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Date *</label><input id="txn-date" type="date" value="${UI.today()}"/></div>
      <div class="form-group"><label>Method</label>
        <select id="txn-method"><option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>Other</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Client</label>
        <select id="txn-client"><option value="">— None —</option>${cOpts}</select></div>
      <div class="form-group"><label>Project</label>
        <select id="txn-project"><option value="">— None —</option>${pOpts}</select></div>
    </div>
    <div class="form-group"><label>Notes</label><textarea id="txn-notes" placeholder="Payment for…"></textarea></div>
  `, `
    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="APP.saveTransaction()">Save</button>
  `);
}

export async function showEditTransaction(id) {
  const t = await FB.getOne("transactions", id);
  if (!t) return;
  const [cOpts, pOpts] = await Promise.all([clientOptions(t.clientId), projectOptions(t.projectId)]);
  UI.openModal("Edit Transaction", `
    <input type="hidden" id="txn-edit-id" value="${id}"/>
    <div class="form-row">
      <div class="form-group"><label>Type</label>
        <select id="txn-type">${["Income","Expense"].map(s=>`<option ${t.type===s?"selected":""}>${s}</option>`).join("")}</select></div>
      <div class="form-group"><label>Amount (₹) *</label><input id="txn-amount" type="number" value="${t.amount||""}"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Date *</label><input id="txn-date" type="date" value="${t.date||""}"/></div>
      <div class="form-group"><label>Method</label>
        <select id="txn-method">${["Bank Transfer","UPI","Cash","Cheque","Other"].map(s=>`<option ${t.method===s?"selected":""}>${s}</option>`).join("")}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Client</label><select id="txn-client"><option value="">— None —</option>${cOpts}</select></div>
      <div class="form-group"><label>Project</label><select id="txn-project"><option value="">— None —</option>${pOpts}</select></div>
    </div>
    <div class="form-group"><label>Notes</label><textarea id="txn-notes">${t.notes||""}</textarea></div>
  `, `
    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="APP.saveTransaction()">Update</button>
  `);
}

export async function saveTransaction() {
  const id     = document.getElementById("txn-edit-id")?.value;
  const amount = parseFloat(document.getElementById("txn-amount").value);
  const date   = document.getElementById("txn-date").value;
  if (!amount || !date) { UI.toast("Amount and date are required.", "error"); return; }

  const clientSel  = document.getElementById("txn-client");
  const projectSel = document.getElementById("txn-project");
  const clientId   = clientSel.value;
  const projectId  = projectSel.value;

  const data = {
    type:         document.getElementById("txn-type").value,
    amount,
    date,
    method:       document.getElementById("txn-method").value,
    clientId,
    clientName:   clientId  ? clientSel.options[clientSel.selectedIndex].text  : "",
    projectId,
    projectTitle: projectId ? projectSel.options[projectSel.selectedIndex].text : "",
    notes:        document.getElementById("txn-notes").value.trim(),
  };
  try {
    if (id) await FB.updateItem("transactions", id, data);
    else    await FB.addItem("transactions", data);
    UI.closeModal();
    UI.toast(id ? "Transaction updated!" : "Transaction added!");
    APP.reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

export async function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  await FB.deleteItem("transactions", id);
  UI.toast("Transaction deleted."); APP.reloadPage();
}
