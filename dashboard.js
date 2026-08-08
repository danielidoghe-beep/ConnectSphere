/* =========================================================
   Connectsphere — DASHBOARD JAVASCRIPT
   COMPLETE FIREBASE VERSION
========================================================= */


/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAnalytics
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    updateDoc,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIGURATION
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


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

let analytics = null;

try {
    analytics = getAnalytics(app);
} catch (error) {
    console.warn("Firebase Analytics unavailable:", error);
}

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let notificationUnsubscribe = null;
let userUnsubscribe = null;

let toastTimer = null;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   ELEMENTS
========================================================= */

const menuButton = $("menuButton");
const closeMenuButton = $("closeMenuButton");
const menuOverlay = $("menuOverlay");
const sideMenu = $("sideMenu");

const notificationButton = $("notificationButton");
const notificationDropdown = $("notificationDropdown");
const notificationList = $("notificationList");
const notificationBadge = $("notificationBadge");
const markAllReadButton = $("markAllReadButton");

const themeButton = $("themeButton");

const profileButton = $("profileButton");
const profileInitial = $("profileInitial");

const logoutButton = $("logoutButton");

const welcomeMessage = $("welcomeMessage");

const headerWalletBalance = $("headerWalletBalance");
const walletBalance = $("walletBalance");

const totalPurchases = $("totalPurchases");

const inventoryTotal = $("inventoryTotal");
const inventoryBreakdown = $("inventoryBreakdown");

const recentOrders = $("recentOrders");

const whatsappLink = $("whatsappLink");
const telegramLink = $("telegramLink");
const supportEmail = $("supportEmail");

const firebaseToast = $("firebaseToast");
const toastIcon = $("toastIcon");
const toastTitle = $("toastTitle");
const toastMessage = $("toastMessage");
const toastClose = $("toastClose");


/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatCurrency(value) {

    const number = Number(value || 0);

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    }).format(number);
}


function formatNumber(value) {

    const number = Number(value || 0);

    return new Intl.NumberFormat("en-NG").format(number);
}


function getFirstName(userData, user) {

    const possibleNames = [
        userData?.firstName,
        userData?.firstname,
        userData?.first_name,
        userData?.name,
        userData?.displayName,
        user?.displayName
    ];

    for (const name of possibleNames) {

        if (
            typeof name === "string" &&
            name.trim().length > 0
        ) {

            return name.trim().split(" ")[0];
        }
    }

    if (user?.email) {
        return user.email.split("@")[0];
    }

    return "there";
}


function getInitial(userData, user) {

    const name = getFirstName(userData, user);

    return name
        .charAt(0)
        .toUpperCase() || "U";
}


function timestampToDate(timestamp) {

    if (!timestamp) {
        return null;
    }

    if (
        typeof timestamp.toDate === "function"
    ) {
        return timestamp.toDate();
    }

    if (timestamp instanceof Date) {
        return timestamp;
    }

    if (typeof timestamp === "number") {
        return new Date(timestamp);
    }

    if (typeof timestamp === "string") {

        const date = new Date(timestamp);

        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
}


function formatDate(timestamp) {

    const date = timestampToDate(timestamp);

    if (!date) {
        return "";
    }

    return new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}


/* =========================================================
   FIREBASE TOAST
========================================================= */

function showToast(
    title,
    message,
    type = "success"
) {

    if (!firebaseToast) {
        return;
    }

    clearTimeout(toastTimer);

    toastTitle.textContent = title;
    toastMessage.textContent = message;

    firebaseToast.classList.remove("error");

    if (type === "error") {

        firebaseToast.classList.add("error");

        toastIcon.innerHTML = `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M6 6l12 12"></path>
                <path d="M18 6L6 18"></path>
            </svg>
        `;

    } else {

        toastIcon.innerHTML = `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M20 6 9 17l-5-5"></path>
            </svg>
        `;
    }

    firebaseToast.setAttribute(
        "aria-hidden",
        "false"
    );

    firebaseToast.classList.add("show");

    toastTimer = setTimeout(() => {

        hideToast();

    }, 5000);
}


function hideToast() {

    if (!firebaseToast) {
        return;
    }

    firebaseToast.classList.remove("show");

    firebaseToast.setAttribute(
        "aria-hidden",
        "true"
    );
}


if (toastClose) {

    toastClose.addEventListener(
        "click",
        hideToast
    );
}


/* =========================================================
   SIDE MENU
========================================================= */

function openMenu() {

    sideMenu?.classList.add("open");
    menuOverlay?.classList.add("open");

    sideMenu?.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";
}


function closeMenu() {

    sideMenu?.classList.remove("open");
    menuOverlay?.classList.remove("open");

    sideMenu?.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";
}


menuButton?.addEventListener(
    "click",
    openMenu
);


closeMenuButton?.addEventListener(
    "click",
    closeMenu
);


menuOverlay?.addEventListener(
    "click",
    closeMenu
);


/* =========================================================
   NOTIFICATION DROPDOWN
========================================================= */

function openNotifications() {

    notificationDropdown?.classList.add("open");

    notificationDropdown?.setAttribute(
        "aria-hidden",
        "false"
    );

    notificationButton?.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeNotifications() {

    notificationDropdown?.classList.remove("open");

    notificationDropdown?.setAttribute(
        "aria-hidden",
        "true"
    );

    notificationButton?.setAttribute(
        "aria-expanded",
        "false"
    );
}


function toggleNotifications() {

    const isOpen =
        notificationDropdown?.classList.contains("open");

    if (isOpen) {
        closeNotifications();
    } else {
        openNotifications();
    }
}


notificationButton?.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        toggleNotifications();
    }
);


notificationDropdown?.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();
    }
);


document.addEventListener(
    "click",
    () => {

        closeNotifications();

    }
);


/* =========================================================
   THEME
========================================================= */

function applySavedTheme() {

    const savedTheme =
        localStorage.getItem(
            "verifystack-theme"
        );

    if (savedTheme === "dark") {

        document.body.classList.add("dark");

    } else {

        document.body.classList.remove("dark");
    }
}


function toggleTheme() {

    const isDark =
        document.body.classList.toggle("dark");

    localStorage.setItem(
        "verifystack-theme",
        isDark ? "dark" : "light"
    );
}


applySavedTheme();


themeButton?.addEventListener(
    "click",
    toggleTheme
);


/* =========================================================
   PROFILE BUTTON
========================================================= */

profileButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "profile.html";
    }
);


/* =========================================================
   LOGOUT
========================================================= */

logoutButton?.addEventListener(
    "click",
    async () => {

        logoutButton.disabled = true;

        logoutButton.textContent =
            "Signing out...";

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            logoutButton.disabled = false;

            logoutButton.textContent =
                "Sign out";

            showToast(
                "Sign out failed",
                "We could not sign you out. Please try again.",
                "error"
            );
        }
    }
);


/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadUserProfile(user) {

    if (!user) {
        return {};
    }

    try {

        const userReference =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnapshot =
            await getDoc(
                userReference
            );

        if (userSnapshot.exists()) {

            return userSnapshot.data();

        }

    } catch (error) {

        console.error(
            "Could not load user profile:",
            error
        );
    }

    return {};
}


/* =========================================================
   UPDATE HEADER / WELCOME
========================================================= */

function updateUserInterface(
    user,
    userData
) {

    const firstName =
        getFirstName(
            userData,
            user
        );

    const initial =
        getInitial(
            userData,
            user
        );

    if (welcomeMessage) {

        welcomeMessage.textContent =
            `Welcome back, ${firstName}`;
    }

    if (profileInitial) {

        profileInitial.textContent =
            initial;
    }
}


/* =========================================================
   WALLET
========================================================= */

function updateWallet(
    userData
) {

    const possibleBalance =
        userData?.walletBalance ??
        userData?.balance ??
        userData?.wallet ??
        0;

    const formatted =
        formatCurrency(
            possibleBalance
        );

    if (walletBalance) {
        walletBalance.textContent =
            formatted;
    }

    if (headerWalletBalance) {
        headerWalletBalance.textContent =
            formatted;
    }
}


/* =========================================================
   INVENTORY
========================================================= */

function updateInventory(
    userData
) {

    const logs =
        Number(
            userData?.availableLogs ??
            userData?.logs ??
            userData?.logInventory ??
            0
        );

    const tools =
        Number(
            userData?.availableTools ??
            userData?.tools ??
            userData?.toolInventory ??
            0
        );

    const total =
        Number(
            userData?.inventory ??
            userData?.inventoryTotal ??
            (logs + tools)
        );

    if (inventoryTotal) {

        inventoryTotal.textContent =
            formatNumber(total);
    }

    if (inventoryBreakdown) {

        inventoryBreakdown.textContent =
            `${formatNumber(logs)} logs · ${formatNumber(tools)} tools`;
    }
}


/* =========================================================
   ORDERS
========================================================= */

async function loadOrders(user) {

    if (!user || !recentOrders) {
        return;
    }

    recentOrders.innerHTML = `
        <div class="orders-loading">
            Loading orders...
        </div>
    `;

    try {

        let orderSnapshot;

        try {

            const orderedQuery =
                query(
                    collection(
                        db,
                        "orders"
                    ),
                    where(
                        "userId",
                        "==",
                        user.uid
                    ),
                    orderBy(
                        "createdAt",
                        "desc"
                    ),
                    limit(5)
                );

            orderSnapshot =
                await getDocs(
                    orderedQuery
                );

        } catch (firstError) {

            console.warn(
                "Ordered order query failed. Trying fallback:",
                firstError
            );

            const fallbackQuery =
                query(
                    collection(
                        db,
                        "orders"
                    ),
                    where(
                        "userId",
                        "==",
                        user.uid
                    ),
                    limit(5)
                );

            orderSnapshot =
                await getDocs(
                    fallbackQuery
                );
        }


        if (orderSnapshot.empty) {

            recentOrders.innerHTML = `
                <div class="orders-empty">
                    No orders yet.
                </div>
            `;

            if (totalPurchases) {
                totalPurchases.textContent = "0";
            }

            return;
        }


        const orders =
            orderSnapshot.docs.map(
                (orderDocument) => {

                    return {
                        id: orderDocument.id,
                        ...orderDocument.data()
                    };
                }
            );


        orders.sort(
            (a, b) => {

                const dateA =
                    timestampToDate(
                        a.createdAt
                    )?.getTime() || 0;

                const dateB =
                    timestampToDate(
                        b.createdAt
                    )?.getTime() || 0;

                return dateB - dateA;
            }
        );


        renderOrders(
            orders.slice(0, 5)
        );


        if (totalPurchases) {

            totalPurchases.textContent =
                formatNumber(
                    orders.length
                );
        }

    } catch (error) {

        console.error(
            "Orders error:",
            error
        );

        recentOrders.innerHTML = `
            <div class="orders-empty">
                Unable to load orders right now.
            </div>
        `;
    }
}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders(
    orders
) {

    if (!recentOrders) {
        return;
    }

    recentOrders.innerHTML =
        orders.map(
            (order) => {

                const title =
                    order.productName ||
                    order.name ||
                    order.product ||
                    order.type ||
                    "Order";

                const status =
                    order.status ||
                    "Completed";

                const price =
                    order.amount ??
                    order.price ??
                    order.total ??
                    0;

                const date =
                    formatDate(
                        order.createdAt
                    );

                return `
                    <div class="order-item">

                        <div class="order-left">

                            <div class="order-title">
                                ${escapeHTML(title)}
                            </div>

                            <div class="order-date">
                                ${escapeHTML(date)}
                            </div>

                        </div>

                        <div class="order-right">

                            <span class="order-status">
                                ${escapeHTML(status)}
                            </span>

                            <div class="order-price">
                                ${formatCurrency(price)}
                            </div>

                        </div>

                    </div>
                `;
            }
        )
        .join("");
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function subscribeToNotifications(
    user
) {

    if (!user) {
        return;
    }

    if (notificationUnsubscribe) {

        notificationUnsubscribe();

        notificationUnsubscribe = null;
    }


    const notificationsReference =
        collection(
            db,
            "notifications"
        );


    const notificationQuery =
        query(
            notificationsReference,
            where(
                "userId",
                "==",
                user.uid
            ),
            limit(30)
        );


    notificationUnsubscribe =
        onSnapshot(
            notificationQuery,
            (snapshot) => {

                const notifications =
                    snapshot.docs.map(
                        (notificationDocument) => {

                            return {
                                id:
                                    notificationDocument.id,

                                ...notificationDocument.data()
                            };
                        }
                    );


                notifications.sort(
                    (a, b) => {

                        const dateA =
                            timestampToDate(
                                a.createdAt
                            )?.getTime() || 0;

                        const dateB =
                            timestampToDate(
                                b.createdAt
                            )?.getTime() || 0;

                        return dateB - dateA;
                    }
                );


                renderNotifications(
                    notifications
                );
            },

            (error) => {

                console.error(
                    "Notification listener error:",
                    error
                );

                if (notificationList) {

                    notificationList.innerHTML = `
                        <div class="notification-empty">
                            Unable to load notifications.
                        </div>
                    `;
                }

                updateNotificationBadge(0);
            }
        );
}


/* =========================================================
   RENDER NOTIFICATIONS
========================================================= */

function renderNotifications(
    notifications
) {

    if (!notificationList) {
        return;
    }


    if (!notifications.length) {

        notificationList.innerHTML = `
            <div class="notification-empty">
                No notifications yet.
            </div>
        `;

        updateNotificationBadge(0);

        return;
    }


    const unreadCount =
        notifications.filter(
            (notification) =>
                notification.read !== true &&
                notification.isRead !== true
        ).length;


    updateNotificationBadge(
        unreadCount
    );


    notificationList.innerHTML =
        notifications.map(
            (notification) => {

                const isUnread =
                    notification.read !== true &&
                    notification.isRead !== true;

                const title =
                    notification.title ||
                    "Notification";

                const message =
                    notification.message ||
                    notification.body ||
                    "";

                const date =
                    formatDate(
                        notification.createdAt
                    );


                return `
                    <div
                        class="notification-item ${isUnread ? "unread" : ""}"
                        data-notification-id="${escapeHTML(notification.id)}"
                    >

                        <div class="notification-title">
                            ${escapeHTML(title)}
                        </div>

                        <div class="notification-message">
                            ${escapeHTML(message)}
                        </div>

                        ${
                            date
                                ? `
                                    <div class="notification-time">
                                        ${escapeHTML(date)}
                                    </div>
                                  `
                                : ""
                        }

                    </div>
                `;
            }
        )
        .join("");
}


/* =========================================================
   NOTIFICATION BADGE
========================================================= */

function updateNotificationBadge(
    count
) {

    if (!notificationBadge) {
        return;
    }

    if (count <= 0) {

        notificationBadge.textContent =
            "0";

        notificationBadge.style.display =
            "none";

        return;
    }


    notificationBadge.style.display =
        "flex";


    notificationBadge.textContent =
        count > 99
            ? "99+"
            : String(count);
}


/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
========================================================= */

async function markAllNotificationsRead() {

    if (!currentUser) {
        return;
    }


    markAllReadButton.disabled =
        true;


    try {

        const notificationsQuery =
            query(
                collection(
                    db,
                    "notifications"
                ),
                where(
                    "userId",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(
                notificationsQuery
            );


        if (snapshot.empty) {

            return;
        }


        const batch =
            writeBatch(db);


        snapshot.docs.forEach(
            (notificationDocument) => {

                const data =
                    notificationDocument.data();


                if (
                    data.read !== true &&
                    data.isRead !== true
                ) {

                    batch.update(
                        notificationDocument.ref,
                        {
                            read: true,
                            isRead: true,
                            readAt: serverTimestamp()
                        }
                    );
                }
            }
        );


        await batch.commit();


        showToast(
            "Notifications",
            "All notifications have been marked as read."
        );

    } catch (error) {

        console.error(
            "Mark notifications error:",
            error
        );

        showToast(
            "Unable to update",
            "We could not mark the notifications as read.",
            "error"
        );

    } finally {

        markAllReadButton.disabled =
            false;
    }
}


markAllReadButton?.addEventListener(
    "click",
    markAllNotificationsRead
);


/* =========================================================
   LOGIN SUCCESS NOTIFICATION
========================================================= */

async function createLoginSuccessNotification(
    user
) {

    if (!user) {
        return;
    }


    try {

        const notificationReference =
            doc(
                collection(
                    db,
                    "notifications"
                )
            );


        await writeBatch(db)
            .set(
                notificationReference,
                {
                    userId: user.uid,

                    title:
                        "Signed in successfully",

                    message:
                        "You have logged in to your account successfully.",

                    type:
                        "login",

                    read:
                        false,

                    isRead:
                        false,

                    createdAt:
                        serverTimestamp()
                }
            )
            .commit();


        showToast(
            "Login successful",
            "You have logged in to your account successfully."
        );

    } catch (error) {

        console.error(
            "Could not create login notification:",
            error
        );

        /*
         * The dashboard should still work even if
         * Firestore notification creation fails.
         */
        showToast(
            "Welcome back",
            "You have logged in to your account successfully."
        );
    }
}


/* =========================================================
   LOGIN SUCCESS DETECTION
========================================================= */

function handleLoginSuccess(
    user
) {

    const loginMarker =
        `login-notification-${user.uid}`;

    const alreadyHandled =
        sessionStorage.getItem(
            loginMarker
        );


    if (alreadyHandled) {
        return;
    }


    sessionStorage.setItem(
        loginMarker,
        "true"
    );


    createLoginSuccessNotification(
        user
    );
}


/* =========================================================
   SUPPORT CONTACTS
========================================================= */

async function loadSupportSettings() {

    try {

        const settingsReference =
            doc(
                db,
                "settings",
                "support"
            );


        const settingsSnapshot =
            await getDoc(
                settingsReference
            );


        if (!settingsSnapshot.exists()) {
            return;
        }


        const settings =
            settingsSnapshot.data();


        const whatsapp =
            settings.whatsapp ||
            settings.whatsappNumber ||
            "";


        const telegram =
            settings.telegram ||
            settings.telegramUrl ||
            "";


        const email =
            settings.email ||
            settings.supportEmail ||
            "";


        if (
            whatsapp &&
            whatsappLink
        ) {

            const cleaned =
                String(whatsapp)
                    .replace(
                        /[^0-9]/g,
                        ""
                    );


            whatsappLink.href =
                `https://wa.me/${cleaned}`;
        }


        if (
            telegram &&
            telegramLink
        ) {

            telegramLink.href =
                String(telegram);
        }


        if (
            email &&
            supportEmail
        ) {

            supportEmail.textContent =
                email;

            supportEmail.href =
                `mailto:${email}`;
        }

    } catch (error) {

        console.warn(
            "Support settings could not be loaded:",
            error
        );
    }
}


/* =========================================================
   REAL-TIME USER DATA
========================================================= */

function subscribeToUserData(
    user
) {

    if (!user) {
        return;
    }


    if (userUnsubscribe) {

        userUnsubscribe();

        userUnsubscribe = null;
    }


    const userReference =
        doc(
            db,
            "users",
            user.uid
        );


    userUnsubscribe =
        onSnapshot(
            userReference,
            (snapshot) => {

                if (!snapshot.exists()) {
                    return;
                }


                const userData =
                    snapshot.data();


                updateUserInterface(
                    user,
                    userData
                );


                updateWallet(
                    userData
                );


                updateInventory(
                    userData
                );
            },

            (error) => {

                console.error(
                    "User data listener error:",
                    error
                );
            }
        );
}


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            if (notificationUnsubscribe) {
                notificationUnsubscribe();
            }

            if (userUnsubscribe) {
                userUnsubscribe();
            }

            window.location.replace(
                "login.html"
            );

            return;
        }


        currentUser =
            user;


        try {

            const userData =
                await loadUserProfile(
                    user
                );


            updateUserInterface(
                user,
                userData
            );


            updateWallet(
                userData
            );


            updateInventory(
                userData
            );


            subscribeToUserData(
                user
            );


            subscribeToNotifications(
                user
            );


            await loadOrders(
                user
            );


            await loadSupportSettings();


            handleLoginSuccess(
                user
            );

        } catch (error) {

            console.error(
                "Dashboard initialization error:",
                error
            );

            showToast(
                "Dashboard error",
                "Some account information could not be loaded.",
                "error"
            );
        }
    }
);


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (notificationUnsubscribe) {
            notificationUnsubscribe();
        }

        if (userUnsubscribe) {
            userUnsubscribe();
        }
    }
);
