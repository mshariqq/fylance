// ─────────────────────────────────────────────────────────────
//  ui/common.js  —  Shared UI helpers & components
// ─────────────────────────────────────────────────────────────

export function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function today() { return new Date().toISOString().slice(0, 10); }

export function badge(status) {
  const map = {
    "Lead": "gray", "In Progress": "blue", "Review": "yellow", "Done": "green",
    "Draft": "gray", "Sent": "blue", "Paid": "green", "Overdue": "red",
    "Income": "green", "Expense": "red",
    "owner": "yellow", "member": "gray",
    "Script Sale": "purple", "Custom Project": "blue", "Retainer": "green", "Digital Heroes Job": "orange", "Other": "gray",
    "Verified": "green", "Blocked": "red", "Admin": "yellow", "User": "gray",
  };
  const cls = map[status] || "gray";
  return `<span class="badge badge-${cls}">${status}</span>`;
}

export function emptyRow(cols, msg = "Nothing here yet.") {
  return `<tr class="empty-row"><td colspan="${cols}">${msg}</td></tr>`;
}

export function toast(msg, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = "", 3000);
}

export function openModal(title, bodyHTML, footerHTML) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = bodyHTML;
  document.getElementById("modal-footer").innerHTML = footerHTML;
  document.getElementById("modal-overlay").classList.add("open");
}

export function closeModal(e) {
  if (e && e.target !== document.getElementById("modal-overlay")) return;
  document.getElementById("modal-overlay").classList.remove("open");
}

export function openPane(title, bodyHTML) {
  document.getElementById("pane-title").textContent = title;
  document.getElementById("pane-body").innerHTML = bodyHTML;
  document.getElementById("right-pane").classList.add("open");
  document.getElementById("right-pane-overlay").classList.add("open");
}

export function closePane() {
  document.getElementById("right-pane").classList.remove("open");
  document.getElementById("right-pane-overlay").classList.remove("open");
  window.commentEditor = null;
}

let _fabOpen = false;
export function toggleFab() {
  _fabOpen = !_fabOpen;
  document.getElementById("fab-menu").classList.toggle("open", _fabOpen);
  document.getElementById("fab").textContent = _fabOpen ? "✕" : "+";
}

export function closeFab() {
  _fabOpen = false;
  document.getElementById("fab-menu").classList.remove("open");
  document.getElementById("fab").textContent = "+";
}

// Setup FAB click-outside listener
document.addEventListener("click", (e) => {
  if (_fabOpen && !e.target.closest("#fab") && !e.target.closest("#fab-menu")) closeFab();
});

export function quickAdd(type) {
  closeFab();
  window.APP.navigate(
    type === "project"     ? "projects"     :
    type === "client"      ? "clients"      :
    type === "invoice"     ? "invoices"     :
    type === "transaction" ? "transactions" : "dashboard"
  );
  setTimeout(() => {
    const map = { project: "showAddProject", client: "showAddClient",
                  invoice: "showAddInvoice", transaction: "showAddTransaction" };
    if (window.APP[map[type]]) window.APP[map[type]]();
  }, 120);
}

export function filterTable(inputId, tbodyId, colIndex) {
  const val = document.getElementById(inputId).value.toLowerCase();
  const rows = document.getElementById(tbodyId).querySelectorAll("tr:not(.empty-row)");
  rows.forEach(row => {
    const cell = row.cells[colIndex];
    row.style.display = (!cell || cell.textContent.toLowerCase().includes(val)) ? "" : "none";
  });
}
