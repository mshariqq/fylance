import * as Common from "./ui/common.js";
import { renderDashboard } from "./ui/dashboard.js";
import { renderClients, renderClientPane } from "./ui/clients.js";
import { renderProjects, renderProjectPane } from "./ui/projects.js";
import { renderInvoices, renderInvoiceDetail } from "./ui/invoices.js";
import { renderTransactions } from "./ui/transactions.js";
import { renderReports } from "./ui/reports.js";
import { renderSettings } from "./ui/settings.js";
import { renderUsers } from "./ui/users.js";
import { initCommentEditor } from "./ui/editor.js";

window.UI = {
    ...Common,
    renderDashboard,
    renderUsers,
    renderClients,
    renderProjects,
    renderInvoices,
    renderTransactions,
    renderReports,
    renderSettings,
    renderProjectPane,
    renderClientPane,
    renderInvoiceDetail,
    initCommentEditor,
    // called by nav re-renders
    reloadPage: () => window.APP && window.APP.reloadPage(),
};
