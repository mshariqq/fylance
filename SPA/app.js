// ─────────────────────────────────────────────────────────────
//  app.js  —  Main Application Aggregator
// ─────────────────────────────────────────────────────────────

import { navigate, reloadPage, initRouter } from "./app/router.js";
import { 
  showAddClient, showEditClient, saveClient, deleteClient, openClientPane 
} from "./app/clients.js";
import { 
  showAddProject, showEditProject, saveProject, deleteProject, openProjectPane, 
  addComment, editComment, deleteComment, addTodo, toggleTodo, deleteTodo, refreshComments
} from "./app/projects.js";
import { 
  showAddInvoice, showEditInvoice, saveInvoice, deleteInvoice, 
  openInvoiceDetail, markInvoicePaid, addLineItem, calcInvoiceTotal 
} from "./app/invoices.js";
import { 
  showAddTransaction, showEditTransaction, saveTransaction, deleteTransaction 
} from "./app/transactions.js";
import { 
  saveWorkspace, saveProfile, inviteMember, showEditUser, saveUser, blockUser 
} from "./app/settings.js";

// Attach everything to the global APP object for HTML onclick handlers
window.APP = {
  navigate, reloadPage,
  // Clients
  showAddClient, showEditClient, saveClient, deleteClient, openClientPane,
  // Projects
  showAddProject, showEditProject, saveProject, deleteProject, openProjectPane,
  addComment, editComment, deleteComment, refreshComments,
  // Todos
  addTodo, toggleTodo, deleteTodo,
  // Invoices
  showAddInvoice, showEditInvoice, saveInvoice, deleteInvoice,
  openInvoiceDetail, markInvoicePaid,
  addLineItem, calcInvoiceTotal,
  // Transactions
  showAddTransaction, showEditTransaction, saveTransaction, deleteTransaction,
  // Users / Settings
  showEditUser, saveUser, blockUser,
  saveWorkspace, saveProfile, inviteMember,
};

// Initialize navigation wiring
initRouter();
