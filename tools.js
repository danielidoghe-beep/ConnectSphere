import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    onSnapshot,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   ELEMENTS
===================================================== */

const toolsContainer =
    document.getElementById("toolsContainer");

const categoryTabs =
    document.getElementById("categoryTabs");

const toolSearch =
    document.getElementById("toolSearch");

const totalToolsText =
    document.getElementById("totalToolsText");

const balanceAmount =
    document.getElementById("balanceAmount");

const headerInitial =
    document.getElementById("headerInitial");

const notificationCount =
    document.getElementById("notificationCount");


/* MODAL */

const toolModal =
    document.getElementById("toolModal");

const modalClose =
    document.getElementById("modalClose");

const modalImages =
    document.getElementById("modalImages");

const modalToolName =
    document.getElementById("modalToolName");

const modalToolCategory =
    document.getElementById("modalToolCategory");

const modalToolDescription =
    document.getElementById("modalToolDescription");

const modalToolPrice =
    document.getElementById("modalToolPrice");

const buyToolButton =
    document.getElementById("buyToolButton");


/* NOTICE */

const noticeOverlay =
    document.getElementById("noticeOverlay");

const noticeClose =
    document.getElementById("noticeClose");

const noticeTitle =
    document.getElementById("noticeTitle");

const noticePrice =
    document.getElementById("noticePrice");

const confirmBuyButton =
    document.getElementById("confirmBuyButton");


/* MENU */

const menuButton =
    document.getElementById("menuButton");

const menuOverlay =
    document.getElementById("menuOverlay");

const sideMenu =
    document.getElementById("sideMenu");

const menuClose =
    document.getElementById("menuClose");


/* THEME */

const themeButton =
    document.getElementById("themeButton");


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let allTools = [];

let selectedCategory = "All";

let selectedTool = null;


/* =====================================================
   MONEY
===================================================== */

function formatMoney(amount) {

    const value =
        Number(amount);

    if (!Number.isFinite(value)) {
        return "₦0";
    }

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(value);
}


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
   GET IMAGES
===================================================== */

function getToolImages(tool) {

    let images = [];


    /*
     * Supports:

     * images: [...]
     *
     * imageUrls: [...]
     *
     * photoUrls: [...]
     *
     * imageUrl: "..."
     *
     * image: "..."
     */

    if (Array.isArray(tool.images)) {

        images.push(
            ...tool.images
        );
    }


    if (Array.isArray(tool.imageUrls)) {

        images.push(
            ...tool.imageUrls
        );
    }


    if (Array.isArray(tool.photoUrls)) {

        images.push(
            ...tool.photoUrls
        );
    }


    if (tool.imageUrl) {

        images.push(
            tool.imageUrl
        );
    }


    if (tool.image) {

        images.push(
            tool.image
        );
    }


    return [
        ...new Set(
            images.filter(
                image =>
                    typeof image === "string" &&
                    image.trim()
            )
        )
    ];
}


/* =====================================================
   LOAD TOOLS
===================================================== */

function loadTools() {

    toolsContainer.innerHTML = `
        <div class="loading-state">
            Loading tools...
        </div>
    `;


    const toolsRef =
        collection(
            db,
            "tools"
        );


    onSnapshot(
        toolsRef,

        snapshot => {

            allTools =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );


            /*
             * SORT WITHOUT REQUIRING
             * FIRESTORE INDEXES
             */

            allTools.sort(
                (a, b) => {

                    const aTime =
                        getTimestampValue(
                            a.createdAt
                        );

                    const bTime =
                        getTimestampValue(
                            b.createdAt
                        );

                    return bTime - aTime;
                }
            );


            totalToolsText.textContent =
                `${allTools.length} tools available`;


            buildCategories();

            renderTools();

        },

        error => {

            console.error(
                "Tools Firebase error:",
                error
            );


            toolsContainer.innerHTML = `
                <div class="empty-state">

                    <h3>
                        Unable to load tools
                    </h3>

                    <p>
                        Please try again later.
                    </p>

                </div>
            `;
        }
    );
}


/* =====================================================
   TIMESTAMP
===================================================== */

function getTimestampValue(timestamp) {

    if (!timestamp) {
        return 0;
    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {
        return timestamp.toMillis();
    }


    if (
        typeof timestamp.toDate ===
        "function"
    ) {
        return timestamp.toDate().getTime();
    }


    const date =
        new Date(timestamp);


    const value =
        date.getTime();


    return Number.isFinite(value)
        ? value
        : 0;
}


/* =====================================================
   CATEGORIES
===================================================== */

function buildCategories() {

    categoryTabs.innerHTML = "";


    const categoryMap =
        new Map();


    allTools.forEach(
        tool => {

            const category =
                String(
                    tool.category ||
                    "Uncategorized"
                ).trim();


            categoryMap.set(
                category,
                (categoryMap.get(category) || 0) + 1
            );
        }
    );


    const allButton =
        createCategoryButton(
            "All",
            allTools.length
        );


    categoryTabs.appendChild(
        allButton
    );


    categoryMap.forEach(
        (count, category) => {

            const button =
                createCategoryButton(
                    category,
                    count
                );

            categoryTabs.appendChild(
                button
            );
        }
    );
}


/* =====================================================
   CATEGORY BUTTON
===================================================== */

function createCategoryButton(
    category,
    count
) {

    const button =
        document.createElement(
            "button"
        );


    button.type = "button";

    button.className =
        "category-tab";


    if (
        category ===
        selectedCategory
    ) {
        button.classList.add(
            "active"
        );
    }


    button.innerHTML = `

        <span>
            ${escapeHTML(category)}
        </span>

        <span class="category-count">
            ${count}
        </span>

    `;


    button.addEventListener(
        "click",
        () => {

            selectedCategory =
                category;

            buildCategories();

            renderTools();
        }
    );


    return button;
}


/* =====================================================
   FILTER TOOLS
===================================================== */

function getFilteredTools() {

    const search =
        toolSearch.value
            .trim()
            .toLowerCase();


    return allTools.filter(
        tool => {

            const category =
                String(
                    tool.category ||
                    "Uncategorized"
                );


            const matchesCategory =
                selectedCategory ===
                "All" ||
                category ===
                selectedCategory;


            if (!matchesCategory) {
                return false;
            }


            if (!search) {
                return true;
            }


            const searchableText = [

                tool.name,

                tool.description,

                tool.category,

                ...(Array.isArray(tool.tags)
                    ? tool.tags
                    : [])

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchableText.includes(
                search
            );
        }
    );
}


/* =====================================================
   RENDER
===================================================== */

function renderTools() {

    const tools =
        getFilteredTools();


    toolsContainer.innerHTML = "";


    if (!tools.length) {

        toolsContainer.innerHTML = `
            <div class="empty-state">

                <h3>
                    No tools found
                </h3>

                <p>
                    ${
                        allTools.length
                        ? "Try another search or category."
                        : "There are no tools available yet."
                    }
                </p>

            </div>
        `;

        return;
    }


    tools.forEach(
        tool => {

            const card =
                createToolCard(
                    tool
                );

            toolsContainer.appendChild(
                card
            );
        }
    );
}


/* =====================================================
   TOOL CARD
===================================================== */

function createToolCard(tool) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "tool-card";


    const images =
        getToolImages(tool);


    const imageHTML =
        images.length
        ? `

            <div class="tool-images">

                ${
                    images
                        .slice(0, 4)
                        .map(
                            image => `
                                <img
                                    class="tool-image ${
                                        images.length === 1
                                        ? "tool-image-single"
                                        : ""
                                    }"
                                    src="${escapeHTML(image)}"
                                    alt="${escapeHTML(
                                        tool.name ||
                                        "Tool"
                                    )}"
                                    loading="lazy"
                                >
                            `
                        )
                        .join("")
                }

            </div>

        `
        : `

            <div class="tool-images">

                <div class="tool-image-placeholder">
                    No image
                </div>

            </div>

        `;


    const price =
        Number(tool.price) || 0;


    const category =
        tool.category ||
        "Uncategorized";


    card.innerHTML = `

        ${imageHTML}


        <div class="tool-content">

            <h2 class="tool-name">

                ${escapeHTML(
                    tool.name ||
                    "Untitled tool"
                )}

            </h2>


            ${
                tool.description
                ? `
                    <p class="tool-description">
                        ${escapeHTML(
                            tool.description
                        )}
                    </p>
                `
                : ""
            }


            <div class="tool-category">

                ${escapeHTML(
                    category
                )}

            </div>


            <div class="tool-bottom">

                <strong class="tool-price">

                    ${formatMoney(
                        price
                    )}

                </strong>


                <button
                    type="button"
                    class="tool-info-button"
                    aria-label="View tool"
                >
                    i
                </button>

            </div>

        </div>

    `;


    card
        .querySelector(
            ".tool-info-button"
        )
        .addEventListener(
            "click",
            () => {

                openToolModal(
                    tool
                );
            }
        );


    return card;
}


/* =====================================================
   TOOL MODAL
===================================================== */

function openToolModal(tool) {

    selectedTool =
        tool;


    modalToolName.textContent =
        tool.name ||
        "Tool";


    modalToolCategory.textContent =
        tool.category ||
        "Uncategorized";


    modalToolDescription.textContent =
        tool.description ||
        "No description available.";


    modalToolPrice.textContent =
        formatMoney(
            tool.price
        );


    renderModalImages(
        getToolImages(tool)
    );


    toolModal.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";
}


/* =====================================================
   MODAL IMAGES
===================================================== */

function renderModalImages(images) {

    modalImages.innerHTML = "";


    if (!images.length) {

        modalImages.innerHTML = `
            <div class="tool-image-placeholder">
                No image
            </div>
        `;

        return;
    }


    images.forEach(
        image => {

            const img =
                document.createElement(
                    "img"
                );


            img.src =
                image;

            img.alt =
                selectedTool?.name ||
                "Tool";


            modalImages.appendChild(
                img
            );
        }
    );
}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeToolModal() {

    toolModal.classList.remove(
        "open"
    );


    document.body.style.overflow =
        "";
}


modalClose.addEventListener(
    "click",
    closeToolModal
);


/* =====================================================
   OPEN PURCHASE NOTICE
===================================================== */

buyToolButton.addEventListener(
    "click",
    () => {

        if (!selectedTool) {
            return;
        }


        noticeTitle.textContent =
            "Important notice";


        noticePrice.textContent =
            formatMoney(
                selectedTool.price
            );


        noticeOverlay.classList.add(
            "open"
        );
    }
);


/* =====================================================
   CLOSE NOTICE
===================================================== */

noticeClose.addEventListener(
    "click",
    () => {

        noticeOverlay.classList.remove(
            "open"
        );
    }
);


/* =====================================================
   CONFIRM PURCHASE
===================================================== */

confirmBuyButton.addEventListener(
    "click",
    async () => {

        if (!selectedTool) {
            return;
        }


        if (!currentUser) {

            window.location.href =
                "signin.html";

            return;
        }


        /*
         * We don't deduct the balance here
         * from the browser.
         *
         * The actual purchase should be
         * completed by your trusted backend/
         * Cloud Function so a user cannot
         * manipulate their balance.
         */

        const productId =
            encodeURIComponent(
                selectedTool.id
            );


        window.location.href =
            `checkout.html?toolId=${productId}`;
    }
);


/* =====================================================
   SEARCH
===================================================== */

toolSearch.addEventListener(
    "input",
    renderTools
);


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    async user => {

        currentUser =
            user || null;


        if (!user) {

            balanceAmount.textContent =
                "₦0";

            headerInitial.textContent =
                "?";

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


        await loadUserBalance(
            user
        );


        await loadNotificationCount(
            user
        );
    }
);


/* =====================================================
   USER BALANCE
===================================================== */

async function loadUserBalance(user) {

    try {

        const walletRef =
            doc(
                db,
                "users",
                user.uid,
                "wallet",
                "balance"
            );


        const snapshot =
            await getDoc(
                walletRef
            );


        if (!snapshot.exists()) {

            balanceAmount.textContent =
                "₦0";

            return;
        }


        const data =
            snapshot.data();


        balanceAmount.textContent =
            formatMoney(
                data.balance
            );

    } catch (error) {

        console.error(
            "Balance loading error:",
            error
        );

        balanceAmount.textContent =
            "₦0";
    }
}


/* =====================================================
   NOTIFICATIONS
===================================================== */

async function loadNotificationCount(user) {

    try {

        /*
         * Supports a user notification
         * counter document if you create one.
         */

        const notificationRef =
            doc(
                db,
                "users",
                user.uid,
                "notifications",
                "summary"
            );


        const snapshot =
            await getDoc(
                notificationRef
            );


        if (!snapshot.exists()) {

            notificationCount.textContent =
                "0";

            return;
        }


        const data =
            snapshot.data();


        const count =
            Number(
                data.unreadCount
            ) || 0;


        notificationCount.textContent =
            count > 99
                ? "99+"
                : String(count);

    } catch (error) {

        console.error(
            "Notification loading error:",
            error
        );

        notificationCount.textContent =
            "0";
    }
}


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


menuClose.addEventListener(
    "click",
    closeMenu
);


menuOverlay.addEventListener(
    "click",
    closeMenu
);


/* =====================================================
   PROFILE
===================================================== */

document
    .getElementById(
        "profileButton"
    )
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "profile.html";
        }
    );


/* =====================================================
   THEME
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


/* =====================================================
   MODAL BACKDROP
===================================================== */

toolModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            toolModal
        ) {
            closeToolModal();
        }
    }
);


noticeOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            noticeOverlay
        ) {
            noticeOverlay.classList.remove(
                "open"
            );
        }
    }
);


/* =====================================================
   START
===================================================== */

loadTools();
