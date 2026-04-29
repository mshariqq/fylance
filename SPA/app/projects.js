// ─────────────────────────────────────────────────────────────
//  app/projects.js  —  Project, Comment & Todo Management
// ─────────────────────────────────────────────────────────────
import { clientOptions } from "./clients.js";

async function projectOptions(selected = "") {
  const projects = await FB.getAll("projects", "createdAt");
  return projects.map(p =>
    `<option value="${p.id}" data-name="${p.title}" ${p.id === selected ? "selected" : ""}>${p.title}</option>`
  ).join("");
}

export async function showAddProject(defaultStatus = "Lead") {
  const cOpts = await clientOptions();
  UI.openModal("Add Project", `
    <div class="form-group"><label>Title *</label><input id="p-title" type="text" placeholder="Website redesign…"/></div>
    <div class="form-row">
      <div class="form-group"><label>Client</label>
        <select id="p-client"><option value="">— None —</option>${cOpts}</select></div>
      <div class="form-group"><label>Type</label>
        <select id="p-type">
          <option>Script Sale</option><option>Custom Project</option><option>Retainer</option><option>Digital Heroes Job</option><option>Other</option>
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

export async function showEditProject(id) {
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
          ${["Script Sale","Custom Project","Retainer","Digital Heroes Job","Other"].map(t=>`<option ${p.type===t?"selected":""}>${t}</option>`).join("")}
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

export async function saveProject() {
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
    APP.reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

export async function deleteProject(id) {
  if (!confirm("Delete this project?")) return;
  await FB.deleteItem("projects", id);
  UI.toast("Project deleted."); APP.reloadPage();
}

export async function openProjectPane(id) {
  await UI.renderProjectPane(id);
}

// ── COMMENTS ─────────────────────────────────────────────────
export async function addComment(projectId, body) {
  const bodyText = body || (window.commentEditor ? window.commentEditor.root.innerHTML.trim() : "");
  if (!bodyText || bodyText === "<p><br></p>") return;
  await FB.addComment(projectId, bodyText);
  if (window.commentEditor) window.commentEditor.setContents([]);
  await refreshComments(projectId);
}

export async function editComment(projectId, commentId, oldBody) {
  const newBody = prompt("Edit your comment:", oldBody);
  if (newBody === null || newBody === oldBody) return;
  try {
    await FB.updateComment(projectId, commentId, newBody);
    UI.toast("Comment updated!");
    await refreshComments(projectId);
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

export async function deleteComment(projectId, commentId) {
  if (!confirm("Delete this comment?")) return;
  try {
    await FB.deleteComment(projectId, commentId);
    UI.toast("Comment deleted!");
    await refreshComments(projectId);
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

async function refreshComments(projectId) {
  const comments = await FB.getComments(projectId);
  const user = window._state.user;
  const isAdmin = await FB.isAdmin(user.uid);
  
  const html = comments.map(c => `
    <div class="comment">
      <div class="comment-meta">
        ${c.authorName} · ${UI.fmtDate(c.createdAt)}
        ${(c.uid === user.uid || isAdmin) ? `
          <span style="margin-left:10px">
            <button class="btn btn-ghost btn-sm" style="padding:0 4px;font-size:10px" onclick="APP.editComment('${projectId}','${c.id}','${c.body.replace(/'/g, "\\'")}')">Edit</button>
            <button class="btn btn-danger btn-sm" style="padding:0 4px;font-size:10px" onclick="APP.deleteComment('${projectId}','${c.id}')">Del</button>
          </span>
        ` : ''}
      </div>
      <div class="comment-body">${c.body || ''}</div>
    </div>`).join("");
  document.getElementById("comment-list").innerHTML = html;
}

// Modify renderProjectPane to call refreshComments initially
// Actually, renderProjectPane is in ui.js. I'll handle the initial render there, 
// but we need this refreshComments to be available.
export { refreshComments };


// ── TODOS ─────────────────────────────────────────────────────
export async function addTodo(projectId) {
  const input = document.getElementById("todo-input");
  const text = input?.value.trim();
  if (!text) return;
  await FB.addTodo(projectId, text);
  input.value = "";
  await refreshTodos(projectId);
}

export async function toggleTodo(projectId, todoId, done) {
  await FB.toggleTodo(projectId, todoId, done);
  const label = document.querySelector(`#todo-${todoId} .todo-label`);
  if (label) label.className = `todo-label ${done ? "done" : ""}`;
  const todos = await FB.getTodos(projectId);
  const doneCount = todos.filter(t => t.done).length;
  const countEl = document.querySelector(".section-title span");
  if (countEl) countEl.textContent = `${doneCount}/${todos.length} done`;
}

export async function deleteTodo(projectId, todoId) {
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

export { projectOptions };
