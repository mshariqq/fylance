// ─────────────────────────────────────────────────────────────
//  app/settings.js  —  Settings & User Management
// ─────────────────────────────────────────────────────────────

export async function saveWorkspace() {
  const name = document.getElementById("ws-name-input").value.trim();
  if (!name) { UI.toast("Name required.", "error"); return; }
  try {
    await FB.updateItem("", window._state.workspaceId, { name });
    window._state.workspace.name = name;
    document.getElementById("ws-name-display").textContent = name;
    UI.toast("Workspace saved!");
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

export async function saveProfile() {
  UI.toast("Profile name is managed by Google — update it in your Google account.");
}

export async function inviteMember() {
  const email = document.getElementById("invite-email").value.trim();
  if (!email) { UI.toast("Enter an email.", "error"); return; }
  UI.toast(`Invite link sent to ${email} (implement email invite flow in Firebase)`);
}

export async function showEditUser(id) {
  const u = await FB.getUserDoc(id);
  if (!u) return;
  
  const stats = await FB.getWorkspaceStats(id);
  
  UI.openModal("Edit User", `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
      <div>
        <div class="form-group"><label>Username</label><input id="u-username" value="${u.username || u.name || ""}" type="text"/></div>
        <div class="form-group"><label>Workspace Name</label><input id="u-ws-name" value="${u.name || ""}" type="text"/></div>
        <div class="form-group"><label>Verified</label>
          <select id="u-verified">
            <option value="true" ${u.is_verified==="true" || u.is_verified===true ? "selected" : ""}>Yes</option>
            <option value="false" ${u.is_verified==="false" || u.is_verified===false ? "selected" : ""}>No</option>
          </select></div>
        <div class="form-group"><label>Admin</label>
          <select id="u-admin">
            <option value="true" ${u.is_admin==="true" || u.is_admin===true ? "selected" : ""}>Yes</option>
            <option value="false" ${u.is_admin==="false" || u.is_admin===false ? "selected" : ""}>No</option>
          </select></div>
      </div>
      <div style="background:var(--border2); padding:16px; border-radius:8px; font-size:13px">
        <div style="font-weight:700; margin-bottom:12px; color:var(--muted)">WORKSPACE STATS</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px">
          <span>Projects:</span> <strong>${stats.projects}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px">
          <span>Members:</span> <strong>${stats.members}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px">
          <span>Invoices:</span> <strong>${stats.invoices}</strong>
        </div>
        <div style="display:flex; justify-content:space-between">
          <span>Transactions:</span> <strong>${stats.transactions}</strong>
        </div>
      </div>
    </div>
    <input type="hidden" id="u-edit-id" value="${id}"/>
  `, `
    <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="APP.saveUser()">Save User</button>
  `);
}

export async function saveUser() {
  const id = document.getElementById("u-edit-id").value;
  const data = {
    username: document.getElementById("u-username").value.trim(),
    name: document.getElementById("u-ws-name").value.trim(),
    is_verified: document.getElementById("u-verified").value === "true",
    is_admin: document.getElementById("u-admin").value === "true",
  };
  try {
    await FB.updateUserDoc(id, data);
    UI.closeModal();
    UI.toast("User updated!");
    APP.reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

export async function blockUser(id) {
  if (!confirm("Block this user?")) return;
  try {
    await FB.updateUserDoc(id, { is_verified: false });
    UI.toast("User blocked!");
    APP.reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}
