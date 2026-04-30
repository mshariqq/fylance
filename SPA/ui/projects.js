import { badge, emptyRow, openPane } from "./common.js";

export async function renderProjects() {
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

export async function renderProjectPane(id) {
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
              <td style="font-size:11px;padding:5px 0">${UI.fmt(i.total)}</td>
              <td style="padding:5px 0">${badge(i.status)}</td>
            </tr>`).join("")
            : `<tr><td colspan="3" style="font-size:12px;color:var(--muted);padding:8px 0">No invoices linked.</td></tr>`}
        </tbody>
      </table>
    </div>`;

  const rightHTML = `
    <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">💬 Comments</div>
    <div class="comment-list" id="comment-list" style="flex:1;overflow-y:auto">
      <div style="color:var(--muted);font-size:12px;padding:10px">Loading comments...</div>
    </div>
    <div class="comment-input-wrap" style="margin-top:auto;padding-top:10px">
      <div id="comment-input"></div>
      <button class="btn btn-primary btn-sm" onclick="APP.addComment('${id}')">Post</button>
    </div>`;

  openPane(p.title || "Project", `
    <div class="pane-left">${leftHTML}</div>
    <div class="pane-right">${rightHTML}</div>`);
  
  setTimeout(() => {
    UI.initCommentEditor();
    APP.refreshComments(id);
  }, 0);
}

