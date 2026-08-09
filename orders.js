/* =========================================================
   ORDERS PAGE
   Firebase-powered order history
========================================================= */

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    db,
    auth
} from "./firebase-config.js";


/* =========================================================
   ELEMENTS
========================================================= */

const ordersList = document.getElementById("ordersList");
const emptyOrders = document.getElementById("emptyOrders");


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (!ordersList || !emptyOrders) {
        console.error(
            "Orders page elements were not found."
        );
        return;
    }

    listenForUser();
});


/* =========================================================
   WAIT FOR FIREBASE AUTH
========================================================= */

function listenForUser() {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            /*
             * No signed-in user.
             *
             * We keep the page looking exactly like
             * the empty design.
             */

            showEmptyOrders();

            return;
        }

        await loadOrders(user.uid);
    });
}


/* =========================================================
   LOAD USER ORDERS
========================================================= */

async function loadOrders(userId) {

    try {

        clearOrders();

        hideEmptyOrders();

        /*
         * Only retrieve orders belonging to
         * the currently logged-in user.
         */

        const ordersRef = collection(db, "orders");

        const ordersQuery = query(
            ordersRef,
            where("userId", "==", userId)
        );

        const snapshot = await getDocs(ordersQuery);


        /* =====================================================
           NO ORDERS
        ===================================================== */

        if (snapshot.empty) {

            showEmptyOrders();

            return;
        }


        /* =====================================================
           CONVERT FIREBASE DOCUMENTS TO ARRAY
        ===================================================== */

        const orders = [];

        snapshot.forEach((documentSnapshot) => {

            const data = documentSnapshot.data();

            orders.push({
                id: documentSnapshot.id,
                ...data
            });
        });


        /* =====================================================
           SORT NEWEST FIRST
        ===================================================== */

        orders.sort((a, b) => {

            const dateA = getDateValue(a.createdAt);
            const dateB = getDateValue(b.createdAt);

            return dateB - dateA;
        });


        /* =====================================================
           DISPLAY ORDERS
        ===================================================== */

        orders.forEach((order) => {

            createOrderCard(order);
        });


        /*
         * Safety check.
         */

        if (orders.length === 0) {

            showEmptyOrders();
        }

    } catch (error) {

        console.error(
            "Unable to load orders:",
            error
        );

        /*
         * Do NOT show the ugly
         * "Unable to load orders"
         * design that was appearing before.
         *
         * Keep the page clean.
         */

        showEmptyOrders();
    }
}


/* =========================================================
   CREATE ORDER CARD
========================================================= */

function createOrderCard(order) {

    const card = document.createElement("div");

    card.className = "order-card";


    /* =====================================================
       PRODUCT NAME
    ===================================================== */

    const productName =
        order.productName ||
        order.product ||
        order.itemName ||
        order.title ||
        "Purchased item";


    /* =====================================================
       STATUS
    ===================================================== */

    const status =
        order.status ||
        "Processing";


    /* =====================================================
       ORDER ID
    ===================================================== */

    const orderId =
        order.orderId ||
        order.reference ||
        order.transactionId ||
        order.id;


    /* =====================================================
       AMOUNT
    ===================================================== */

    const amount =
        order.amount ??
        order.total ??
        order.price ??
        0;


    /* =====================================================
       DATE
    ===================================================== */

    const date =
        formatDate(order.createdAt);


    /* =====================================================
       MAIN CARD
    ===================================================== */

    card.innerHTML = `

        <div class="order-card-top">

            <div class="order-product">
                ${escapeHTML(productName)}
            </div>

            <div class="order-status">
                ${escapeHTML(status)}
            </div>

        </div>


        <div class="order-details">

            <div class="order-detail">

                <strong>Order ID:</strong>

                ${escapeHTML(orderId)}

            </div>


            <div class="order-detail">

                <strong>Amount:</strong>

                ₦${formatAmount(amount)}

            </div>


            ${
                date
                    ? `
                        <div class="order-detail">

                            <strong>Date:</strong>

                            ${escapeHTML(date)}

                        </div>
                    `
                    : ""
            }

        </div>

    `;


    /* =====================================================
       OPTIONAL LOGIN INFORMATION
    ===================================================== */

    const username =
        order.username ||
        order.email ||
        order.loginUsername ||
        "";

    const password =
        order.password ||
        order.loginPassword ||
        "";


    /*
     * Only create the login box if the
     * Firebase order actually contains
     * login information.
     */

    if (username || password) {

        const loginBox =
            document.createElement("div");

        loginBox.className =
            "order-login-box";


        if (username) {

            const usernameRow =
                document.createElement("div");

            usernameRow.innerHTML = `
                <strong>Username:</strong>
                ${escapeHTML(username)}
            `;

            loginBox.appendChild(usernameRow);
        }


        if (password) {

            const passwordRow =
                document.createElement("div");

            passwordRow.innerHTML = `
                <strong>Password:</strong>
                ${escapeHTML(password)}
            `;

            loginBox.appendChild(passwordRow);
        }


        card.appendChild(loginBox);
    }


    /* =====================================================
       ADD TO PAGE
    ===================================================== */

    ordersList.appendChild(card);
}


/* =========================================================
   SHOW EMPTY ORDERS
========================================================= */

function showEmptyOrders() {

    if (!emptyOrders) {
        return;
    }

    emptyOrders.style.display = "block";

    if (ordersList) {
        ordersList.innerHTML = "";
        ordersList.style.display = "none";
    }
}


/* =========================================================
   HIDE EMPTY ORDERS
========================================================= */

function hideEmptyOrders() {

    if (!emptyOrders) {
        return;
    }

    emptyOrders.style.display = "none";

    if (ordersList) {
        ordersList.style.display = "flex";
    }
}


/* =========================================================
   CLEAR ORDERS
========================================================= */

function clearOrders() {

    if (!ordersList) {
        return;
    }

    ordersList.innerHTML = "";
}


/* =========================================================
   GET FIREBASE DATE VALUE
========================================================= */

function getDateValue(timestamp) {

    if (!timestamp) {
        return 0;
    }


    /*
     * Firebase Timestamp
     */

    if (
        typeof timestamp.toDate === "function"
    ) {

        return timestamp.toDate().getTime();
    }


    /*
     * JavaScript Date
     */

    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();
    }


    /*
     * Number timestamp
     */

    if (
        typeof timestamp === "number"
    ) {

        return timestamp;
    }


    /*
     * String date
     */

    const date =
        new Date(timestamp);

    if (
        !Number.isNaN(date.getTime())
    ) {

        return date.getTime();
    }


    return 0;
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(timestamp) {

    const value =
        getDateValue(timestamp);

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================================
   FORMAT MONEY
========================================================= */

function formatAmount(amount) {

    const number =
        Number(amount);


    if (
        Number.isNaN(number)
    ) {

        return "0";
    }


    return number.toLocaleString(
        "en-NG",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


/* =========================================================
   ESCAPE FIREBASE DATA
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
