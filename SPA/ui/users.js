import { badge, emptyRow, fmtDate } from "./common.js";

export async function renderUsers() {
  const users = await FB.getAllUsers();
  return `
    <div class="search-bar">
      <input id="user-search" type="text" placeholder="Search users…" oninput="UI.filterTable('user-search','users-tbody',0)"/>
      <div style="color:var(--muted);font-size:12px">Admin only access</div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Name</th><th>UID</th><th>Verified</th><th>Admin</th><th>Created</th><th></th>
        </tr></thead>
        <tbody id="users-tbody">
          ${users.length ? users.map(u => `
            <tr>
              <td><strong>${u.name || "Untitled"}</strong></td>
              <td style="font-family:var(--font-mono);font-size:11px">${u.id}</td>
              <td>${u.is_verified ? badge("Verified") : badge("Blocked")}</td>
              <td>${u.is_admin ? badge("Admin") : badge("User")}</td>
              <td style="font-family:var(--font-mono);font-size:12px">${fmtDate(u.createdAt)}</td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="APP.showEditUser('${u.id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="APP.blockUser('${u.id}')">Block</button>
              </td>
            </tr>`).join("") : emptyRow(6)}
        </tbody>
      </table>
    </div>`;
}
