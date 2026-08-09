import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    updateProfile,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    deleteUser,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs,
    where
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   ELEMENTS
===================================================== */

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");

const profileInitial = document.getElementById("profileInitial");
const headerInitial = document.getElementById("headerInitial");

const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");

const profileForm = document.getElementById("profileForm");
const passwordForm = document.getElementById("passwordForm");

const saveProfileButton =
    document.getElementById("saveProfileButton");

const passwordButton =
    document.getElementById("passwordButton");

const sessionsContainer =
    document.getElementById("sessionsContainer");

const logoutOtherSessionsButton =
    document.getElementById("logoutOtherSessionsButton");

const emailVerificationStatus =
    document.getElementById("emailVerificationStatus");

const joinedDate =
    document.getElementById("joinedDate");

const signInMethod =
    document.getElementById("signInMethod");

const deleteAccountButton =
    document.getElementById("deleteAccountButton");

const toast =
    document.getElementById("toast");

const menuButton =
    document.getElementById("menuButton");

const menuOverlay =
    document.getElementById("menuOverlay");

const sideMenu =
    document.getElementById("sideMenu");

const closeMenuButton =
    document.getElementById("closeMenuButton");

const themeButton =
    document.getElementById("themeButton");


/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let currentSessionId = null;
let unsubscribeSessions = null;
let heartbeatTimer = null;


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =====================================================
   NAME HELPERS
===================================================== */

function getFullName(user) {

    const displayName = user.displayName || "";

    if (displayName.trim()) {
        return displayName.trim();
    }

    const first =
        firstNameInput.value.trim();

    const last =
        lastNameInput.value.trim();

    const combined =
        `${first} ${last}`.trim();

    return combined || "Account";
}


function getInitial(user) {

    const name =
        user.displayName ||
        user.email ||
        "A";

    return name.charAt(0).toUpperCase();
}


/* =====================================================
   DEVICE INFORMATION
===================================================== */

function getDeviceInformation() {

    const ua = navigator.userAgent;

    let device = "Unknown device";
    let browser = "Unknown browser";

    if (/iPhone/i.test(ua)) {
        device = "iPhone";
    } else if (/iPad/i.test(ua)) {
        device = "iPad";
    } else if (/Android/i.test(ua)) {

        const match =
            ua.match(/Android[^;]*;\s*(?:[^;]*;\s*)?([^;)]+)\)?/i);

        device =
            match && match[1]
                ? match[1].trim()
                : "Android device";

    } else if (/Windows/i.test(ua)) {
        device = "Windows device";
    } else if (/Macintosh/i.test(ua)) {
        device = "Mac";
    } else if (/Linux/i.test(ua)) {
        device = "Linux device";
    }


    if (/Edg/i.test(ua)) {
        browser = "Microsoft Edge";
    } else if (/Chrome/i.test(ua)) {
        browser = "Chrome";
    } else if (/Safari/i.test(ua)) {
        browser = "Safari";
    } else if (/Firefox/i.test(ua)) {
        browser = "Firefox";
    }


    return {
        device,
        browser,
        userAgent: ua
    };
}


/* =====================================================
   SESSION ID
===================================================== */

function getOrCreateSessionId() {

    const storageKey =
        "connectsphere_session_id";

    let sessionId =
        localStorage.getItem(storageKey);

    if (!sessionId) {

        sessionId =
            crypto.randomUUID();

        localStorage.setItem(
            storageKey,
            sessionId
        );
    }

    return sessionId;
}


/* =====================================================
   CREATE SESSION
===================================================== */

async function createSession(user) {

    currentSessionId =
        getOrCreateSessionId();

    const sessionRef = doc(
        db,
        "users",
        user.uid,
        "sessions",
        currentSessionId
    );

    const deviceInfo =
        getDeviceInformation();


    const existing =
        await getDoc(sessionRef);


    if (!existing.exists()) {

        await setDoc(sessionRef, {

            sessionId:
                currentSessionId,

            device:
                deviceInfo.device,

            browser:
                deviceInfo.browser,

            userAgent:
                deviceInfo.userAgent,

            createdAt:
                serverTimestamp(),

            lastActiveAt:
                serverTimestamp(),

            revoked:
                false

        });

    } else {

        await updateDoc(
            sessionRef,
            {
                lastActiveAt:
                    serverTimestamp(),

                revoked:
                    false
            }
        );
    }
}


/* =====================================================
   SESSION HEARTBEAT
===================================================== */

function startHeartbeat(user) {

    clearInterval(heartbeatTimer);


    heartbeatTimer =
        setInterval(async () => {

            if (!currentSessionId) {
                return;
            }


            const sessionRef =
                doc(
                    db,
                    "users",
                    user.uid,
                    "sessions",
                    currentSessionId
                );


            try {

                await updateDoc(
                    sessionRef,
                    {
                        lastActiveAt:
                            serverTimestamp()
                    }
                );

            } catch (error) {

                console.error(
                    "Session heartbeat error:",
                    error
                );
            }

        }, 60000);
}


/* =====================================================
   WATCH CURRENT SESSION
===================================================== */

function watchCurrentSession(user) {

    if (!currentSessionId) {
        return;
    }


    const sessionRef =
        doc(
            db,
            "users",
            user.uid,
            "sessions",
            currentSessionId
        );


    onSnapshot(
        sessionRef,
        async snapshot => {

            if (!snapshot.exists()) {
                return;
            }


            const data =
                snapshot.data();


            if (data.revoked === true) {

                clearInterval(
                    heartbeatTimer
                );


                showToast(
                    "This session has been signed out."
                );


                await signOut(auth);
            }

        }
    );
}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(timestamp) {

    if (!timestamp) {
        return "Unknown date";
    }


    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);


    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* =====================================================
   LOAD SESSIONS
===================================================== */

function loadSessions(user) {

    if (unsubscribeSessions) {
        unsubscribeSessions();
    }


    const sessionsRef =
        collection(
            db,
            "users",
            user.uid,
            "sessions"
        );


    const sessionsQuery =
        query(
            sessionsRef,
            orderBy(
                "lastActiveAt",
                "desc"
            )
        );


    unsubscribeSessions =
        onSnapshot(
            sessionsQuery,
            snapshot => {

                sessionsContainer.innerHTML = "";


                const sessions =
                    snapshot.docs
                        .map(item => ({
                            id: item.id,
                            ...item.data()
                        }))
                        .filter(
                            session =>
                                session.revoked !== true
                        );


                if (!sessions.length) {

                    sessionsContainer.innerHTML = `
                        <div class="no-sessions">
                            No sessions found.
                        </div>
                    `;

                    return;
                }


                sessions.forEach(
                    session => {

                        const item =
                            document.createElement("div");

                        item.className =
                            "session-item";


                        const isCurrent =
                            session.id ===
                            currentSessionId;


                        item.innerHTML = `

                            <div class="session-top">

                                <div class="session-device">
                                    ${escapeHTML(
                                        session.device ||
                                        "Unknown device"
                                    )}
                                </div>

                                ${
                                    isCurrent
                                    ? `
                                        <span class="current-label">
                                            This device
                                        </span>
                                    `
                                    : ""
                                }

                            </div>


                            <div class="session-details">

                                ${
                                    escapeHTML(
                                        session.browser ||
                                        "Unknown browser"
                                    )
                                }

                                <br>

                                Signed in:
                                ${formatDate(
                                    session.createdAt
                                )}

                                <br>

                                Last active:
                                ${formatDate(
                                    session.lastActiveAt
                                )}

                            </div>


                            ${
                                !isCurrent
                                ? `
                                    <button
                                        class="session-logout"
                                        type="button"
                                        data-session-id="${session.id}"
                                    >
                                        Log out
                                    </button>
                                `
                                : ""
                            }

                        `;


                        sessionsContainer.appendChild(
                            item
                        );
                    }
                );


                document
                    .querySelectorAll(
                        ".session-logout"
                    )
                    .forEach(button => {

                        button.addEventListener(
                            "click",
                            () => {

                                revokeSession(
                                    user,
                                    button.dataset.sessionId
                                );

                            }
                        );

                    });

            },

            error => {

                console.error(
                    "Session loading error:",
                    error
                );


                sessionsContainer.innerHTML = `
                    <div class="no-sessions">
                        Unable to load sessions.
                    </div>
                `;
            }
        );
}


/* =====================================================
   REVOKE ONE SESSION
===================================================== */

async function revokeSession(
    user,
    sessionId
) {

    if (
        !sessionId ||
        sessionId === currentSessionId
    ) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "users",
                user.uid,
                "sessions",
                sessionId
            ),
            {
                revoked: true,
                revokedAt: serverTimestamp()
            }
        );


        showToast(
            "The device session has been logged out."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to log out that session."
        );
    }
}


/* =====================================================
   LOG OUT OTHER SESSIONS
===================================================== */

async function logoutOtherSessions(user) {

    try {

        const sessionsRef =
            collection(
                db,
                "users",
                user.uid,
                "sessions"
            );


        const snapshot =
            await getDocs(
                query(
                    sessionsRef,
                    where(
                        "revoked",
                        "==",
                        false
                    )
                )
            );


        const updates =
            snapshot.docs
                .filter(
                    item =>
                        item.id !==
                        currentSessionId
                )
                .map(
                    item =>
                        updateDoc(
                            item.ref,
                            {
                                revoked: true,
                                revokedAt:
                                    serverTimestamp()
                            }
                        )
                );


        await Promise.all(updates);


        showToast(
            "All other sessions have been logged out."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to log out other sessions."
        );
    }
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =====================================================
   LOAD PROFILE
===================================================== */

async function loadProfile(user) {

    profileEmail.textContent =
        user.email || "";


    emailInput.value =
        user.email || "";


    const initial =
        getInitial(user);


    profileInitial.textContent =
        initial;

    headerInitial.textContent =
        initial;


    const profileRef =
        doc(
            db,
            "users",
            user.uid
        );


    try {

        const profileSnapshot =
            await getDoc(profileRef);


        if (profileSnapshot.exists()) {

            const data =
                profileSnapshot.data();


            firstNameInput.value =
                data.firstName || "";

            lastNameInput.value =
                data.lastName || "";

        }


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );
    }


    const first =
        firstNameInput.value.trim();

    const last =
        lastNameInput.value.trim();


    const fullName =
        `${first} ${last}`.trim();


    profileName.textContent =
        fullName ||
        user.displayName ||
        user.email ||
        "Account";


    emailVerificationStatus.textContent =
        user.emailVerified
            ? "Email verified"
            : "Email not verified";


    emailVerificationStatus.classList.toggle(
        "verified",
        user.emailVerified
    );


    emailVerificationStatus.classList.toggle(
        "unverified",
        !user.emailVerified
    );


    joinedDate.textContent =
        user.metadata?.creationTime
            ? `Joined on ${new Date(
                user.metadata.creationTime
            ).toLocaleDateString(
                undefined,
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            )}`
            : "Join date unavailable";


    const providers =
        user.providerData
            .map(provider =>
                provider.providerId
            );


    const methods = [];


    if (
        providers.includes(
            "google.com"
        )
    ) {
        methods.push("Google");
    }


    if (
        providers.includes(
            "password"
        )
    ) {
        methods.push(
            "email/password"
        );
    }


    signInMethod.textContent =
        methods.length
            ? `Signed in with ${methods.join(
                " and "
            )}`
            : "Sign-in method unavailable";
}


/* =====================================================
   SAVE PROFILE
===================================================== */

profileForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) {
            return;
        }


        saveProfileButton.disabled =
            true;


        try {

            const firstName =
                firstNameInput.value.trim();

            const lastName =
                lastNameInput.value.trim();


            const fullName =
                `${firstName} ${lastName}`.trim();


            await updateProfile(
                currentUser,
                {
                    displayName:
                        fullName
                }
            );


            await setDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                ),
                {
                    firstName,
                    lastName,
                    updatedAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );


            profileName.textContent =
                fullName ||
                currentUser.email;


            const initial =
                getInitial(
                    currentUser
                );


            profileInitial.textContent =
                initial;

            headerInitial.textContent =
                initial;


            showToast(
                "Profile updated successfully."
            );


        } catch (error) {

            console.error(error);

            showToast(
                "Unable to update your profile."
            );

        } finally {

            saveProfileButton.disabled =
                false;
        }
    }
);


/* =====================================================
   PASSWORD
===================================================== */

passwordForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) {
            return;
        }


        const currentPassword =
            document.getElementById(
                "currentPassword"
            ).value;

        const newPassword =
            document.getElementById(
                "newPassword"
            ).value;

        const confirmPassword =
            document.getElementById(
                "confirmPassword"
            ).value;


        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {

            showToast(
                "Please complete all password fields."
            );

            return;
        }


        if (
            newPassword !==
            confirmPassword
        ) {

            showToast(
                "The passwords do not match."
            );

            return;
        }


        if (newPassword.length < 6) {

            showToast(
                "Password must be at least 6 characters."
            );

            return;
        }


        passwordButton.disabled =
            true;


        try {

            const credential =
                EmailAuthProvider.credential(
                    currentUser.email,
                    currentPassword
                );


            await reauthenticateWithCredential(
                currentUser,
                credential
            );


            await updatePassword(
                currentUser,
                newPassword
            );


            passwordForm.reset();


            showToast(
                "Password updated successfully."
            );


        } catch (error) {

            console.error(error);

            if (
                error.code ===
                "auth/wrong-password"
            ) {

                showToast(
                    "Current password is incorrect."
                );

            } else {

                showToast(
                    "Unable to update password."
                );
            }

        } finally {

            passwordButton.disabled =
                false;
        }
    }
);


/* =====================================================
   DELETE ACCOUNT
===================================================== */

deleteAccountButton.addEventListener(
    "click",
    async () => {

        if (!currentUser) {
            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to permanently delete your account?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await deleteUser(
                currentUser
            );


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(error);


            if (
                error.code ===
                "auth/requires-recent-login"
            ) {

                showToast(
                    "Please sign in again before deleting your account."
                );

            } else {

                showToast(
                    "Unable to delete your account."
                );
            }
        }
    }
);


/* =====================================================
   LOGOUT OTHER SESSIONS
===================================================== */

logoutOtherSessionsButton.addEventListener(
    "click",
    async () => {

        if (!currentUser) {
            return;
        }


        const confirmed =
            window.confirm(
                "Log out of every other device?"
            );


        if (!confirmed) {
            return;
        }


        await logoutOtherSessions(
            currentUser
        );
    }
);


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "signin.html";

            return;
        }


        currentUser =
            user;


        try {

            await createSession(
                user
            );


            await loadProfile(
                user
            );


            loadSessions(
                user
            );


            startHeartbeat(
                user
            );


            watchCurrentSession(
                user
            );


        } catch (error) {

            console.error(
                "Profile initialization error:",
                error
            );


            showToast(
                "Unable to load your account."
            );
        }
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
   DARK MODE
===================================================== */

themeButton.addEventListener(
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
