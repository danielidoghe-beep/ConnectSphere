import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyAKAD0Gxtk4XxMmnR_kpjmy5VLoX72Dtls",
  authDomain: "connectsphere-7a679.firebaseapp.com",
  projectId: "connectsphere-7a679",
  storageBucket: "connectsphere-7a679.firebasestorage.app",
  messagingSenderId: "748741698521",
  appId: "1:748741698521:web:ea08d28f31a4d8638c2fc8",
  measurementId: "G-WRQ5GX3KMZ"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   ELEMENTS
========================================================= */

const walletBalance = document.getElementById("walletBalance");
const amountInput = document.getElementById("amount");

const bankTransferBtn = document.getElementById("bankTransferBtn");
const cardPaymentBtn = document.getElementById("cardPaymentBtn");

const bankTransferForm = document.getElementById("bankTransferForm");
const cardComingSoon = document.getElementById("cardComingSoon");

const payBankBtn = document.getElementById("payBankBtn");

const topupModal = document.getElementById("topupModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const modalAmount = document.getElementById("modalAmount");
const modalReference = document.getElementById("modalReference");

const bankName = document.getElementById("bankName");
const accountNumber = document.getElementById("accountNumber");
const accountName = document.getElementById("accountName");
const transferAmount = document.getElementById("transferAmount");

const copyReferenceBtn = document.getElementById("copyReferenceBtn");
const whatsappBtn = document.getElementById("whatsappBtn");

const transactionsList = document.getElementById("transactionsList");

const notificationBtn = document.getElementById("notificationBtn");
const notificationDropdown =
  document.getElementById("notificationDropdown");

const notificationList =
  document.getElementById("notificationList");

const notificationCount =
  document.getElementById("notificationCount");

const markReadBtn =
  document.getElementById("markReadBtn");

const themeBtn =
  document.getElementById("themeBtn");

const toast =
  document.getElementById("toast");

const profileInitial =
  document.getElementById("profileInitial");

const currencyPill =
  document.querySelector(".currency-pill");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentReference = null;
let currentTransactionId = null;
let currentTransactionAmount = 0;

let unsubscribeTransactions = null;


/* =========================================================
   HELPERS
========================================================= */

function showToast(message) {

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


function formatNaira(value) {

  const number = Number(value || 0);

  return "₦" + number.toLocaleString("en-NG");
}


function formatDate(timestamp) {

  if (!timestamp) {
    return "Just now";
  }

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   PAYMENT SETTINGS
========================================================= */

async function loadPaymentSettings() {

  try {

    const settingsRef =
      doc(db, "settings", "payment");

    const settingsSnap =
      await getDoc(settingsRef);

    if (!settingsSnap.exists()) {

      bankName.textContent = "Not configured";
      accountNumber.textContent = "Not configured";
      accountName.textContent = "Not configured";

      return;
    }

    const data = settingsSnap.data();

    bankName.textContent =
      data.bankName || "Not configured";

    accountNumber.textContent =
      data.accountNumber || "Not configured";

    accountName.textContent =
      data.accountName || "Not configured";

  } catch (error) {

    console.error(
      "Payment settings error:",
      error
    );

    bankName.textContent = "Unavailable";
    accountNumber.textContent = "Unavailable";
    accountName.textContent = "Unavailable";
  }
}


/* =========================================================
   USER WALLET
========================================================= */

async function loadWallet() {

  if (!currentUser) return;

  try {

    const userRef =
      doc(db, "users", currentUser.uid);

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {

      walletBalance.textContent = "₦0";
      currencyPill.textContent = "₦0";

      return;
    }

    const data = userSnap.data();

    const balance =
      Number(data.walletBalance || data.balance || 0);

    walletBalance.textContent =
      formatNaira(balance);

    currencyPill.textContent =
      formatNaira(balance);

    if (data.displayName) {

      profileInitial.textContent =
        data.displayName
          .trim()
          .charAt(0)
          .toUpperCase();

    } else if (data.name) {

      profileInitial.textContent =
        data.name
          .trim()
          .charAt(0)
          .toUpperCase();

    } else if (currentUser.email) {

      profileInitial.textContent =
        currentUser.email
          .charAt(0)
          .toUpperCase();
    }

  } catch (error) {

    console.error(
      "Wallet loading error:",
      error
    );
  }
}


/* =========================================================
   QUICK AMOUNTS
========================================================= */

document
  .querySelectorAll("[data-amount]")
  .forEach(button => {

    button.addEventListener("click", () => {

      const amount =
        Number(button.dataset.amount);

      amountInput.value = amount;

      amountInput.focus();

    });

  });


/* =========================================================
   PAYMENT METHOD SWITCH
========================================================= */

bankTransferBtn.addEventListener("click", () => {

  bankTransferBtn.classList.add("active");
  cardPaymentBtn.classList.remove("active");

  bankTransferForm.style.display = "block";
  cardComingSoon.classList.remove("show");

});


cardPaymentBtn.addEventListener("click", () => {

  cardPaymentBtn.classList.add("active");
  bankTransferBtn.classList.remove("active");

  bankTransferForm.style.display = "none";
  cardComingSoon.classList.add("show");

});


/* =========================================================
   CREATE MANUAL TOP-UP
========================================================= */

async function createTopup() {

  if (!currentUser) {

    showToast("Please sign in first.");

    return;
  }

  const amount =
    Number(amountInput.value);

  if (!amount || amount < 1000) {

    showToast(
      "Minimum top-up amount is ₦1,000."
    );

    amountInput.focus();

    return;
  }


  payBankBtn.disabled = true;

  payBankBtn.textContent =
    "CREATING TOP-UP...";


  try {

    /*
      Firebase creates a unique Firestore
      document ID before the transaction is saved.

      That ID becomes the payment reference.
    */

    const transactionRef =
      doc(
        collection(
          db,
          "users",
          currentUser.uid,
          "transactions"
        )
      );

    const reference =
      transactionRef.id;


    const transactionData = {

      userId: currentUser.uid,

      type: "wallet_topup",

      method: "bank_transfer",

      amount: amount,

      reference: reference,

      status: "pending",

      proofStatus: "not_submitted",

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp()

    };


    await setDoc(
      transactionRef,
      transactionData
    );


    /*
      Also create a notification immediately.
    */

    await addDoc(
      collection(
        db,
        "users",
        currentUser.uid,
        "notifications"
      ),
      {
        type: "wallet_topup",
        title: "Top-up pending",
        message:
          `${formatNaira(amount)} top-up created. Complete your bank transfer and send proof.`,
        transactionId: transactionRef.id,
        reference: reference,
        read: false,
        createdAt: serverTimestamp()
      }
    );


    currentReference = reference;

    currentTransactionId =
      transactionRef.id;

    currentTransactionAmount =
      amount;


    /*
      Show popup.
    */

    modalAmount.textContent =
      formatNaira(amount);

    transferAmount.textContent =
      formatNaira(amount);

    modalReference.textContent =
      reference;

    topupModal.classList.add("show");

    document.body.style.overflow = "hidden";


    showToast(
      "Top-up created. Complete your transfer."
    );


  } catch (error) {

    console.error(
      "Top-up creation error:",
      error
    );

    showToast(
      "Unable to create top-up. Please try again."
    );

  } finally {

    payBankBtn.disabled = false;

    payBankBtn.textContent =
      "PAY WITH BANK TRANSFER";

  }

}


payBankBtn.addEventListener(
  "click",
  createTopup
);


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

  topupModal.classList.remove("show");

  document.body.style.overflow = "";

}


closeModalBtn.addEventListener(
  "click",
  closeModal
);

cancelBtn.addEventListener(
  "click",
  closeModal
);


topupModal.addEventListener(
  "click",
  event => {

    if (
      event.target === topupModal
    ) {
      closeModal();
    }

  }
);


/* =========================================================
   COPY REFERENCE
========================================================= */

copyReferenceBtn.addEventListener(
  "click",
  async () => {

    if (!currentReference) return;

    try {

      await navigator.clipboard.writeText(
        currentReference
      );

      copyReferenceBtn.textContent =
        "Copied";

      setTimeout(() => {

        copyReferenceBtn.textContent =
          "Copy";

      }, 1800);

    } catch (error) {

      console.error(error);

      showToast(
        "Unable to copy reference."
      );

    }

  }
);


/* =========================================================
   WHATSAPP PROOF
========================================================= */

whatsappBtn.addEventListener(
  "click",
  () => {

    if (!currentReference) {

      showToast(
        "No active top-up reference."
      );

      return;
    }


    const message =
      `Hello, I have made a wallet top-up.

Reference: ${currentReference}
Amount: ${formatNaira(currentTransactionAmount)}

I am sending my payment proof for verification.`;

    /*
      Replace the number in Firebase settings
      later if you want a different support number.
      We first try to read it from the payment
      settings document.
    */

    openWhatsApp(message);

  }
);


async function openWhatsApp(message) {

  try {

    const settingsRef =
      doc(db, "settings", "payment");

    const settingsSnap =
      await getDoc(settingsRef);

    let whatsapp =
      "";

    if (settingsSnap.exists()) {

      whatsapp =
        settingsSnap.data().whatsapp || "";

    }


    if (!whatsapp) {

      showToast(
        "WhatsApp contact is not configured."
      );

      return;
    }


    whatsapp =
      whatsapp.replace(/\D/g, "");


    const url =
      `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

  } catch (error) {

    console.error(
      "WhatsApp error:",
      error
    );

    showToast(
      "Unable to open WhatsApp."
    );

  }

}


/* =========================================================
   TRANSACTIONS
========================================================= */

function listenToTransactions() {

  if (!currentUser) return;


  if (unsubscribeTransactions) {
    unsubscribeTransactions();
  }


  const transactionsRef =
    collection(
      db,
      "users",
      currentUser.uid,
      "transactions"
    );


  const transactionsQuery =
    query(
      transactionsRef,
      orderBy("createdAt", "desc"),
      limit(20)
    );


  unsubscribeTransactions =
    onSnapshot(
      transactionsQuery,
      snapshot => {

        if (snapshot.empty) {

          transactionsList.innerHTML = `
            <div class="no-transactions">
              No recent transactions
            </div>
          `;

          return;
        }


        transactionsList.innerHTML = "";


        snapshot.forEach(
          transactionSnapshot => {

            const data =
              transactionSnapshot.data();

            const card =
              createTransactionCard(
                data,
                transactionSnapshot.id
              );

            transactionsList.insertAdjacentHTML(
              "beforeend",
              card
            );

          }
        );

      },

      error => {

        console.error(
          "Transaction listener error:",
          error
        );

        transactionsList.innerHTML = `
          <div class="no-transactions">
            Unable to load transactions.
          </div>
        `;

      }
    );

}


/* =========================================================
   TRANSACTION CARD
========================================================= */

function createTransactionCard(
  data,
  documentId
) {

  const amount =
    formatNaira(data.amount);

  const date =
    formatDate(data.createdAt);

  const status =
    String(data.status || "pending")
      .toLowerCase();

  let statusClass =
    "pending";

  let statusText =
    "Pending";


  if (
    status === "completed" ||
    status === "approved" ||
    status === "success"
  ) {

    statusClass =
      "completed";

    statusText =
      "Completed";

  }


  if (
    status === "failed" ||
    status === "cancelled"
  ) {

    statusClass =
      "failed";

    statusText =
      status === "cancelled"
        ? "Cancelled"
        : "Failed";
  }


  const reference =
    data.reference || documentId;


  return `

    <article class="transaction-card">

      <div class="transaction-top">

        <div class="transaction-icon">
          ₦
        </div>

        <div class="transaction-info">

          <div class="transaction-title">
            Wallet top-up via bank transfer
          </div>

          <div class="transaction-meta">
            ${escapeHTML(reference)}
            · ${escapeHTML(date)}
          </div>

        </div>

      </div>


      <div class="transaction-bottom">

        <div class="transaction-amount">
          ${escapeHTML(amount)}
        </div>

        <span class="status ${statusClass}">
          ${statusText}
        </span>

      </div>

    </article>

  `;
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function listenToNotifications() {

  if (!currentUser) return;


  const notificationsRef =
    collection(
      db,
      "users",
      currentUser.uid,
      "notifications"
    );


  const notificationsQuery =
    query(
      notificationsRef,
      orderBy("createdAt", "desc"),
      limit(10)
    );


  onSnapshot(
    notificationsQuery,
    snapshot => {

      if (snapshot.empty) {

        notificationList.innerHTML = `
          <div class="empty-notifications">
            No notifications
          </div>
        `;

        notificationCount.textContent = "0";

        return;
      }


      let unread = 0;

      notificationList.innerHTML = "";


      snapshot.forEach(
        notificationSnapshot => {

          const data =
            notificationSnapshot.data();


          if (!data.read) {
            unread++;
          }


          const date =
            formatDate(data.createdAt);


          notificationList.insertAdjacentHTML(
            "beforeend",
            `

              <div class="notification-item">

                <h3>
                  ${escapeHTML(
                    data.title || "Notification"
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    data.message || ""
                  )}
                </p>

                <time>
                  ${escapeHTML(date)}
                </time>

              </div>

            `
          );

        }
      );


      notificationCount.textContent =
        unread > 99
          ? "99+"
          : String(unread);

    },

    error => {

      console.error(
        "Notification error:",
        error
      );

    }
  );

}


/* =========================================================
   NOTIFICATION DROPDOWN
========================================================= */

notificationBtn.addEventListener(
  "click",
  event => {

    event.stopPropagation();

    notificationDropdown.classList.toggle(
      "show"
    );

  }
);


document.addEventListener(
  "click",
  event => {

    if (
      !notificationDropdown.contains(event.target) &&
      !notificationBtn.contains(event.target)
    ) {

      notificationDropdown.classList.remove(
        "show"
      );

    }

  }
);


/* =========================================================
   MARK ALL NOTIFICATIONS READ
========================================================= */

markReadBtn.addEventListener(
  "click",
  async () => {

    if (!currentUser) return;


    try {

      const notificationsRef =
        collection(
          db,
          "users",
          currentUser.uid,
          "notifications"
        );


      const snapshot =
        await getDocs(
          query(
            notificationsRef,
            where("read", "==", false)
          )
        );


      const updates = [];


      snapshot.forEach(
        notificationSnapshot => {

          updates.push(
            setDoc(
              notificationSnapshot.ref,
              {
                read: true
              },
              {
                merge: true
              }
            )
          );

        }
      );


      await Promise.all(updates);

      showToast(
        "Notifications marked as read."
      );

    } catch (error) {

      console.error(
        "Mark read error:",
        error
      );

      showToast(
        "Unable to update notifications."
      );

    }

  }
);


/* =========================================================
   THEME
========================================================= */

const savedTheme =
  localStorage.getItem("verifyTheme");


if (savedTheme === "dark") {

  document.body.classList.add("dark");

}


themeBtn.addEventListener(
  "click",
  () => {

    document.body.classList.toggle("dark");

    const dark =
      document.body.classList.contains("dark");

    localStorage.setItem(
      "verifyTheme",
      dark ? "dark" : "light"
    );

  }
);


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      /*
        The login page should normally handle
        redirecting unauthenticated users.
      */

      console.warn(
        "No authenticated Firebase user."
      );

      walletBalance.textContent =
        "₦0";

      transactionsList.innerHTML = `
        <div class="no-transactions">
          Please sign in to view your wallet.
        </div>
      `;

      return;
    }


    currentUser = user;


    await loadWallet();

    await loadPaymentSettings();

    listenToTransactions();

    listenToNotifications();

  }
);
