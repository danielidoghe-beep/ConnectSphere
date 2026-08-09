import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    runTransaction,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   ELEMENTS
===================================================== */

const totalUsers =
    document.getElementById("totalUsers");

const totalOrders =
    document.getElementById("totalOrders");

const monthlySpent =
    document.getElementById("monthlySpent");

const pendingDeposits =
    document.getElementById("pendingDeposits");

const depositsList =
    document.getElementById("depositsList");

const usersList =
    document.getElementById("usersList");

const topUsersList =
    document.getElementById("topUsersList");

const userSearch =
    document.getElementById("userSearch");

const productForm =
    document.getElementById("productForm");

const notificationForm =
    document.getElementById("notificationForm");

const addProductButton =
    document.getElementById("addProductButton");

const sendNotificationButton =
    document.getElementById(
        "sendNotificationButton"
    );

const logoutButton =
    document.getElementById("logoutButton");

const toast =
    document.getElementById("toast");


/* =====================================================
   STATE
===================================================== */

let adminUser = null;
let allUsers = [];


/* =====================================================
   ADMIN EMAIL
===================================================== */

/*
 * PUT YOUR ADMIN EMAIL HERE.
 *
 * Example:
 *
 * const ADMIN_EMAIL = "your@email.com";
 */

const ADMIN_EMAIL =
    "danielidoghe@gmail.com";


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);
}


/* =====================================================
   MONEY
===================================================== */

function money(value) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(
        Number(value) || 0
    );
}


/* =====================================================
   ESCAPE
===================================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =====================================================
   DATE
===================================================== */

function timestampDate(value) {

    if (!value) {
        return null;
    }

    if (
        typeof value.toDate ===
        "function"
    ) {
        return value.toDate();
    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}


/* =====================================================
   LOAD USERS
===================================================== */

async function loadUsers() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "users"
            )
        );

    allUsers =
        snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

    totalUsers.textContent =
        allUsers.length;

    renderUsers(
        allUsers
    );

    renderTopUsers();
}


/* =====================================================
   RENDER USERS
===================================================== */

function renderUsers(users) {

    usersList.innerHTML = "";

    if (!users.length) {

        usersList.innerHTML =
            `<div class="empty">
                No users found.
            </div>`;

        return;
    }


    users.forEach(user => {

        const item =
            document.createElement("div");

        item.className =
            "user-item";


        const name =
            user.firstName ||
            user.displayName ||
            "User";


        const email =
            user.email ||
            "No email";


        const status =
            user.suspended
                ? "Suspended"
                : "Active";


        item.innerHTML = `

            <div class="item-top">

                <div>

                    <div class="item-name">
                        ${escapeHTML(name)}
                    </div>

                    <div class="item-email">
                        ${escapeHTML(email)}
                    </div>

                    <div class="item-details">
                        Status: ${status}
                    </div>

                </div>

            </div>


            <div class="item-actions">

                <button
                    class="suspend-button"
                    data-action="suspend"
                    data-id="${escapeHTML(user.id)}"
                >
                    ${
                        user.suspended
                            ? "Unsuspend"
                            : "Suspend"
                    }
                </button>

                <button
                    class="delete-button"
                    data-action="delete"
                    data-id="${escapeHTML(user.id)}"
                >
                    Delete
                </button>

            </div>
        `;


        usersList.appendChild(
            item
        );
    });


    usersList
        .querySelectorAll(
            "button[data-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    const action =
                        button.dataset.action;

                    if (
                        action ===
                        "suspend"
                    ) {
                        toggleSuspension(id);
                    }

                    if (
                        action ===
                        "delete"
                    ) {
                        deleteUserData(id);
                    }
                }
            );
        });
}


/* =====================================================
   SEARCH USERS
===================================================== */

userSearch.addEventListener(
    "input",
    () => {

        const search =
            userSearch.value
                .trim()
                .toLowerCase();


        if (!search) {

            renderUsers(
                allUsers
            );

            return;
        }


        const filtered =
            allUsers.filter(user => {

                const name =
                    `${user.firstName || ""} ${
                        user.lastName || ""
                    }`.toLowerCase();

                const email =
                    String(
                        user.email || ""
                    ).toLowerCase();

                return (
                    name.includes(search) ||
                    email.includes(search)
                );
            });


        renderUsers(
            filtered
        );
    }
);


/* =====================================================
   SUSPEND / UNSUSPEND
===================================================== */

async function toggleSuspension(
    userId
) {

    const user =
        allUsers.find(
            item =>
                item.id === userId
        );


    if (!user) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "users",
                userId
            ),
            {
                suspended:
                    !user.suspended,

                updatedAt:
                    serverTimestamp()
            }
        );


        showToast(
            user.suspended
                ? "User unsuspended."
                : "User suspended."
        );


        await loadUsers();

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to update user."
        );
    }
}


/* =====================================================
   DELETE USER DATA
===================================================== */

async function deleteUserData(
    userId
) {

    const confirmed =
        window.confirm(
            "Delete this user's ConnectSphere data?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "users",
                userId
            )
        );


        showToast(
            "User data deleted."
        );


        await loadUsers();

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to delete user data."
        );
    }
}


/* =====================================================
   LOAD ORDERS
===================================================== */

async function loadOrders() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "orders"
            )
        );


    const orders =
        snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));


    totalOrders.textContent =
        orders.length;


    calculateMonthlySpent(
        orders
    );
}


/* =====================================================
   MONTHLY SPENDING
===================================================== */

function calculateMonthlySpent(
    orders
) {

    const now =
        new Date();

    const currentMonth =
        now.getMonth();

    const currentYear =
        now.getFullYear();


    let total = 0;


    orders.forEach(order => {

        const date =
            timestampDate(
                order.createdAt
            );


        if (!date) {
            return;
        }


        if (
            date.getMonth() ===
            currentMonth &&
            date.getFullYear() ===
            currentYear
        ) {

            total +=
                Number(
                    order.amount ??
                    order.total ??
                    order.price ??
                    0
                );
        }
    });


    monthlySpent.textContent =
        money(total);
}


/* =====================================================
   TOP USERS
===================================================== */

async function renderTopUsers() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "orders"
            )
        );


    const totals = {};


    snapshot.docs.forEach(item => {

        const order =
            item.data();


        const userId =
            order.userId;


        if (!userId) {
            return;
        }


        const amount =
            Number(
                order.amount ??
                order.total ??
                order.price ??
                0
            );


        totals[userId] =
            (totals[userId] || 0) +
            amount;
    });


    const ranking =
        Object.entries(
            totals
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        )
        .slice(
            0,
            10
        );


    topUsersList.innerHTML = "";


    if (!ranking.length) {

        topUsersList.innerHTML =
            `<div class="empty">
                No purchases yet.
            </div>`;

        return;
    }


    ranking.forEach(
        ([userId, amount], index) => {

            const user =
                allUsers.find(
                    item =>
                        item.id ===
                        userId
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "top-user-item";


            item.innerHTML = `

                <div class="item-top">

                    <div>

                        <div class="item-name">
                            #${index + 1}
                            ${
                                escapeHTML(
                                    user?.firstName ||
                                    user?.displayName ||
                                    "User"
                                )
                            }
                        </div>

                        <div class="item-email">
                            ${
                                escapeHTML(
                                    user?.email ||
                                    userId
                                )
                            }
                        </div>

                    </div>

                    <strong class="item-amount">
                        ${money(amount)}
                    </strong>

                </div>
            `;


            topUsersList.appendChild(
                item
            );
        }
    );
}


/* =====================================================
   LOAD DEPOSITS
===================================================== */

async function loadDeposits() {

    const depositsSnapshot =
        await getDocs(
            query(
                collection(
                    db,
                    "deposits"
                ),
                where(
                    "status",
                    "==",
                    "pending"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            )
        );


    pendingDeposits.textContent =
        depositsSnapshot.size;


    depositsList.innerHTML = "";


    if (
        depositsSnapshot.empty
    ) {

        depositsList.innerHTML =
            `<div class="empty">
                No pending deposits.
            </div>`;

        return;
    }


    depositsSnapshot.docs.forEach(
        item => {

            const deposit =
                item.data();


            const amount =
                Number(
                    deposit.amount
                ) || 0;


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "deposit-item";


            element.innerHTML = `

                <div class="item-top">

                    <div>

                        <div class="item-name">
                            Deposit request
                        </div>

                        <div class="item-email">
                            User:
                            ${escapeHTML(
                                deposit.userId ||
                                "Unknown"
                            )}
                        </div>

                        <div class="item-details">
                            Reference:
                            ${escapeHTML(
                                deposit.reference ||
                                item.id
                            )}
                        </div>

                    </div>

                    <strong class="item-amount">
                        ${money(amount)}
                    </strong>

                </div>


                <div class="item-actions">

                    <button
                        class="approve-button"
                        data-deposit-id="${item.id}"
                    >
                        Approve
                    </button>

                    <button
                        class="decline-button"
                        data-deposit-id="${item.id}"
                    >
                        Decline
                    </button>

                </div>
            `;


            depositsList.appendChild(
                element
            );
        }
    );


    depositsList
        .querySelectorAll(
            ".approve-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    approveDeposit(
                        button.dataset.depositId
                    )
            );
        });


    depositsList
        .querySelectorAll(
            ".decline-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    declineDeposit(
                        button.dataset.depositId
                    )
            );
        });
}


/* =====================================================
   APPROVE DEPOSIT
===================================================== */

async function approveDeposit(
    depositId
) {

    try {

        await runTransaction(
            db,
            async transaction => {

                const depositRef =
                    doc(
                        db,
                        "deposits",
                        depositId
                    );


                const depositSnapshot =
                    await transaction.get(
                        depositRef
                    );


                if (
                    !depositSnapshot.exists()
                ) {
                    throw new Error(
                        "Deposit not found."
                    );
                }


                const deposit =
                    depositSnapshot.data();


                if (
                    deposit.status !==
                    "pending"
                ) {
                    throw new Error(
                        "Deposit already processed."
                    );
                }


                const userId =
                    deposit.userId;


                const amount =
                    Number(
                        deposit.amount
                    );


                if (
                    !userId ||
                    !Number.isFinite(amount) ||
                    amount <= 0
                ) {
                    throw new Error(
                        "Invalid deposit."
                    );
                }


                const walletRef =
                    doc(
                        db,
                        "users",
                        userId,
                        "wallet",
                        "balance"
                    );


                const walletSnapshot =
                    await transaction.get(
                        walletRef
                    );


                const oldBalance =
                    walletSnapshot.exists()
                        ? Number(
                            walletSnapshot.data()
                                .balance
                        ) || 0
                        : 0;


                const newBalance =
                    oldBalance +
                    amount;


                transaction.set(
                    walletRef,
                    {
                        balance:
                            newBalance,

                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );


                transaction.update(
                    depositRef,
                    {
                        status:
                            "approved",

                        approvedAt:
                            serverTimestamp(),

                        approvedBy:
                            adminUser.uid
                    }
                );


                const notificationRef =
                    doc(
                        collection(
                            db,
                            "notifications"
                        )
                    );


                transaction.set(
                    notificationRef,
                    {
                        userId,

                        title:
                            "Deposit approved",

                        message:
                            `${money(amount)} has been added to your wallet.`,

                        read: false,

                        isRead: false,

                        createdAt:
                            serverTimestamp()
                    }
                );
            }
        );


        showToast(
            "Deposit approved."
        );


        await loadDeposits();

    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Unable to approve deposit."
        );
    }
}


/* =====================================================
   DECLINE DEPOSIT
===================================================== */

async function declineDeposit(
    depositId
) {

    const confirmed =
        window.confirm(
            "Decline this deposit?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "deposits",
                depositId
            ),
            {
                status:
                    "declined",

                declinedAt:
                    serverTimestamp(),

                declinedBy:
                    adminUser.uid
            }
        );


        showToast(
            "Deposit declined."
        );


        await loadDeposits();

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to decline deposit."
        );
    }
}


/* =====================================================
   ADD PRODUCT
===================================================== */

productForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        addProductButton.disabled =
            true;

        addProductButton.textContent =
            "Adding...";


        try {

            const name =
                document
                    .getElementById(
                        "productName"
                    )
                    .value
                    .trim();


            const category =
                document
                    .getElementById(
                        "productCategory"
                    )
                    .value
                    .trim();


            const price =
                Number(
                    document
                        .getElementById(
                            "productPrice"
                        )
                        .value
                );


            const imageUrl =
                document
                    .getElementById(
                        "productImage"
                    )
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "productDescription"
                    )
                    .value
                    .trim();


            await setDoc(
                doc(
                    collection(
                        db,
                        "products"
                    )
                ),
                {
                    name,

                    category,

                    price,

                    imageUrl,

                    description,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        adminUser.uid,

                    active:
                        true
                }
            );


            productForm.reset();


            showToast(
                "Product added successfully."
            );

        } catch (error) {

            console.error(error);

            showToast(
                "Unable to add product."
            );

        } finally {

            addProductButton.disabled =
                false;

            addProductButton.textContent =
                "Add product";
        }
    }
);


/* =====================================================
   SEND NOTIFICATION TO ALL USERS
===================================================== */

notificationForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        sendNotificationButton.disabled =
            true;

        sendNotificationButton.textContent =
            "Sending...";


        try {

            const title =
                document
                    .getElementById(
                        "notificationTitle"
                    )
                    .value
                    .trim();


            const message =
                document
                    .getElementById(
                        "notificationMessage"
                    )
                    .value
                    .trim();


            const usersSnapshot =
                await getDocs(
                    collection(
                        db,
                        "users"
                    )
                );


            const writes =
                usersSnapshot.docs.map(
                    userDoc => {

                        const notificationRef =
                            doc(
                                collection(
                                    db,
                                    "notifications"
                                )
                            );


                        return setDoc(
                            notificationRef,
                            {
                                userId:
                                    userDoc.id,

                                title,

                                message,

                                read:
                                    false,

                                isRead:
                                    false,

                                createdAt:
                                    serverTimestamp(),

                                sentBy:
                                    adminUser.uid
                            }
                        );
                    }
                );


            await Promise.all(
                writes
            );


            notificationForm.reset();


            showToast(
                "Notification sent to all users."
            );

        } catch (error) {

            console.error(error);

            showToast(
                "Unable to send notification."
            );

        } finally {

            sendNotificationButton.disabled =
                false;

            sendNotificationButton.textContent =
                "Send to all users";
        }
    }
);


/* =====================================================
   LOGOUT
===================================================== */

logoutButton.addEventListener(
    "click",
    async () => {

        await signOut(
            auth
        );

        window.location.href =
            "signin.html";
    }
);


/* =====================================================
   SIDE MENU
===================================================== */

const menuButton =
    document.getElementById(
        "menuButton"
    );

const menuOverlay =
    document.getElementById(
        "menuOverlay"
    );

const sideMenu =
    document.getElementById(
        "sideMenu"
    );

const closeMenuButton =
    document.getElementById(
        "closeMenuButton"
    );


function openMenu() {

    sideMenu.classList.add(
        "open"
    );

    menuOverlay.classList.add(
        "open"
    );
}


function closeMenu() {

    sideMenu.classList.remove(
        "open"
    );

    menuOverlay.classList.remove(
        "open"
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


/* =====================================================
   ADMIN AUTH
===================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "signin.html";

            return;
        }


        /*
         * EMAIL CHECK.
         *
         * The same email must also be
         * protected by Firestore Rules.
         */

        if (
            !user.email ||
            user.email.toLowerCase() !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            alert(
                "You do not have administrator access."
            );


            await signOut(
                auth
            );


            window.location.href =
                "signin.html";

            return;
        }


        adminUser =
            user;


        try {

            await Promise.all([
                loadUsers(),
                loadOrders(),
                loadDeposits()
            ]);

        } catch (error) {

            console.error(
                "Admin loading error:",
                error
            );

            showToast(
                "Unable to load admin data."
            );
        }
    }
);
