// ─────────────────────────────────────────────────────────────
//  ui.js  —  All UI rendering: pages, modals, right pane, toasts
// ─────────────────────────────────────────────────────────────

// ── HELPERS ───────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}
function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function today() { return new Date().toISOString().slice(0, 10); }
function badge(status) {
  const map = {
    "Lead": "gray", "In Progress": "blue", "Review": "yellow", "Done": "green",
    "Draft": "gray", "Sent": "blue", "Paid": "green", "Overdue": "red",
    "Income": "green", "Expense": "red",
    "owner": "yellow", "member": "gray",
    "Script Sale": "purple", "Custom Project": "blue", "Retainer": "green", "Other": "gray",
  };
  const cls = map[status] || "gray";
  return `<span class="badge badge-${cls}">${status}</span>`;
}
function emptyRow(cols, msg = "Nothing here yet.") {
  return `<tr class="empty-row"><td colspan="${cols}">${msg}</td></tr>`;
}

// ── TOAST ─────────────────────────────────────────────────────
function toast(msg, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = "", 3000);
}

// ── MODAL ─────────────────────────────────────────────────────
function openModal(title, bodyHTML, footerHTML) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = bodyHTML;
  document.getElementById("modal-footer").innerHTML = footerHTML;
  document.getElementById("modal-overlay").classList.add("open");
}
function closeModal(e) {
  if (e && e.target !== document.getElementById("modal-overlay")) return;
  document.getElementById("modal-overlay").classList.remove("open");
}

// ── RIGHT PANE ────────────────────────────────────────────────
function openPane(title, bodyHTML) {
  document.getElementById("pane-title").textContent = title;
  document.getElementById("pane-body").innerHTML = bodyHTML;
  document.getElementById("right-pane").classList.add("open");
  document.getElementById("right-pane-overlay").classList.add("open");
}
function closePane() {
  document.getElementById("right-pane").classList.remove("open");
  document.getElementById("right-pane-overlay").classList.remove("open");
}

// ── FAB ───────────────────────────────────────────────────────
let _fabOpen = false;
function toggleFab() {
  _fabOpen = !_fabOpen;
  document.getElementById("fab-menu").classList.toggle("open", _fabOpen);
  document.getElementById("fab").textContent = _fabOpen ? "✕" : "+";
}
function closeFab() {
  _fabOpen = false;
  document.getElementById("fab-menu").classList.remove("open");
  document.getElementById("fab").textContent = "+";
}
document.addEventListener("click", (e) => {
  if (_fabOpen && !e.target.closest("#fab") && !e.target.closest("#fab-menu")) closeFab();
});

// ── QUICK ADD ─────────────────────────────────────────────────
function quickAdd(type) {
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

// ── PAGE: DASHBOARD (KANBAN) ───────────────────────────────────
async function renderDashboard() {
  const projects = await FB.getAll("projects", "createdAt");
  const columns = ["Lead", "In Progress", "Review", "Done"];
  const byStatus = {};
  columns.forEach(c => byStatus[c] = []);
  projects.forEach(p => {
    if (byStatus[p.status] !== undefined) byStatus[p.status].push(p);
    else byStatus["Lead"].push(p);
  });

  let html = `<div class="kanban-board">`;
  for (const col of columns) {
    const cards = byStatus[col];
    const colorMap = { "Lead": "#6b7585", "In Progress": "#5b9cf6", "Review": "#f0c040", "Done": "#3ddc84" };
    html += `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span style="color:${colorMap[col]}">${col}</span>
          <span class="col-count">${cards.length}</span>
        </div>
        <div class="kanban-cards">
          ${cards.map(p => `
            <div class="kanban-card" onclick="APP.openProjectPane('${p.id}')">
              <div class="card-title">${p.title || "Untitled"}</div>
              <div class="card-client">${p.clientName || "No client"}</div>
              <div class="card-meta">
                ${badge(p.type || "Other")}
                <span class="card-deadline">${p.deadline ? p.deadline : ""}</span>
              </div>
            </div>
          `).join("")}
        </div>
        <button class="add-card-btn" onclick="APP.showAddProject('${col}')">+ Add project</button>
      </div>`;
  }
  html += `</div>`;
  return html;
}

// ── PAGE: CLIENTS ─────────────────────────────────────────────
async function renderClients() {
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

// ── PAGE: PROJECTS ────────────────────────────────────────────
async function renderProjects() {
  const projects = await FB.getAll("projects", "createdAt");
  return `
    <div class="filter-row">
      <input style="max-width:220px" type="text" id="proj-search" placeholder="Search…" oninput="UI.filterTable('proj-search','proj-tbody',0)"/>
      <select id="proj-status-filter" onchange="UI.reloadPage()">
        <option value="">All Statuses</option>
        <option>Lead</option><option>In Progress</option><option>Review</option><option>Done</option>
      </select>
      <button class="btn btn-primary" onclick="APP.showAddProject()">+ Add Project</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Title</th><th>Client</th><th>Type</th><th>Status</th><th>Deadline</th><th></th>
        </tr></thead>
        <tbody id="proj-tbody">
          ${projects.length ? projects.map(p => `
            <tr>
              <td><strong>${p.title || "Untitled"}</strong></td>
              <td>${p.clientName || "—"}</td>
              <td>${badge(p.type || "Other")}</td>
              <td>${badge(p.status || "Lead")}</td>
              <td style="font-family:var(--font-mono);font-size:12px">${p.deadline || "—"}</td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="APP.openProjectPane('${p.id}')">View</button>
                <button class="btn btn-ghost btn-sm" onclick="APP.showEditProject('${p.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="APP.deleteProject('${p.id}')">Del</button>
              </td>
            </tr>`).join("") : emptyRow(6)}
        </tbody>
      </table>
    </div>`;
}

// ── PAGE: INVOICES ────────────────────────────────────────────
async function renderInvoices() {
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

// ── PAGE: TRANSACTIONS ────────────────────────────────────────
async function renderTransactions() {
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

// ── PAGE: REPORTS ─────────────────────────────────────────────
async function renderReports() {
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

// ── PAGE: SETTINGS ────────────────────────────────────────────
async function renderSettings() {
  const ws  = window._state.workspace;
  const u   = window._state.user;
  const members = await FB.getAll("members", "joinedAt").catch(() => []);
  return `
    <div style="max-width:600px">
      <div class="settings-section">
        <h3>Profile</h3>
        <div class="form-group"><label>Name</label>
          <input type="text" id="prof-name" value="${u.displayName || ""}"/></div>
        <div class="form-group"><label>Email</label>
          <input type="text" value="${u.email || ""}" disabled style="opacity:.5"/></div>
        <button class="btn btn-primary" onclick="APP.saveProfile()">Save Profile</button>
      </div>
      <div class="settings-section">
        <h3>Workspace</h3>
        <div class="form-group"><label>Workspace Name</label>
          <input type="text" id="ws-name-input" value="${ws?.name || ""}"/></div>
        <button class="btn btn-primary" onclick="APP.saveWorkspace()">Save Workspace</button>
      </div>
      <div class="settings-section">
        <h3>Team Members</h3>
        <div style="margin-bottom:16px">
          ${members.map(m => `
            <div class="member-row">
              <img src="${m.photo||''}" style="width:30px;height:30px;border-radius:50%;background:var(--border2)" onerror="this.style.display='none'"/>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600">${m.name||m.email}</div>
                <div style="font-size:11px;color:var(--muted)">${m.email}</div>
              </div>
              ${badge(m.role)}
            </div>`).join("") || "<p style='color:var(--muted);font-size:13px'>No members found.</p>"}
        </div>
        <div style="display:flex;gap:8px">
          <input type="email" id="invite-email" placeholder="Invite by email…" style="flex:1"/>
          <button class="btn btn-ghost" onclick="APP.inviteMember()">Invite</button>
        </div>
      </div>
    </div>`;
}

// ── TABLE SEARCH FILTER ───────────────────────────────────────
function filterTable(inputId, tbodyId, colIndex) {
  const val = document.getElementById(inputId).value.toLowerCase();
  const rows = document.getElementById(tbodyId).querySelectorAll("tr:not(.empty-row)");
  rows.forEach(row => {
    const cell = row.cells[colIndex];
    row.style.display = (!cell || cell.textContent.toLowerCase().includes(val)) ? "" : "none";
  });
}

// ── PROJECT PANE ──────────────────────────────────────────────
async function renderProjectPane(id) {
  const p = await FB.getOne("projects", id);
  if (!p) return;
  const [comments, todos, invoices] = await Promise.all([
    FB.getComments(id),
    FB.getTodos(id),
    FB.getAll("invoices", "createdAt"),
  ]);
  const projInvoices = invoices.filter(i => i.projectId === id);
  const doneCount = todos.filter(t => t.done).length;

  const leftHTML = `
    <div class="pane-field"><label>Title</label><div class="value">${p.title || "—"}</div></div>
    <div class="pane-field"><label>Client</label><div class="value">${p.clientName || "—"}</div></div>
    <div style="display:flex;gap:12px">
      <div class="pane-field" style="flex:1"><label>Type</label><div class="value">${badge(p.type || "Other")}</div></div>
      <div class="pane-field" style="flex:1"><label>Status</label><div class="value">${badge(p.status || "Lead")}</div></div>
    </div>
    <div class="pane-field"><label>Deadline</label><div class="value" style="font-size:13px;font-weight:600">${p.deadline || "—"}</div></div>
    ${p.description ? `<div class="pane-field"><label>Description</label><div class="value" style="color:var(--muted);font-size:12px;line-height:1.6">${p.description}</div></div>` : ""}

    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="section-title" style="margin:0">✅ To-Do
          <span style="font-size:11px;color:var(--muted);font-weight:400;margin-left:6px">${doneCount}/${todos.length} done</span>
        </div>
      </div>
      <div id="todo-list">
        ${todos.length ? todos.map(t => `
          <div class="todo-item" id="todo-${t.id}">
            <input type="checkbox" class="todo-check" ${t.done ? "checked" : ""}
              onchange="APP.toggleTodo('${id}','${t.id}',this.checked)"/>
            <label class="todo-label ${t.done ? "done" : ""}"
              onclick="this.previousElementSibling.click()">${t.text}</label>
            <button class="todo-del" onclick="APP.deleteTodo('${id}','${t.id}')">×</button>
          </div>`).join("")
          : `<p style="color:var(--muted);font-size:12px;font-style:italic;padding:4px 0">No tasks yet.</p>`}
      </div>
      <div class="todo-add-row">
        <input type="text" id="todo-input" placeholder="Add a task…"
          onkeydown="if(event.key==='Enter') APP.addTodo('${id}')"/>
        <button class="btn btn-ghost btn-sm" onclick="APP.addTodo('${id}')">Add</button>
      </div>
    </div>

    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
      <div class="section-title" style="margin-bottom:10px">🧾 Invoices</div>
      <table style="width:100%">
        <thead><tr>
          <th style="font-size:10px;padding:6px 0">Invoice #</th>
          <th style="font-size:10px;padding:6px 0">Amount</th>
          <th style="font-size:10px;padding:6px 0">Status</th>
        </tr></thead>
        <tbody>
          ${projInvoices.length ? projInvoices.map(i => `
            <tr>
              <td style="font-size:11px;padding:5px 0">${i.number||"—"}</td>
              <td style="font-size:11px;padding:5px 0">${fmt(i.total)}</td>
              <td style="padding:5px 0">${badge(i.status)}</td>
            </tr>`).join("")
            : `<tr><td colspan="3" style="font-size:12px;color:var(--muted);padding:8px 0">No invoices linked.</td></tr>`}
        </tbody>
      </table>
    </div>`;

  const rightHTML = `
    <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">💬 Comments</div>
    <div class="comment-list" id="comment-list" style="flex:1;overflow-y:auto">
      ${comments.length ? comments.map(c => `
        <div class="comment">
          <div class="comment-meta">${c.authorName} · ${fmtDate(c.createdAt)}</div>
          <div class="comment-body">${c.body}</div>
        </div>`).join("")
        : `<p style="color:var(--muted);font-size:12px;font-style:italic">No comments yet.</p>`}
    </div>
    <div class="comment-input-wrap" style="margin-top:auto;padding-top:10px">
      <textarea id="comment-input" placeholder="Add a comment…"></textarea>
      <button class="btn btn-primary btn-sm" onclick="APP.addComment('${id}')">Post</button>
    </div>`;

  openPane(p.title || "Project", `
    <div class="pane-left">${leftHTML}</div>
    <div class="pane-right">${rightHTML}</div>`);
}

// ── CLIENT PANE ───────────────────────────────────────────────
async function renderClientPane(id) {
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

// ── INVOICE DETAIL PAGE ───────────────────────────────────────
async function renderInvoiceDetail(id) {
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

// ── EXPORT ────────────────────────────────────────────────────
window.UI = {
  toast,
  openModal, closeModal,
  openPane, closePane,
  toggleFab, closeFab, quickAdd,
  filterTable,
  renderDashboard,
  renderClients,
  renderProjects,
  renderInvoices,
  renderTransactions,
  renderReports,
  renderSettings,
  renderProjectPane,
  renderClientPane,
  renderInvoiceDetail,
  // called by nav re-renders
  reloadPage: () => window.APP && window.APP.reloadPage(),
  fmt, fmtDate, badge, today,
};