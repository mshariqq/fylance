// ─────────────────────────────────────────────────────────────
//  app/clients.js  —  Client Management
// ─────────────────────────────────────────────────────────────

async function clientOptions(selected = "") {
  const clients = await FB.getAll("clients", "createdAt");
  return clients.map(c =>
    `<option value="${c.id}" data-name="${c.name}" ${c.id === selected ? "selected" : ""}>${c.name}</option>`
  ).join("");
}

export function showAddClient() {
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

export async function showEditClient(id) {
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

export async function saveClient() {
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
    APP.reloadPage();
  } catch (e) { UI.toast("Error: " + e.message, "error"); }
}

export async function deleteClient(id) {
  if (!confirm("Delete this client?")) return;
  await FB.deleteItem("clients", id);
  UI.toast("Client deleted."); APP.reloadPage();
}

export async function openClientPane(id) {
  await UI.renderClientPane(id);
}

// Export options helper for other modules (like projects)
export { clientOptions };
