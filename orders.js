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
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================
   FIREBASE CONFIG
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

const ordersLoading =
    document.getElementById("ordersLoading");

const emptyOrders =
    document.getElementById("emptyOrders");

const ordersList =
    document.getElementById("ordersList");

const ordersMessage =
    document.getElementById("ordersMessage");

const ordersMessageText =
    document.getElementById("ordersMessageText");

const refreshOrdersButton =
    document.getElementById("refreshOrdersButton");

const retryOrdersButton =
    document.getElementById("retryOrdersButton");

const headerBalance =
    document.getElementById("headerBalance");

const profileLetter =
    document.getElementById("profileLetter");

const themeButton =
    document.getElementById("themeButton");

const menuButton =
    document.getElementById("menuButton");

const menuOverlay =
    document.getElementById("menuOverlay");

const sideMenu =
    document.getElementById("sideMenu");

const closeMenuButton =
    document.getElementById("closeMenuButton");


/* =========================================
   STATE
========================================= */

let currentUser = null;


/* =========================================
   UI HELPERS
========================================= */

function showLoading() {

    ordersLoading.hidden = false;

    emptyOrders.hidden = true;

    ordersList.innerHTML = "";

    ordersMessage.hidden = true;
}


function showEmpty() {

    ordersLoading.hidden = true;

    emptyOrders.hidden = false;

    ordersList.innerHTML = "";

    ordersMessage.hidden = true;
}


function showOrders() {

    ordersLoading.hidden = true;

    emptyOrders.hidden = true;

    ordersMessage.hidden = true;
}


function showMessage(message) {

    ordersLoading.hidden = true;

    emptyOrders.hidden = true;

    ordersList.innerHTML = "";

    ordersMessageText.textContent = message;

    ordersMessage.hidden = false;
}


/* =========================================
   FORMAT MONEY
========================================= */

function formatNaira(value) {

    const amount = Number(value || 0);

    return "₦" + amount.toLocaleString("en-NG");
}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }

    try {

        let date;

        if (
            value &&
            typeof value.toDate === "function"
        ) {
            date = value.toDate();
        } else if (
            value instanceof Date
        ) {
            date = value;
        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString("en-NG", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    } catch {
        return "";
    }
}


/* =========================================
   LOAD USER ORDERS
========================================= */

async function loadOrders() {

    if (!currentUser) {
        return;
    }

    showLoading();

    try {

        /*
         * Orders are linked to the signed-in
         * Firebase user through userId.
         */

        const ordersRef =
            collection(db, "orders");

        const ordersQuery =
            query(
                ordersRef,
                where(
                    "userId",
                    "==",
                    currentUser.uid
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(ordersQuery);

        if (snapshot.empty) {

            showEmpty();

            return;
        }

        ordersList.innerHTML = "";

        snapshot.forEach((documentSnapshot) => {

            const order =
                documentSnapshot.data();

            renderOrder(
                documentSnapshot.id,
                order
            );

        });

        showOrders();

    } catch (error) {

        console.error(
            "Unable to load orders:",
            error
        );

        /*
         * If the Firestore query needs an index,
         * retry without orderBy so the user's
         * orders can still be displayed.
         */

        try {

            const ordersRef =
                collection(db, "orders");

            const fallbackQuery =
                query(
                    ordersRef,
                    where(
                        "userId",
                        "==",
                        currentUser.uid
                    )
                );

            const snapshot =
                await getDocs(fallbackQuery);

            if (snapshot.empty) {

                showEmpty();

                return;
            }

            const orders = [];

            snapshot.forEach((documentSnapshot) => {

                orders.push({
                    id: documentSnapshot.id,
                    data: documentSnapshot.data()
                });

            });

            orders.sort((a, b) => {

                const first =
                    getTimeValue(a.data.createdAt);

                const second =
                    getTimeValue(b.data.createdAt);

                return second - first;

            });

            ordersList.innerHTML = "";

            orders.forEach((order) => {

                renderOrder(
                    order.id,
                    order.data
                );

            });

            showOrders();

        } catch (fallbackError) {

            console.error(
                "Fallback order loading failed:",
                fallbackError
            );

            showMessage(
                "We could not load your orders right now."
            );
        }
    }
}


/* =========================================
   DATE SORT VALUE
========================================= */

function getTimeValue(value) {

    try {

        if (
            value &&
            typeof value.toDate === "function"
        ) {
            return value.toDate().getTime();
        }

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? 0
            : date.getTime();

    } catch {

        return 0;
    }
}


/* =========================================
   RENDER ORDER
========================================= */

function renderOrder(
    orderId,
    order
) {

    const card =
        document.createElement("article");

    card.className = "order-card";


    const top =
        document.createElement("div");

    top.className = "order-card-top";


    const title =
        document.createElement("h3");

    title.className = "order-title";

    title.textContent =
        order.productName ||
        order.product ||
        order.name ||
        "Purchase";


    const status =
        document.createElement("span");

    status.className = "order-status";

    status.textContent =
        order.status ||
        "Completed";


    top.appendChild(title);

    top.appendChild(status);


    const details =
        document.createElement("div");

    details.className = "order-details";


    const orderNumber =
        document.createElement("div");

    orderNumber.textContent =
        "Order ID: " +
        order.orderId ||
        "Order ID: " + orderId;


    details.appendChild(orderNumber);


    if (order.createdAt) {

        const date =
            document.createElement("div");

        date.textContent =
            formatDate(order.createdAt);

        details.appendChild(date);
    }


    if (order.description) {

        const description =
            document.createElement("div");

        description.textContent =
            order.description;

        details.appendChild(description);
    }


    const price =
        document.createElement("div");

    price.className = "order-price";

    price.textContent =
        formatNaira(
            order.amount ||
            order.price ||
            order.total
        );


    card.appendChild(top);

    card.appendChild(details);

    card.appendChild(price);

    ordersList.appendChild(card);
}


/* =========================================
   AUTHENTICATION
========================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            currentUser = null;

            showMessage(
                "Please sign in to view your orders."
            );

            return;
        }

        currentUser = user;


        /* Profile initial */

        const name =
            user.displayName ||
            user.email ||
            "D";

        profileLetter.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();


        /* Load orders */

        await loadOrders();
    }
);


/* =========================================
   REFRESH
========================================= */

refreshOrdersButton.addEventListener(
    "click",
    async () => {

        if (currentUser) {

            await loadOrders();

        }
    }
);


retryOrdersButton.addEventListener(
    "click",
    async () => {

        if (currentUser) {

            await loadOrders();

        }
    }
);


/* =========================================
   DARK MODE
========================================= */

const savedTheme =
    localStorage.getItem("orders-theme");

if (savedTheme === "dark") {

    document.body.classList.add(
        "dark-mode"
    );
}


themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-mode"
        );

        const dark =
            document.body.classList.contains(
                "dark-mode"
            );

        localStorage.setItem(
            "orders-theme",
            dark ? "dark" : "light"
        );
    }
);


/* =========================================
   SIDE MENU
========================================= */

function openMenu() {

    sideMenu.classList.add("open");

    menuOverlay.classList.add("open");

    document.body.style.overflow = "hidden";
}


function closeMenu() {

    sideMenu.classList.remove("open");

    menuOverlay.classList.remove("open");

    document.body.style.overflow = "";
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
   PROFILE BUTTON
========================================= */

const profileButton =
    document.getElementById(
        "profileButton"
    );

profileButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "profile.html";
    }
);
