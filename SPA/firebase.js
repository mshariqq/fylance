// ─────────────────────────────────────────────────────────────
//  firebase.js  —  All Firebase Auth + Firestore logic
//  Replace the firebaseConfig below with your own project's keys.
//  Keys are safe to expose — security comes from Firestore Rules.
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, getDocs, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── 1. CONFIG (replace with your Firebase project) ────────────
const firebaseConfig = {
  apiKey: "xxxxxx",
  authDomain: "xxxxx.firebaseapp.com",
  projectId: "xxxx",
  storageBucket: "xxxxxxxxxxx",
  messagingSenderId: "xxxxxxxxx",
  appId: "1:xxxxxxxxxxxx",
  measurementId: "G-xxxxxxxxx"
};


const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── 2. STATE (shared global) ───────────────────────────────────
window._state = {
  user:        null,
  workspaceId: null,
  workspace:   null,
};

// ── 3. AUTH HELPERS ───────────────────────────────────────────
async function signIn() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) { console.error(e); }
}

async function signOutUser() {
  await signOut(auth);
}

// ── 4. WORKSPACE BOOTSTRAP ────────────────────────────────────
async function ensureWorkspace(user) {
  // Each user gets exactly one workspace, keyed by their uid.
  // For multi-user SaaS: add invite flow to add members here.
  const wsRef = doc(db, "workspaces", user.uid);
  const wsSnap = await getDoc(wsRef);

  if (!wsSnap.exists()) {
    const ws = {
      name:      user.displayName ? `${user.displayName}'s Workspace` : "My Workspace",
      ownerId:   user.uid,
      createdAt: serverTimestamp(),
    };
    await setDoc(wsRef, ws);
    // Add owner to members sub-collection
    await setDoc(doc(db, "workspaces", user.uid, "members", user.uid), {
      uid:    user.uid,
      name:   user.displayName || "",
      email:  user.email || "",
      photo:  user.photoURL || "",
      role:   "owner",
      joinedAt: serverTimestamp(),
    });
    return ws;
  }
  return wsSnap.data();
}

// ── 5. AUTH STATE LISTENER (wires everything together) ─────────
onAuthStateChanged(auth, async (user) => {
  document.getElementById("loading-spinner").style.display = "none";

  if (!user) {
    // Not signed in
    window._state.user = null;
    window._state.workspaceId = null;
    window._state.workspace = null;
    document.getElementById("auth-screen").style.display = "flex";
    document.getElementById("app-shell").classList.remove("active");
    document.getElementById("fab").style.display = "none";
    return;
  }

  // Signed in — bootstrap workspace
  const ws = await ensureWorkspace(user);
  window._state.user        = user;
  window._state.workspaceId = user.uid;   // simple 1:1 for now
  window._state.workspace   = ws;

  // Update sidebar UI
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app-shell").classList.add("active");
  document.getElementById("fab").style.display = "flex";
  document.getElementById("ws-name-display").textContent = ws.name || "My Workspace";
  document.getElementById("user-name-display").textContent = user.displayName || user.email;
  const avatarImg = document.getElementById("user-avatar-img");
  if (user.photoURL) avatarImg.src = user.photoURL;

  // Navigate to dashboard
  window.APP.navigate("dashboard");
});

// ── 6. FIRESTORE CRUD HELPERS ─────────────────────────────────
function wsCol(col) {
  return collection(db, "workspaces", window._state.workspaceId, col);
}
function wsDoc(col, id) {
  return doc(db, "workspaces", window._state.workspaceId, col, id);
}

// Generic fetch all docs in a sub-collection
async function getAll(colName, orderField = "createdAt") {
  try {
    const q = query(wsCol(colName), orderBy(orderField, "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    // If index not ready yet, fall back unordered
    const snap = await getDocs(wsCol(colName));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

async function getOne(colName, id) {
  const snap = await getDoc(wsDoc(colName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function addItem(colName, data) {
  const ref = await addDoc(wsCol(colName), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

async function updateItem(colName, id, data) {
  await updateDoc(wsDoc(colName, id), { ...data, updatedAt: serverTimestamp() });
}

async function deleteItem(colName, id) {
  await deleteDoc(wsDoc(colName, id));
}

// Comments sub-sub-collection: workspaces/{wsId}/projects/{projectId}/comments/{cId}
async function getComments(projectId) {
  try {
    const ref = collection(db, "workspaces", window._state.workspaceId, "projects", projectId, "comments");
    const q = query(ref, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

async function addComment(projectId, body) {
  const u = window._state.user;
  const ref = collection(db, "workspaces", window._state.workspaceId, "projects", projectId, "comments");
  await addDoc(ref, {
    body,
    authorName: u.displayName || u.email,
    authorPhoto: u.photoURL || "",
    createdAt: serverTimestamp(),
  });
}

// Convenience: auto-generate invoice number
async function nextInvoiceNumber() {
  const all = await getAll("invoices", "createdAt");
  return `INV-${String(all.length + 1).padStart(4, "0")}`;
}

// ── 7. EXPORT as window.FB ────────────────────────────────────
window.FB = {
  signIn,
  signOut: signOutUser,
  getAll,
  getOne,
  addItem,
  updateItem,
  deleteItem,
  getComments,
  addComment,
  nextInvoiceNumber,
  // expose timestamp helper
  ts: serverTimestamp,
};

// ── TODO helpers ──────────────────────────────────────────────
async function getTodos(projectId) {
  try {
    const ref = collection(db, "workspaces", window._state.workspaceId, "projects", projectId, "todos");
    const q = query(ref, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}
async function addTodo(projectId, text) {
  const ref = collection(db, "workspaces", window._state.workspaceId, "projects", projectId, "todos");
  await addDoc(ref, { text, done: false, createdAt: serverTimestamp() });
}
async function toggleTodo(projectId, todoId, done) {
  const ref = doc(db, "workspaces", window._state.workspaceId, "projects", projectId, "todos", todoId);
  await updateDoc(ref, { done });
}
async function deleteTodo(projectId, todoId) {
  const ref = doc(db, "workspaces", window._state.workspaceId, "projects", projectId, "todos", todoId);
  await deleteDoc(ref);
}

// Patch FB to include todo helpers
Object.assign(window.FB, { getTodos, addTodo, toggleTodo, deleteTodo });