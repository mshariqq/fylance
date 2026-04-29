import { badge } from "./common.js";

export async function renderSettings() {
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
