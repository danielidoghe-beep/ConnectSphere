/* =========================================================
   FIREBASE
========================================================= */

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
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
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
   INITIALIZE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   ELEMENTS
========================================================= */

const menuButton =
    document.getElementById("menuButton");

const closeMenuButton =
    document.getElementById("closeMenuButton");

const menuOverlay =
    document.getElementById("menuOverlay");

const sideMenu =
    document.getElementById("sideMenu");

const themeButton =
    document.getElementById("themeButton");

const newTicketButton =
    document.getElementById("newTicketButton");

const openFirstTicketButton =
    document.getElementById("openFirstTicketButton");

const ticketModal =
    document.getElementById("ticketModal");

const closeTicketModal =
    document.getElementById("closeTicketModal");

const cancelTicketButton =
    document.getElementById("cancelTicketButton");

const ticketForm =
    document.getElementById("ticketForm");

const ticketSubject =
    document.getElementById("ticketSubject");

const ticketMessage =
    document.getElementById("ticketMessage");

const ticketFormError =
    document.getElementById("ticketFormError");

const submitTicketButton =
    document.getElementById("submitTicketButton");

const ticketList =
    document.getElementById("ticketList");

const emptyTicketState =
    document.getElementById("emptyTicketState");

const profileInitial =
    document.getElementById("profileInitial");

const notificationCount =
    document.getElementById("notificationCount");


/* =========================================================
   CURRENT USER
========================================================= */

let currentUser = null;

let unsubscribeTickets = null;


/* =========================================================
   OPEN MENU
========================================================= */

function openMenu() {
    sideMenu.classList.add("open");
    menuOverlay.classList.add("open");

    sideMenu.setAttribute(
        "aria-hidden",
        "false"
    );
}


/* =========================================================
   CLOSE MENU
========================================================= */

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


/* =========================================================
   DARK MODE
========================================================= */

const savedTheme =
    localStorage.getItem("verifyStackTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

themeButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-mode"
        );

        const isDark =
            document.body.classList.contains(
                "dark-mode"
            );

        localStorage.setItem(
            "verifyStackTheme",
            isDark ? "dark" : "light"
        );
    }
);


/* =========================================================
   MODAL
========================================================= */

function openTicketModal() {

    ticketFormError.textContent = "";
    ticketFormError.classList.remove("show");

    ticketModal.classList.add("open");

    ticketModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";

    setTimeout(() => {
        ticketSubject.focus();
    }, 100);
}


function closeTicketModalFunction() {

    ticketModal.classList.remove("open");

    ticketModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";

    ticketForm.reset();

    ticketFormError.textContent = "";
    ticketFormError.classList.remove("show");

    submitTicketButton.classList.remove(
        "loading"
    );

    submitTicketButton.disabled = false;
}


newTicketButton.addEventListener(
    "click",
    openTicketModal
);

openFirstTicketButton.addEventListener(
    "click",
    openTicketModal
);

closeTicketModal.addEventListener(
    "click",
    closeTicketModalFunction
);

cancelTicketButton.addEventListener(
    "click",
    closeTicketModalFunction
);


/* Close modal by clicking outside */

ticketModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === ticketModal
        ) {
            closeTicketModalFunction();
        }
    }
);


/* Escape key */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            ticketModal.classList.contains("open")
        ) {
            closeTicketModalFunction();
        }
    }
);


/* =========================================================
   SHOW ERROR
========================================================= */

function showFormError(message) {

    ticketFormError.textContent = message;

    ticketFormError.classList.add("show");
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatTicketDate(timestamp) {

    if (!timestamp) {
        return "Just now";
    }

    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

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


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


/* =========================================================
   RENDER TICKETS
========================================================= */

function renderTickets(snapshot) {

    ticketList.innerHTML = "";

    if (snapshot.empty) {

        emptyTicketState.style.display =
            "flex";

        return;
    }


    emptyTicketState.style.display =
        "none";


    snapshot.forEach(
        (ticketDocument) => {

            const ticket =
                ticketDocument.data();

            const card =
                document.createElement("article");

            card.className =
                "ticket-card";

            const status =
                ticket.status || "open";

            card.innerHTML = `

                <div class="ticket-card-top">

                    <h3>
                        ${escapeHTML(
                            ticket.subject ||
                            "Support ticket"
                        )}
                    </h3>

                    <span class="ticket-status">
                        ${escapeHTML(
                            status
                        )}
                    </span>

                </div>

                <p class="ticket-message">
                    ${escapeHTML(
                        ticket.message || ""
                    )}
                </p>

                <div class="ticket-meta">

                    Ticket ID:
                    ${escapeHTML(
                        ticketDocument.id
                    )}

                    <br>

                    ${formatTicketDate(
                        ticket.createdAt
                    )}

                </div>

            `;

            ticketList.appendChild(card);
        }
    );
}


/* =========================================================
   LOAD USER TICKETS
========================================================= */

function loadUserTickets(user) {

    if (unsubscribeTickets) {
        unsubscribeTickets();
        unsubscribeTickets = null;
    }


    const ticketsRef =
        collection(
            db,
            "supportTickets"
        );


    const ticketsQuery =
        query(
            ticketsRef,
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


    unsubscribeTickets =
        onSnapshot(
            ticketsQuery,
            (snapshot) => {

                renderTickets(
                    snapshot
                );
            },
            (error) => {

                console.error(
                    "Ticket loading error:",
                    error
                );

                ticketList.innerHTML = "";

                emptyTicketState.style.display =
                    "flex";
            }
        );
}


/* =========================================================
   GET WHATSAPP NUMBER
========================================================= */

async function getWhatsAppNumber() {

    const paymentRef =
        doc(
            db,
            "settings",
            "payment"
        );


    const paymentSnapshot =
        await getDoc(
            paymentRef
        );


    if (
        !paymentSnapshot.exists()
    ) {
        throw new Error(
            "Payment settings have not been configured in Firebase."
        );
    }


    const paymentData =
        paymentSnapshot.data();


    const whatsapp =
        String(
            paymentData.whatsapp || ""
        ).replace(
            /\D/g,
            ""
        );


    if (!whatsapp) {
        throw new Error(
            "WhatsApp number is missing from Firebase."
        );
    }


    return whatsapp;
}


/* =========================================================
   CREATE WHATSAPP MESSAGE
========================================================= */

function createWhatsAppMessage({
    ticketId,
    subject,
    message
}) {

    const userName =
        currentUser?.displayName ||
        "Customer";

    const userEmail =
        currentUser?.email ||
        "Not available";


    return (
        `Hello, I need support.\n\n` +
        `Ticket ID: ${ticketId}\n` +
        `Name: ${userName}\n` +
        `Email: ${userEmail}\n\n` +
        `Subject: ${subject}\n\n` +
        `Message:\n${message}`
    );
}


/* =========================================================
   SUBMIT TICKET
========================================================= */

ticketForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {

            showFormError(
                "Please sign in before opening a support ticket."
            );

            return;
        }


        const subject =
            ticketSubject.value.trim();

        const message =
            ticketMessage.value.trim();


        if (!subject) {

            showFormError(
                "Please enter a subject."
            );

            ticketSubject.focus();

            return;
        }


        if (!message) {

            showFormError(
                "Please describe your issue."
            );

            ticketMessage.focus();

            return;
        }


        if (subject.length > 120) {

            showFormError(
                "Your subject is too long."
            );

            return;
        }


        if (message.length > 2000) {

            showFormError(
                "Your message is too long."
            );

            return;
        }


        try {

            ticketFormError.classList.remove(
                "show"
            );

            submitTicketButton.disabled =
                true;

            submitTicketButton.classList.add(
                "loading"
            );


            /* -----------------------------------------
               SAVE TICKET TO FIREBASE
            ------------------------------------------ */

            const ticketsRef =
                collection(
                    db,
                    "supportTickets"
                );


            const ticketDocument =
                await addDoc(
                    ticketsRef,
                    {
                        userId:
                            currentUser.uid,

                        userEmail:
                            currentUser.email || "",

                        userName:
                            currentUser.displayName || "",

                        subject:
                            subject,

                        message:
                            message,

                        status:
                            "open",

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()
                    }
                );


            /* -----------------------------------------
               GET WHATSAPP NUMBER FROM FIREBASE
            ------------------------------------------ */

            const whatsapp =
                await getWhatsAppNumber();


            /* -----------------------------------------
               CREATE WHATSAPP MESSAGE
            ------------------------------------------ */

            const whatsappMessage =
                createWhatsAppMessage({
                    ticketId:
                        ticketDocument.id,

                    subject:
                        subject,

                    message:
                        message
                });


            const whatsappURL =
                `https://wa.me/${whatsapp}?text=` +
                encodeURIComponent(
                    whatsappMessage
                );


            /* -----------------------------------------
               CLOSE MODAL
            ------------------------------------------ */

            closeTicketModalFunction();


            /* -----------------------------------------
               OPEN WHATSAPP
            ------------------------------------------ */

            window.location.href =
                whatsappURL;

        }
        catch (error) {

            console.error(
                "Support ticket error:",
                error
            );


            showFormError(
                error.message ||
                "Unable to submit your support ticket. Please try again."
            );


            submitTicketButton.disabled =
                false;

            submitTicketButton.classList.remove(
                "loading"
            );
        }
    }
);


/* =========================================================
   PROFILE INITIAL
========================================================= */

function setProfile(user) {

    let initial = "D";


    if (user?.displayName) {

        initial =
            user.displayName
                .trim()
                .charAt(0)
                .toUpperCase();
    }
    else if (user?.email) {

        initial =
            user.email
                .trim()
                .charAt(0)
                .toUpperCase();
    }


    profileInitial.textContent =
        initial || "D";
}


/* =========================================================
   NOTIFICATION COUNT
========================================================= */

async function loadNotificationCount(user) {

    /*
       This reads the user's notifications.

       Your notification documents should use:

       notifications
          userId
          read
          createdAt

       The count is calculated from Firebase.
    */

    try {

        const notificationsRef =
            collection(
                db,
                "notifications"
            );


        const notificationQuery =
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


        onSnapshot(
            notificationQuery,
            (snapshot) => {

                const count =
                    snapshot.size;


                if (count > 99) {
                    notificationCount.textContent =
                        "99+";
                }
                else {
                    notificationCount.textContent =
                        String(count);
                }
            }
        );

    }
    catch (error) {

        console.error(
            "Notification count error:",
            error
        );

        notificationCount.textContent =
            "0";
    }
}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            /*
               User isn't authenticated.
               Send them back to login.
            */

            window.location.href =
                "login.html";

            return;
        }


        currentUser =
            user;


        setProfile(
            user
        );


        loadUserTickets(
            user
        );


        loadNotificationCount(
            user
        );
    }
);
