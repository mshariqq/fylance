// ─────────────────────────────────────────────────────────────
//  app.js  —  Routing, navigation, all CRUD actions & form modals
// ─────────────────────────────────────────────────────────────

const PAGE_TITLES = {
  dashboard:    "Dashboard",
  clients:      "Clients",
  projects:     "Projects",
  invoices:     "Invoices",
  transactions: "Transactions",
  reports:      "Reports",
  settings:     "Settings",
};

const PAGE_ACTIONS = {
  dashboard:    () => `<button class="btn btn-primary" onclick="APP.showAddProject()">+ New Project</button>`,
  clients:      () => "",
  projects:     () => "",
  invoices:     () => "",
  transactions: () => "",
  reports:      () => "",
  settings:     () => "",
};

let _currentPage = "dashboard";

// ── ROUTER ─────────────────────────────────────────────────────
async function navigate(page) {
  if (!window._state.user) return;
  _currentPage = page;

  // Update nav
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.page === page);
  });
  document.getElementById("page-title").textContent = PAGE_TITLES[page] || page;
  document.getElementById("topbar-actions").innerHTML = PAGE_ACTIONS[page] ? PAGE_ACTIONS[page]() : "";

  // Render page
  const content = document.getElementById("page-content");
  content.innerHTML = `<div style="color:var(--muted);font-size:13px;padding:20px">Loading…</div>`;

  try {
    let html = "";
    if      (page === "dashboard")    html = await UI.renderDashboard();
    else if (page === "clients")      html = await UI.renderClients();
    else if (page === "projects")     html = await UI.renderProjects();
    else if (page === "invoices")     html = await UI.renderInvoices();
    else if (page === "transactions") html = await UI.renderTransactions();
    else if (page === "reports")      html = await UI.renderReports();
    else if (page === "settings")     html = await UI.renderSettings();
    content.innerHTML = html;
  } catch (e) {
    console.error(e);
    content.innerHTML = `<div style="color:var(--red);padding:20px;font-size:13px">Error loading page: ${e.message}</div>`;
  }
}

async function reloadPage() { await navigate(_currentPage); }

// ── NAV CLICK WIRING ──────────────────────────────────────────
document.querySelectorAll(".nav-item[data-page]").forEach(el => {
  el.addEventListener("click", () => navigate(el.dataset.page));
});

// ── HELPERS: client/project dropdowns ─────────────────────────
async function clientOptions(selected = "") {
  const clients = await FB.getAll("clients", "createdAt");
  return clients.map(c =>
    `<option value="${c.id}" data-name="${c.name}" ${c.id === selected ? "selected" : ""}>${c.name}</option>`
  ).join("");
}
async function projectOptions(selected = "") {
  const projects = await FB.getAll("projects", "createdAt");
  return projects.map(p =>
    `<option value="${p.id}" data-name="${p.title}" ${p.id === selected ? "selected" : ""}>${p.title}</option>`
  ).join("");
}

// ── CLIENTS CRUD ──────────────────────────────────────────────
function showAddClient() {
  UI.openModal("Add Client", `
    <div class="form-row">
      <div class="form-group"><label>Name *</label><input id="c-name" type="text" placeholder="John Doe"/></div>
      <div class="form-group"><label>Company</label><input id="c-company" type="text" placeholder="Acme Inc."/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Email</label><input id="c-email" type="email" placeholder="john@acme.com"/></div>
      <div class="form-group"><label>Phone</label><input id="c-phone" type="text" placeholder="+91 98…"/></div>
    </div>
    <div class="form-group"><label>Notes</label><textarea id="c-notes" placeholder="Any notes…"></textarea></div>
  `, `
    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="APP.saveClient()">Save Client</button>
  `);
}

async function showEditClient(id) {
  const c = await FB.getOne("clients", id);
  if (!c) return;
  UI.openModal("Edit Client", `
    <input type="hidden" id="c-edit-id" value="${id}"/>
    <div class="form-row">
      <div class="form-group"><label>Name *</label><input id="c-name" value="${c.name||""}" type="text"/></div>
      <div class="form-group"><label>Company</label><input id="c-company" value="${c.company||""}" type="text"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Email</label><input id="c-email" value="${c.email||""}" type="email"/></div>
      <div class="form-group"><label>Phone</label><input id="c-phone" value="${c.phone||""}" type="text"/></div>
    </div>
    <div class="form-group"><label>Notes</label><textarea id="c-notes">${c.notes||""}</textarea></div>
  `, `
    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="APP.saveClient()">Update Client</button>
  `);
}

async function saveClient() {
  const id   = document.getElementById("c-edit-id")?.value;
  const name = document.getElementById("c-name").value.trim();
  if (!name) { UI.toast("Name is required.", "error"); return; }
  const data = {
    name,
    company:  document.getElementById("c-company").value.trim(),
    email:    document.getElementById("c-email").value.trim(),
    phone:    document.getElementById("c-phone").value.trim(),
    notes:    document.getElementById("c-notes").value.trim(),
  };
  try {
    if (id) await FB.updateItem("clients", id, data);
    else    await FB.addItem("clients", data);
    UI.closeModal();
    UI.toast(id ? "Client updated!" : "Client added!");
    reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

async function deleteClient(id) {
  if (!confirm("Delete this client?")) return;
  await FB.deleteItem("clients", id);
  UI.toast("Client deleted."); reloadPage();
}

// ── PROJECTS CRUD ─────────────────────────────────────────────
async function showAddProject(defaultStatus = "Lead") {
  const cOpts = await clientOptions();
  UI.openModal("Add Project", `
    <div class="form-group"><label>Title *</label><input id="p-title" type="text" placeholder="Website redesign…"/></div>
    <div class="form-row">
      <div class="form-group"><label>Client</label>
        <select id="p-client"><option value="">— None —</option>${cOpts}</select></div>
      <div class="form-group"><label>Type</label>
        <select id="p-type">
          <option>Script Sale</option><option>Custom Project</option><option>Retainer</option><option>Other</option>
        </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Status</label>
        <select id="p-status">
          <option ${defaultStatus==="Lead"?"selected":""}>Lead</option>
          <option ${defaultStatus==="In Progress"?"selected":""}>In Progress</option>
          <option ${defaultStatus==="Review"?"selected":""}>Review</option>
          <option ${defaultStatus==="Done"?"selected":""}>Done</option>
        </select></div>
      <div class="form-group"><label>Deadline</label><input id="p-deadline" type="date" value="${UI.today()}"/></div>
    </div>
    <div class="form-group"><label>Description</label><textarea id="p-desc" placeholder="Project details…"></textarea></div>
  `, `
    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="APP.saveProject()">Save Project</button>
  `);
}

async function showEditProject(id) {
  const p = await FB.getOne("projects", id);
  if (!p) return;
  const cOpts = await clientOptions(p.clientId);
  UI.openModal("Edit Project", `
    <input type="hidden" id="p-edit-id" value="${id}"/>
    <div class="form-group"><label>Title *</label><input id="p-title" value="${p.title||""}" type="text"/></div>
    <div class="form-row">
      <div class="form-group"><label>Client</label>
        <select id="p-client"><option value="">— None —</option>${cOpts}</select></div>
      <div class="form-group"><label>Type</label>
        <select id="p-type">
          ${["Script Sale","Custom Project","Retainer","Other"].map(t=>`<option ${p.type===t?"selected":""}>${t}</option>`).join("")}
        </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Status</label>
        <select id="p-status">
          ${["Lead","In Progress","Review","Done"].map(s=>`<option ${p.status===s?"selected":""}>${s}</option>`).join("")}
        </select></div>
      <div class="form-group"><label>Deadline</label><input id="p-deadline" type="date" value="${p.deadline||""}"/></div>
    </div>
    <div class="form-group"><label>Description</label><textarea id="p-desc">${p.description||""}</textarea></div>
  `, `
    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="APP.saveProject()">Update Project</button>
  `);
}

async function saveProject() {
  const id    = document.getElementById("p-edit-id")?.value;
  const title = document.getElementById("p-title").value.trim();
  if (!title) { UI.toast("Title is required.", "error"); return; }
  const clientSel = document.getElementById("p-client");
  const clientId  = clientSel.value;
  const clientName = clientId ? clientSel.options[clientSel.selectedIndex].dataset.name : "";
  const data = {
    title,
    clientId, clientName,
    type:        document.getElementById("p-type").value,
    status:      document.getElementById("p-status").value,
    deadline:    document.getElementById("p-deadline").value,
    description: document.getElementById("p-desc").value.trim(),
  };
  try {
    if (id) await FB.updateItem("projects", id, data);
    else    await FB.addItem("projects", data);
    UI.closeModal();
    UI.toast(id ? "Project updated!" : "Project added!");
    reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

async function deleteProject(id) {
  if (!confirm("Delete this project?")) return;
  await FB.deleteItem("projects", id);
  UI.toast("Project deleted."); reloadPage();
}

async function openProjectPane(id) {
  await UI.renderProjectPane(id);
}

async function openClientPane(id) {
  await UI.renderClientPane(id);
}

// ── COMMENTS ─────────────────────────────────────────────────
async function addComment(projectId) {
  const body = document.getElementById("comment-input").value.trim();
  if (!body) return;
  await FB.addComment(projectId, body);
  document.getElementById("comment-input").value = "";
  const comments = await FB.getComments(projectId);
  document.getElementById("comment-list").innerHTML = comments.map(c => `
    <div class="comment">
      <div class="comment-meta">${c.authorName} · ${UI.fmtDate(c.createdAt)}</div>
      <div class="comment-body">${c.body}</div>
    </div>`).join("");
}

// ── TODOS ─────────────────────────────────────────────────────
async function addTodo(projectId) {
  const input = document.getElementById("todo-input");
  const text = input?.value.trim();
  if (!text) return;
  await FB.addTodo(projectId, text);
  input.value = "";
  await refreshTodos(projectId);
}

async function toggleTodo(projectId, todoId, done) {
  await FB.toggleTodo(projectId, todoId, done);
  // Update label style instantly without full re-render
  const label = document.querySelector(`#todo-${todoId} .todo-label`);
  if (label) label.className = `todo-label ${done ? "done" : ""}`;
  // Update done count
  const todos = await FB.getTodos(projectId);
  const doneCount = todos.filter(t => t.done).length;
  const countEl = document.querySelector(".section-title span");
  if (countEl) countEl.textContent = `${doneCount}/${todos.length} done`;
}

async function deleteTodo(projectId, todoId) {
  await FB.deleteTodo(projectId, todoId);
  await refreshTodos(projectId);
}

async function refreshTodos(projectId) {
  const todos = await FB.getTodos(projectId);
  const doneCount = todos.filter(t => t.done).length;
  const listEl = document.getElementById("todo-list");
  if (!listEl) return;
  listEl.innerHTML = todos.length ? todos.map(t => `
    <div class="todo-item" id="todo-${t.id}">
      <input type="checkbox" class="todo-check" ${t.done ? "checked" : ""}
        onchange="APP.toggleTodo('${projectId}','${t.id}',this.checked)"/>
      <label class="todo-label ${t.done ? "done" : ""}"
        onclick="this.previousElementSibling.click()">${t.text}</label>
      <button class="todo-del" onclick="APP.deleteTodo('${projectId}','${t.id}')">×</button>
    </div>`).join("")
    : `<p style="color:var(--muted);font-size:12px;font-style:italic;padding:4px 0">No tasks yet.</p>`;
  const countEl = document.querySelector(".section-title span");
  if (countEl) countEl.textContent = `${doneCount}/${todos.length} done`;
}

// ── INVOICES CRUD ─────────────────────────────────────────────
async function showAddInvoice() {
  const [cOpts, pOpts, num] = await Promise.all([clientOptions(), projectOptions(), FB.nextInvoiceNumber()]);
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

async function showEditInvoice(id) {
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
    <div class="form-group"><label>Discount (₹)</label><input id="inv-discount" type="number" value="${inv.discount||0}" oninput="APP.calcInvoiceTotal()"/></div>
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

function addLineItem() {
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

function calcInvoiceTotal() {
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

async function saveInvoice() {
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
    reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

async function deleteInvoice(id) {
  if (!confirm("Delete this invoice?")) return;
  await FB.deleteItem("invoices", id);
  UI.toast("Invoice deleted."); reloadPage();
}

async function openInvoiceDetail(id) {
  const html = await UI.renderInvoiceDetail(id);
  document.getElementById("page-content").innerHTML = html;
  document.getElementById("page-title").textContent = "Invoice Detail";
}

async function markInvoicePaid(id) {
  await FB.updateItem("invoices", id, { status: "Paid" });
  UI.toast("Marked as Paid!");
  const html = await UI.renderInvoiceDetail(id);
  document.getElementById("page-content").innerHTML = html;
}

// ── TRANSACTIONS CRUD ─────────────────────────────────────────
async function showAddTransaction() {
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

async function showEditTransaction(id) {
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

async function saveTransaction() {
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
    reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

async function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  await FB.deleteItem("transactions", id);
  UI.toast("Transaction deleted."); reloadPage();
}

// ── SETTINGS ACTIONS ─────────────────────────────────────────
async function saveWorkspace() {
  const name = document.getElementById("ws-name-input").value.trim();
  if (!name) { UI.toast("Name required.", "error"); return; }
  try {
    await FB.updateItem("", window._state.workspaceId, { name });
    window._state.workspace.name = name;
    document.getElementById("ws-name-display").textContent = name;
    UI.toast("Workspace saved!");
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

async function saveProfile() {
  UI.toast("Profile name is managed by Google — update it in your Google account.");
}

async function inviteMember() {
  const email = document.getElementById("invite-email").value.trim();
  if (!email) { UI.toast("Enter an email.", "error"); return; }
  UI.toast(`Invite link sent to ${email} (implement email invite flow in Firebase)`);
}

// ── EXPORT as window.APP ──────────────────────────────────────
window.APP = {
  navigate, reloadPage,
  // Clients
  showAddClient, showEditClient, saveClient, deleteClient, openClientPane,
  // Projects
  showAddProject, showEditProject, saveProject, deleteProject, openProjectPane,
  addComment,
  // Todos
  addTodo, toggleTodo, deleteTodo,
  // Invoices
  showAddInvoice, showEditInvoice, saveInvoice, deleteInvoice,
  openInvoiceDetail, markInvoicePaid,
  addLineItem, calcInvoiceTotal,
  // Transactions
  showAddTransaction, showEditTransaction, saveTransaction, deleteTransaction,
  // Settings
  saveWorkspace, saveProfile, inviteMember,
};