/* =========================================
   FIREBASE IMPORTS
========================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================
   FIREBASE CONFIGURATION
========================================= */

const firebaseConfig = {
    apiKey: "AIzaSyAKAD0Gxtk4XxMmnR_kpjmy5VLoX72Dtls",
    authDomain: "connectsphere-7a679.firebaseapp.com",
    projectId: "connectsphere-7a679",
    storageBucket: "connectsphere-7a679.firebasestorage.app",
    messagingSenderId: "748741698521",
    appId: "1:748741698521:web:ea08d28f31a4d8638c2fc8",
    measurementId: "G-WRQ5GX3KMZ"
};


/* =========================================
   INITIALIZE FIREBASE
========================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================
   ELEMENTS
========================================= */

const ordersList =
    document.getElementById("ordersList");

const emptyOrders =
    document.getElementById("emptyOrders");

const walletBalance =
    document.getElementById("walletBalance");

const profileInitial =
    document.getElementById("profileInitial");

const darkModeButton =
    document.getElementById("darkModeButton");

const menuButton =
    document.getElementById("menuButton");

const closeMenuButton =
    document.getElementById("closeMenuButton");

const menuOverlay =
    document.getElementById("menuOverlay");

const sideMenu =
    document.getElementById("sideMenu");

const orderModalBackdrop =
    document.getElementById("orderModalBackdrop");

const closeOrderModal =
    document.getElementById("closeOrderModal");

const orderModalContent =
    document.getElementById("orderModalContent");


/* =========================================
   DARK MODE
========================================= */

const savedTheme =
    localStorage.getItem("ordersTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

darkModeButton.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");

    localStorage.setItem(
        "ordersTheme",
        document.body.classList.contains("dark-mode")
            ? "dark"
            : "light"
    );
});


/* =========================================
   SIDE MENU
========================================= */

function openMenu() {

    sideMenu.classList.add("open");

    menuOverlay.classList.add("open");

    sideMenu.setAttribute(
        "aria-hidden",
        "false"
    );
}

function closeMenu() {

    sideMenu.classList.remove("open");

    menuOverlay.classList.remove("open");

    sideMenu.setAttribute(
        "aria-hidden",
        "true"
    );
}

menuButton.addEventListener(
    "click",
    openMenu
);

closeMenuButton.addEventListener(
    "click",
    closeMenu
);

menuOverlay.addEventListener(
    "click",
    closeMenu
);


/* =========================================
   PROFILE
========================================= */

function getInitial(user) {

    if (!user) {
        return "D";
    }

    const name =
        user.displayName ||
        user.email ||
        "D";

    return name
        .trim()
        .charAt(0)
        .toUpperCase() || "D";
}


/* =========================================
   FORMAT NAIRA
========================================= */

function formatNaira(value) {

    const amount =
        Number(value) || 0;

    return "₦" +
        amount.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );
}


/* =========================================
   DATE FORMAT
========================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }

    let date;

    if (
        value &&
        typeof value.toDate === "function"
    ) {
        date = value.toDate();
    }

    else if (
        value instanceof Date
    ) {
        date = value;
    }

    else if (
        typeof value === "number"
    ) {
        date = new Date(value);
    }

    else if (
        typeof value === "string"
    ) {
        date = new Date(value);
    }

    else {
        return "";
    }

    if (
        Number.isNaN(date.getTime())
    ) {
        return "";
    }

    return date.toLocaleString(
        "en-NG",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   LOAD USER PROFILE
========================================= */

async function loadUserProfile(user) {

    if (!user) {
        return;
    }

    profileInitial.textContent =
        getInitial(user);

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {
            return;
        }

        const data =
            userSnap.data();

        /*
         * Supports common balance field names
         * without requiring another edit.
         */

        const balance =
            data.balance ??
            data.walletBalance ??
            data.wallet ??
            0;

        walletBalance.textContent =
            formatNaira(balance);

    } catch (error) {

        /*
         * If the profile cannot be read,
         * the visual design remains exactly
         * as the screenshot.
         */

        walletBalance.textContent = "₦0";
    }
}


/* =========================================
   CLEAR CURRENT ORDERS
========================================= */

function clearOrders() {

    const cards =
        ordersList.querySelectorAll(
            ".order-card"
        );

    cards.forEach(card => {
        card.remove();
    });
}


/* =========================================
   SHOW EMPTY STATE
========================================= */

function showEmptyState() {

    clearOrders();

    emptyOrders.style.display =
        "flex";
}


/* =========================================
   RENDER ORDERS
========================================= */

function renderOrders(orders) {

    clearOrders();

    if (!orders.length) {

        emptyOrders.style.display =
            "flex";

        return;
    }

    emptyOrders.style.display =
        "none";


    orders.forEach(order => {

        const data =
            order.data;

        const card =
            document.createElement("article");

        card.className =
            "order-card";

        const productName =
            data.productName ||
            data.product ||
            data.itemName ||
            data.name ||
            "Purchase";

        const amount =
            data.amount ??
            data.price ??
            data.total ??
            0;

        const status =
            data.status ||
            "Completed";

        const createdAt =
            data.createdAt ||
            data.timestamp ||
            data.date ||
            null;

        const reference =
            data.reference ||
            data.orderId ||
            order.id;

        card.innerHTML = `

            <div class="order-card-header">

                <h3 class="order-name">
                    ${escapeHtml(productName)}
                </h3>

                <span class="order-status">
                    ${escapeHtml(status)}
                </span>

            </div>

            <div class="order-info">

                Reference:
                ${escapeHtml(reference)}

                ${
                    createdAt
                        ? `<br>${escapeHtml(
                            formatDate(createdAt)
                        )}`
                        : ""
                }

            </div>

            <div class="order-amount">
                ${formatNaira(amount)}
            </div>

        `;

        card.addEventListener(
            "click",
            () => openOrderDetails(
                data,
                order.id
            )
        );

        ordersList.appendChild(card);
    });
}


/* =========================================
   OPEN ORDER DETAILS
========================================= */

function openOrderDetails(
    data,
    documentId
) {

    const rows = [];

    const ignoredFields = new Set([
        "userId",
        "uid"
    ]);

    Object.entries(data).forEach(
        ([key, value]) => {

            if (
                ignoredFields.has(key) ||
                value === undefined ||
                value === null
            ) {
                return;
            }

            let displayValue = value;

            if (
                value &&
                typeof value.toDate === "function"
            ) {
                displayValue =
                    formatDate(value);
            }

            else if (
                typeof value === "object"
            ) {
                try {
                    displayValue =
                        JSON.stringify(value);
                } catch {
                    displayValue =
                        String(value);
                }
            }

            rows.push(`
                <div class="order-detail-row">

                    <div class="order-detail-label">
                        ${escapeHtml(key)}
                    </div>

                    <div class="order-detail-value">
                        ${escapeHtml(displayValue)}
                    </div>

                </div>
            `);
        }
    );

    rows.push(`
        <div class="order-detail-row">

            <div class="order-detail-label">
                Order document
            </div>

            <div class="order-detail-value">
                ${escapeHtml(documentId)}
            </div>

        </div>
    `);

    orderModalContent.innerHTML =
        rows.join("");

    orderModalBackdrop.classList.add(
        "open"
    );

    orderModalBackdrop.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================
   CLOSE ORDER MODAL
========================================= */

function closeOrderDetails() {

    orderModalBackdrop.classList.remove(
        "open"
    );

    orderModalBackdrop.setAttribute(
        "aria-hidden",
        "true"
    );
}

closeOrderModal.addEventListener(
    "click",
    closeOrderDetails
);

orderModalBackdrop.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            orderModalBackdrop
        ) {
            closeOrderDetails();
        }
    }
);


/* =========================================
   LISTEN TO USER ORDERS
========================================= */

let unsubscribeOrders = null;

function listenForOrders(user) {

    if (unsubscribeOrders) {
        unsubscribeOrders();
        unsubscribeOrders = null;
    }

    if (!user) {

        showEmptyState();

        return;
    }


    /*
     * Orders are expected in:
     *
     * orders/{orderDocument}
     *
     * with:
     *
     * userId: signed-in user's UID
     *
     * The purchase system should create the
     * order using the same UID.
     */

    const ordersRef =
        collection(
            db,
            "orders"
        );

    const ordersQuery =
        query(
            ordersRef,
            where(
                "userId",
                "==",
                user.uid
            )
        );


    unsubscribeOrders =
        onSnapshot(
            ordersQuery,

            snapshot => {

                const orders =
                    snapshot.docs.map(
                        orderDoc => ({
                            id: orderDoc.id,
                            data: orderDoc.data()
                        })
                    );

                orders.sort(
                    (a, b) => {

                        const aTime =
                            getTimestamp(
                                a.data
                            );

                        const bTime =
                            getTimestamp(
                                b.data
                            );

                        return bTime - aTime;
                    }
                );

                renderOrders(orders);
            },

            error => {

                /*
                 * Do NOT show the ugly
                 * "Unable to load orders"
                 * design from the previous version.
                 *
                 * If there is no readable order,
                 * keep the exact empty-state design.
                 */

                console.error(
                    "Orders listener error:",
                    error
                );

                showEmptyState();
            }
        );
}


/* =========================================
   GET ORDER TIMESTAMP
========================================= */

function getTimestamp(data) {

    const value =
        data.createdAt ||
        data.timestamp ||
        data.date;

    if (!value) {
        return 0;
    }

    if (
        value &&
        typeof value.toMillis === "function"
    ) {
        return value.toMillis();
    }

    if (
        value &&
        typeof value.toDate === "function"
    ) {
        return value.toDate().getTime();
    }

    if (
        typeof value === "number"
    ) {
        return value;
    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();
}


/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (user) {

            profileInitial.textContent =
                getInitial(user);

            await loadUserProfile(user);

            listenForOrders(user);

        } else {

            profileInitial.textContent =
                "D";

            walletBalance.textContent =
                "₦0";

            showEmptyState();
        }
    }
);


/* =========================================
   CLEANUP
========================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (unsubscribeOrders) {
            unsubscribeOrders();
        }
    }
);
