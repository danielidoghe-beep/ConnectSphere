import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   ELEMENTS
===================================================== */

const notificationsContainer =
    document.getElementById(
        "notificationsContainer"
    );

const notificationCount =
    document.getElementById(
        "notificationCount"
    );

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

const menuClose =
    document.getElementById(
        "menuClose"
    );

const themeButton =
    document.getElementById(
        "themeButton"
    );

const headerInitial =
    document.getElementById(
        "headerInitial"
    );


/* =====================================================
   STATE
===================================================== */

let unsubscribeNotifications =
    null;


/* =====================================================
   ESCAPE HTML
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

function formatDate(timestamp) {

    if (!timestamp) {
        return "";
    }

    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

    return date.toLocaleString(
        "en-US",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* =====================================================
   LOAD NOTIFICATIONS
===================================================== */

function loadNotifications(user) {

    if (unsubscribeNotifications) {
        unsubscribeNotifications();
    }


    const notificationsRef =
        collection(
            db,
            "users",
            user.uid,
            "notifications"
        );


    const notificationsQuery =
        query(
            notificationsRef,
            orderBy(
                "createdAt",
                "desc"
            )
        );


    unsubscribeNotifications =
        onSnapshot(
            notificationsQuery,

            snapshot => {

                notificationsContainer
                    .innerHTML = "";


                if (
                    snapshot.empty
                ) {

                    notificationCount
                        .textContent = "0";


                    notificationsContainer
                        .innerHTML = `
                            <div
                                class="empty-notifications"
                            >
                                <strong>
                                    No notifications
                                </strong>

                                <span>
                                    You don't have any
                                    notifications yet.
                                </span>
                            </div>
                        `;

                    return;
                }


                let unreadCount = 0;


                snapshot.docs.forEach(
                    notificationDoc => {

                        const notification =
                            notificationDoc.data();


                        if (
                            notification.read !== true
                        ) {
                            unreadCount++;
                        }


                        const item =
                            document.createElement(
                                "article"
                            );


                        item.className =
                            "notification-item";


                        item.innerHTML = `

                            <h3
                                class="notification-title"
                            >
                                ${escapeHTML(
                                    notification.title ||
                                    "Notification"
                                )}
                            </h3>


                            <p
                                class="notification-message"
                            >
                                ${escapeHTML(
                                    notification.message ||
                                    ""
                                )}
                            </p>


                            ${
                                notification.createdAt
                                ? `
                                    <div
                                        class="notification-date"
                                    >
                                        ${escapeHTML(
                                            formatDate(
                                                notification.createdAt
                                            )
                                        )}
                                    </div>
                                `
                                : ""
                            }

                        `;


                        notificationsContainer
                            .appendChild(item);

                    }
                );


                notificationCount.textContent =
                    unreadCount > 99
                        ? "99+"
                        : String(
                            unreadCount
                        );

            },

            error => {

                console.error(
                    "Notifications error:",
                    error
                );


                notificationsContainer
                    .innerHTML = `
                        <div
                            class="empty-notifications"
                        >
                            <strong>
                                Unable to load notifications
                            </strong>

                            <span>
                                Please try again later.
                            </span>
                        </div>
                    `;
            }
        );
}


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.href =
                "signin.html";

            return;
        }


        const name =
            user.displayName ||
            user.email ||
            "A";


        headerInitial.textContent =
            name
                .charAt(0)
                .toUpperCase();


        loadNotifications(
            user
        );
    }
);


/* =====================================================
   MENU
===================================================== */

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


menuButton?.addEventListener(
    "click",
    openMenu
);


menuClose?.addEventListener(
    "click",
    closeMenu
);


menuOverlay?.addEventListener(
    "click",
    closeMenu
);


/* =====================================================
   DARK MODE
===================================================== */

themeButton?.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-mode"
        );

        localStorage.setItem(
            "darkMode",
            document.body.classList.contains(
                "dark-mode"
            )
                ? "true"
                : "false"
        );
    }
);


if (
    localStorage.getItem(
        "darkMode"
    ) === "true"
) {

    document.body.classList.add(
        "dark-mode"
    );
}
