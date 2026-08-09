/* =========================================================
   FIREBASE
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";



/* =========================================================
   YOUR FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};



/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);



/* =========================================================
   ELEMENTS
========================================================= */

const ordersList =
    document.getElementById("ordersList");

const emptyOrders =
    document.getElementById("emptyOrders");

const ordersLoading =
    document.getElementById("ordersLoading");

const ordersError =
    document.getElementById("ordersError");

const ordersErrorMessage =
    document.getElementById("ordersErrorMessage");

const retryOrdersButton =
    document.getElementById("retryOrdersButton");

const balanceValue =
    document.getElementById("balanceValue");

const notificationCount =
    document.getElementById("notificationCount");

const profileInitial =
    document.getElementById("profileInitial");

const menuUserName =
    document.getElementById("menuUserName");



/* =========================================================
   MENU
========================================================= */

const menuButton =
    document.getElementById("menuButton");

const menuOverlay =
    document.getElementById("menuOverlay");

const sideMenu =
    document.getElementById("sideMenu");

const closeMenuButton =
    document.getElementById("closeMenuButton");


function openMenu() {
    sideMenu.classList.add("open");

    menuOverlay.classList.add("open");
}


function closeMenu() {
    sideMenu.classList.remove("open");

    menuOverlay.classList.remove("open");
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



/* =========================================================
   DARK MODE
========================================================= */

const themeButton =
    document.getElementById("themeButton");


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
            "ordersDarkMode",
            dark ? "1" : "0"
        );
    }
);


if (
    localStorage.getItem(
        "ordersDarkMode"
    ) === "1"
) {
    document.body.classList.add(
        "dark-mode"
    );
}



/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let unsubscribeOrders = null;



/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(value) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return "₦0";
    }

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(number);
}



/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }

    let date;

    if (
        typeof value.toDate === "function"
    ) {
        date = value.toDate();
    }

    else if (
        value instanceof Date
    ) {
        date = value;
    }

    else {
        date = new Date(value);
    }

    if (
        Number.isNaN(date.getTime())
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);
}



/* =========================================================
   GET USER INITIAL
========================================================= */

function getInitial(userData) {

    const name =
        userData?.displayName ||
        userData?.name ||
        userData?.fullName ||
        "";

    if (name.trim()) {
        return name.trim().charAt(0).toUpperCase();
    }

    if (userData?.email) {
        return userData.email
            .charAt(0)
            .toUpperCase();
    }

    return "?";
}



/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile(user) {

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const snapshot =
            await getDoc(userRef);


        let data = {};

        if (snapshot.exists()) {
            data = snapshot.data();
        }


        const displayName =
            data.displayName ||
            data.name ||
            data.fullName ||
            user.displayName ||
            user.email ||
            "";


        profileInitial.textContent =
            getInitial({
                ...data,
                displayName
            });


        menuUserName.textContent =
            displayName || "Account";


        /*
         * Wallet/balance comes from Firebase.
         *
         * Supported examples:
         *
         * users/{uid}
         * {
         *     balance: 5000
         * }
         *
         * OR
         *
         * users/{uid}
         * {
         *     walletBalance: 5000
         * }
         */

        const balance =
            data.balance ??
            data.walletBalance ??
            data.wallet_balance ??
            0;


        balanceValue.textContent =
            formatMoney(balance);



    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        /*
         * We don't invent user information.
         * If Firebase profile data cannot be read,
         * the UI stays safely neutral.
         */

        profileInitial.textContent = "?";

        balanceValue.textContent = "₦0";
    }
}



/* =========================================================
   LOAD NOTIFICATIONS
========================================================= */

async function loadNotifications(user) {

    try {

        /*
         * Notifications are expected to be stored like:
         *
         * notifications
         *     document
         *         userId
         *         read
         *
         * Only unread notifications belonging
         * to the current user are counted.
         */

        const notificationsRef =
            collection(
                db,
                "notifications"
            );


        const notificationsQuery =
            query(
                notificationsRef,
                where(
                    "userId",
                    "==",
                    user.uid
                ),
                where(
                    "read",
                    "==",
                    false
                )
            );


        const snapshot =
            await getDocs(
                notificationsQuery
            );


        notificationCount.textContent =
            String(snapshot.size);



    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );

        /*
         * No fake notification number.
         * If the collection is unavailable,
         * show zero.
         */

        notificationCount.textContent = "0";
    }
}



/* =========================================================
   CLEAR ORDERS UI
========================================================= */

function clearOrdersUI() {

    ordersList.innerHTML = "";

    emptyOrders.hidden = true;

    ordersError.hidden = true;

}



/* =========================================================
   SHOW EMPTY STATE
========================================================= */

function showEmptyOrders() {

    ordersLoading.style.display =
        "none";

    ordersList.innerHTML = "";

    ordersError.hidden = true;

    emptyOrders.hidden = false;
}



/* =========================================================
   SHOW ERROR
========================================================= */

function showOrdersError(message) {

    ordersLoading.style.display =
        "none";

    emptyOrders.hidden = true;

    ordersError.hidden = false;

    ordersErrorMessage.textContent =
        message;
}



/* =========================================================
   SHOW LOADING
========================================================= */

function showOrdersLoading() {

    ordersLoading.style.display =
        "block";

    emptyOrders.hidden = true;

    ordersError.hidden = true;
}



/* =========================================================
   CREATE ORDER CARD
========================================================= */

function createOrderCard(
    order
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "order-card";


    const top =
        document.createElement(
            "div"
        );

    top.className =
        "order-card-top";


    const product =
        document.createElement(
            "h3"
        );

    product.className =
        "order-product";


    /*
     * We don't invent a product name.
     *
     * The page supports common Firebase field names.
     */

    product.textContent =
        order.productName ||
        order.product ||
        order.itemName ||
        order.title ||
        order.name ||
        "Order";


    const status =
        document.createElement(
            "span"
        );

    status.className =
        "order-status";


    status.textContent =
        order.status ||
        "pending";


    top.appendChild(product);

    top.appendChild(status);



    const details =
        document.createElement(
            "div"
        );

    details.className =
        "order-details";


    /*
     * Order ID
     */

    if (order.orderId) {

        details.appendChild(
            createDetail(
                "Order ID",
                order.orderId
            )
        );
    }



    /*
     * Amount
     */

    if (
        order.amount !== undefined &&
        order.amount !== null
    ) {

        details.appendChild(
            createDetail(
                "Amount",
                formatMoney(
                    order.amount
                )
            )
        );
    }



    /*
     * Quantity
     */

    if (
        order.quantity !== undefined &&
        order.quantity !== null
    ) {

        details.appendChild(
            createDetail(
                "Quantity",
                order.quantity
            )
        );
    }



    /*
     * Date
     */

    const dateValue =
        order.createdAt ||
        order.created_at ||
        order.date ||
        order.timestamp;


    const formattedDate =
        formatDate(
            dateValue
        );


    if (formattedDate) {

        details.appendChild(
            createDetail(
                "Date",
                formattedDate
            )
        );
    }



    card.appendChild(top);

    card.appendChild(details);


    return card;
}



/* =========================================================
   DETAIL HELPER
========================================================= */

function createDetail(
    label,
    value
) {

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "order-detail";


    const strong =
        document.createElement(
            "strong"
        );

    strong.textContent =
        `${label}: `;


    const text =
        document.createElement(
            "span"
        );

    text.textContent =
        String(value);


    row.appendChild(strong);

    row.appendChild(text);


    return row;
}



/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders(
    documents
) {

    ordersLoading.style.display =
        "none";

    ordersError.hidden = true;


    if (
        documents.length === 0
    ) {

        showEmptyOrders();

        return;
    }


    emptyOrders.hidden = true;

    ordersList.innerHTML = "";


    documents.forEach(
        item => {

            const order =
                item.data();


            /*
             * Keep the Firebase document ID
             * available to the page.
             */

            order.orderId =
                order.orderId ||
                item.id;


            const card =
                createOrderCard(
                    order
                );


            ordersList.appendChild(
                card
            );
        }
    );
}



/* =========================================================
   LOAD ORDERS
========================================================= */

function loadOrders(user) {

    if (unsubscribeOrders) {

        unsubscribeOrders();

        unsubscribeOrders = null;
    }


    showOrdersLoading();


    /*
     * Firebase collection:
     *
     * orders
     *
     * Each order belongs to a user through:
     *
     * userId: Firebase Auth UID
     *
     * Example:
     *
     * orders
     *    document
     *       userId
     *       productName
     *       amount
     *       status
     *       quantity
     *       createdAt
     */


    const ordersRef =
        collection(
            db,
            "orders"
        );


    const userOrdersQuery =
        query(
            ordersRef,

            where(
                "userId",
                "==",
                user.uid
            ),

            orderBy(
                "createdAt",
                "desc"
            )
        );


    unsubscribeOrders =
        onSnapshot(
            userOrdersQuery,

            snapshot => {

                renderOrders(
                    snapshot.docs
                );
            },

            error => {

                console.error(
                    "Orders error:",
                    error
                );


                showOrdersError(
                    "Please sign in to view your orders."
                );
            }
        );
}



/* =========================================================
   RETRY
========================================================= */

retryOrdersButton.addEventListener(
    "click",
    () => {

        if (currentUser) {

            loadOrders(
                currentUser
            );

            loadProfile(
                currentUser
            );

            loadNotifications(
                currentUser
            );
        }
    }
);



/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        currentUser =
            user;


        if (!user) {

            showOrdersError(
                "Please sign in to view your orders."
            );

            return;
        }


        /*
         * Everything below is tied
         * to the currently authenticated
         * Firebase user.
         */

        await loadProfile(
            user
        );


        await loadNotifications(
            user
        );


        loadOrders(
            user
        );
    }
);
