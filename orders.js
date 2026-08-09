// ============================================================
//  ORDERS PAGE LOGIC
//  Every order (product details, delivered secret credits,
//  price, date/time, status) is read from Firebase.
//  Nothing is hardcoded — edit only the CONFIG block below.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ================= CONFIG (EDIT THIS) ========================

// Your Firebase project config (same project as the wallet page)
const firebaseConfig = {
  apiKey: "AIzaSyAKAD0Gxtk4XxMmnR_kpjmy5VLoX72Dtls",
  authDomain: "connectsphere-7a679.firebaseapp.com",
  projectId: "connectsphere-7a679",
  storageBucket: "connectsphere-7a679.appspot.com",
  messagingSenderId: "748741698521",
  appId: "1:748741698521:web:ea08d28f31a4d8638c2fc8",
};

// =============================================================

const $ = (id) => document.getElementById(id);

const orderList = $("orderList");
const userAvatar = $("userAvatar");
const copyToast = $("copyToast");

// ---- Helpers ----
const formatNaira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

// Escape any text that comes from the database before inserting as HTML
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(createdAt) {
  if (createdAt && createdAt.toDate) {
    return createdAt.toDate().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return "";
}

let toastTimer = null;
function showCopyToast() {
  copyToast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => copyToast.classList.remove("show"), 1500);
}

// ============================================================
//  FIREBASE
// ============================================================
let db = null;

function firebaseReady() {
  return firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
}

function initFirebase() {
  if (!firebaseReady()) {
    console.log("[v0] Firebase not configured yet — fill firebaseConfig in orders.js.");
    return;
  }
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  const auth = getAuth(app);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (user.displayName) userAvatar.textContent = user.displayName.charAt(0).toUpperCase();
      else if (user.email) userAvatar.textContent = user.email.charAt(0).toUpperCase();
      listenToOrders(user.uid);
    } else {
      console.log("[v0] No signed-in user. Orders require auth.");
    }
  });
}

// Live orders for this user
function listenToOrders(uid) {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  onSnapshot(q, (snap) => {
    if (snap.empty) {
      renderEmpty();
      return;
    }
    orderList.innerHTML = "";
    snap.forEach((docSnap) => renderOrder(docSnap.id, docSnap.data()));
  }, (err) => {
    console.log("[v0] Failed to load orders:", err);
  });
}

function renderEmpty() {
  orderList.innerHTML = `
    <div class="empty-order">
      <p class="empty-title">No orders yet</p>
      <p class="empty-sub">You have not made any purchases yet.</p>
    </div>`;
}

// Render a single order card
function renderOrder(id, o) {
  const status = (o.status || "completed").toLowerCase();
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const date = formatDate(o.createdAt);
  const reference = o.reference || o.orderId || id;

  // Secret credits delivered with the product. Stored in Firebase as a single
  // value — supports order.credits, order.secretCredits, or credentials.credits.
  const creds = o.credentials || o.account || {};
  const secretCredits =
    o.credits || o.secretCredits || creds.credits || creds.secret || "";
  const extra = creds.note || o.deliveryNote || "";

  // Build the delivery section
  let credsHtml = "";
  const delivered = status === "completed" || status === "delivered" || !!secretCredits;

  if (delivered && (secretCredits || extra)) {
    const rows = [];
    if (secretCredits) {
      rows.push(`
        <div class="cred-row">
          <span class="cred-label">Secret credits</span>
          <div class="cred-value-wrap">
            <span class="cred-value masked" data-real="${esc(secretCredits)}" data-shown="false">••••••••</span>
            <button class="cred-btn" data-reveal aria-label="Show secret credits">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            </button>
            <button class="cred-btn green" data-copy="${esc(secretCredits)}" aria-label="Copy secret credits">
              <svg viewBox="0 0 24 24" width="18" height="18"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15V5a2 2 0 012-2h10" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            </button>
          </div>
        </div>`);
    }
    if (extra) {
      rows.push(`
        <div class="cred-row">
          <span class="cred-label">Note</span>
          <div class="cred-value-wrap">
            <span class="cred-value">${esc(extra)}</span>
          </div>
        </div>`);
    }

    credsHtml = `
      <div class="creds">
        <p class="creds-title">
          <svg viewBox="0 0 24 24" width="16" height="16"><rect x="4" y="10" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          Secret credits
        </p>
        ${rows.join("")}
        <p class="creds-note">Keep your secret credits private. Do not share them with anyone.</p>
      </div>`;
  } else {
    credsHtml = `
      <p class="creds-pending">Your secret credits will appear here once the order is confirmed.</p>`;
  }

  const item = document.createElement("div");
  item.className = "order-item";
  item.innerHTML = `
    <div class="order-top">
      <span class="order-thumb">
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 2l1.5 3h9L18 2M3 7h18l-1.5 12.5A2 2 0 0117.5 21h-11A2 2 0 014.5 19.5L3 7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
      </span>
      <div class="order-info">
        <p class="order-title">${esc(o.productName || o.title || "Product")}</p>
        <p class="order-desc">${esc(o.productDescription || o.description || "")}</p>
      </div>
      <span class="order-price">${formatNaira(o.amount || o.price)}</span>
    </div>

    <div class="order-meta-row">
      <p class="order-meta">${esc(reference)}${date ? " · " + esc(date) : ""}</p>
      <span class="status ${status}">${esc(statusLabel)}</span>
    </div>

    ${credsHtml}
  `;
  orderList.appendChild(item);

  // Reveal / hide secret credits
  item.querySelectorAll("[data-reveal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.parentElement.querySelector(".cred-value");
      const shown = val.dataset.shown === "true";
      if (shown) {
        val.textContent = "••••••••";
        val.classList.add("masked");
        val.dataset.shown = "false";
      } else {
        val.textContent = val.dataset.real;
        val.classList.remove("masked");
        val.dataset.shown = "true";
      }
    });
  });

  // Copy buttons
  item.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showCopyToast();
      } catch (e) {
        console.log("[v0] copy failed:", e);
      }
    });
  });
}

// ---- Theme toggle ----
$("themeBtn").addEventListener("click", () => {
  const html = document.documentElement;
  html.classList.toggle("theme-dark");
  html.classList.toggle("theme-light");
});

// ---- Boot ----
initFirebase();
