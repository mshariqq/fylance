// ─────────────────────────────────────────────────────────────
//  app/router.js  —  Routing & Navigation
// ─────────────────────────────────────────────────────────────

const PAGE_TITLES = {
  dashboard:    "Dashboard",
  clients:      "Clients",
  projects:     "Projects",
  users:        "Users",
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

export async function navigate(page, pushState = true) {
  if (!window._state.user) return;
  _currentPage = page;

  if (pushState) {
    window.location.hash = page;
  }

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
    else if (page === "users")        html = await UI.renderUsers();
    else if (page === "invoices")     html = await UI.renderInvoices();
    else if (page === "transactions") html = await UI.renderTransactions();
    else if (page === "reports")      html = await UI.renderReports();
    else if (page === "settings")     html = await UI.renderSettings();
    else                              html = `<div style="padding:20px">Page not found.</div>`;
    content.innerHTML = html;
  } catch (e) {
    console.error(e);
    content.innerHTML = `<div style="color:var(--red);padding:20px;font-size:13px">Error loading page: ${e.message}</div>`;
  }
}

export async function reloadPage() { 
  await navigate(_currentPage); 
}

export function initRouter() {
  document.querySelectorAll(".nav-item[data-page]").forEach(el => {
    el.addEventListener("click", () => navigate(el.dataset.page));
  });

  // Handle hash changes
  window.addEventListener("hashchange", () => {
    const page = window.location.hash.slice(1);
    if (page) navigate(page, false);
  });

  // Initial hash check
  const initialPage = window.location.hash.slice(1);
  if (initialPage) navigate(initialPage, false);
}
