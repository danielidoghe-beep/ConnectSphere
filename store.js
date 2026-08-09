import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =====================================================
   ELEMENTS
===================================================== */

const productsContainer =
    document.getElementById("productsContainer");

const listingCount =
    document.getElementById("listingCount");

const balanceAmount =
    document.getElementById("balanceAmount");

const headerInitial =
    document.getElementById("headerInitial");

const filterButton =
    document.getElementById("filterButton");

const drawerOverlay =
    document.getElementById("drawerOverlay");

const categoryDrawer =
    document.getElementById("categoryDrawer");

const drawerClose =
    document.getElementById("drawerClose");

const categoryList =
    document.getElementById("categoryList");

const categorySearch =
    document.getElementById("categorySearch");

const purchaseOverlay =
    document.getElementById("purchaseOverlay");

const modalClose =
    document.getElementById("modalClose");

const purchaseProductName =
    document.getElementById("purchaseProductName");

const purchaseAmount =
    document.getElementById("purchaseAmount");

const buyNowButton =
    document.getElementById("buyNowButton");

const topupOverlay =
    document.getElementById("topupOverlay");

const topupClose =
    document.getElementById("topupClose");

const requiredTopupAmount =
    document.getElementById("requiredTopupAmount");

const goToWalletButton =
    document.getElementById("goToWalletButton");

const menuButton =
    document.getElementById("menuButton");

const menuOverlay =
    document.getElementById("menuOverlay");

const sideMenu =
    document.getElementById("sideMenu");

const menuClose =
    document.getElementById("menuClose");

const themeButton =
    document.getElementById("themeButton");

const notificationCount =
    document.getElementById("notificationCount");

const profileButton =
    document.getElementById("profileButton");


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let allProducts = [];

let selectedProduct = null;

let selectedCategory = null;

let userBalance = 0;


/* =====================================================
   MONEY
===================================================== */

function formatMoney(value) {

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "₦0";
    }

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    }).format(amount);
}


/* =====================================================
   HTML ESCAPE
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
   LOAD USER
===================================================== */

async function loadUserData(user) {

    if (!user) {
        return;
    }

    try {

        /*
         * PROFILE
         */

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnapshot =
            await getDoc(userRef);

        let firstName = "";
        let lastName = "";

        if (userSnapshot.exists()) {

            const data =
                userSnapshot.data();

            firstName =
                data.firstName || "";

            lastName =
                data.lastName || "";
        }


        /*
         * PROFILE INITIAL
         */

        const name =
            `${firstName} ${lastName}`.trim()
            || user.displayName
            || user.email
            || "A";

        headerInitial.textContent =
            name.charAt(0).toUpperCase();


        /*
         * WALLET
         */

        const walletRef =
            doc(
                db,
                "users",
                user.uid,
                "wallet",
                "balance"
            );

        const walletSnapshot =
            await getDoc(walletRef);


        if (walletSnapshot.exists()) {

            const walletData =
                walletSnapshot.data();

            userBalance =
                Number(walletData.balance) || 0;

        } else {

            userBalance = 0;
        }


        balanceAmount.textContent =
            formatMoney(userBalance);

    } catch (error) {

        console.error(
            "Unable to load user data:",
            error
        );

        userBalance = 0;

        balanceAmount.textContent =
            formatMoney(0);
    }
}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

function loadProducts() {

    if (!productsContainer) {
        return;
    }


    const productsRef =
        collection(
            db,
            "products"
        );


    const productsQuery =
        query(
            productsRef,
            orderBy(
                "createdAt",
                "desc"
            )
        );


    onSnapshot(
        productsQuery,

        snapshot => {

            allProducts =
                snapshot.docs.map(
                    productDoc => ({
                        id:
                            productDoc.id,

                        ...productDoc.data()
                    })
                );


            renderProducts(
                allProducts
            );


            buildCategories(
                allProducts
            );
        },

        error => {

            console.error(
                "Firebase products error:",
                error
            );


            productsContainer.innerHTML = `
                <div class="empty-products">
                    <h3>Unable to load products</h3>
                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Please try again later."
                        )}
                    </p>
                </div>
            `;

            listingCount.textContent =
                "0";
        }
    );
}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts(products) {

    productsContainer.innerHTML = "";


    listingCount.textContent =
        String(products.length);


    if (!products.length) {

        productsContainer.innerHTML = `
            <div class="empty-products">
                <h3>No products available</h3>
                <p>
                    Products will appear here
                    when they are added.
                </p>
            </div>
        `;

        return;
    }


    products.forEach(
        product => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "product-card";


            const price =
                Number(product.price) || 0;


            const image =
                product.imageUrl
                    ? `
                        <img
                            class="product-image"
                            src="${escapeHTML(
                                product.imageUrl
                            )}"
                            alt="${escapeHTML(
                                product.name ||
                                "Product"
                            )}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div class="product-image-placeholder">
                            No image
                        </div>
                    `;


            card.innerHTML = `

                <div class="product-image-wrap">

                    ${image}

                </div>


                <div class="product-content">

                    <h3>
                        ${escapeHTML(
                            product.name ||
                            "Product"
                        )}
                    </h3>


                    ${
                        product.category
                            ? `
                                <div class="product-category">
                                    ${escapeHTML(
                                        product.category
                                    )}
                                </div>
                            `
                            : ""
                    }


                    ${
                        product.description
                            ? `
                                <p class="product-description">
                                    ${escapeHTML(
                                        product.description
                                    )}
                                </p>
                            `
                            : ""
                    }


                    <div class="product-bottom">

                        <strong class="product-price">
                            ${formatMoney(price)}
                        </strong>


                        <button
                            type="button"
                            class="product-buy-button"
                            data-product-id="${escapeHTML(
                                product.id
                            )}"
                        >
                            Buy
                        </button>

                    </div>

                </div>
            `;


            productsContainer.appendChild(
                card
            );
        }
    );


    attachBuyButtons();
}


/* =====================================================
   BUY BUTTONS
===================================================== */

function attachBuyButtons() {

    const buttons =
        document.querySelectorAll(
            ".product-buy-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const productId =
                        button.dataset.productId;


                    const product =
                        allProducts.find(
                            item =>
                                item.id ===
                                productId
                        );


                    if (!product) {
                        return;
                    }


                    openPurchaseNotice(
                        product
                    );
                }
            );
        }
    );
}


/* =====================================================
   PURCHASE NOTICE
===================================================== */

function openPurchaseNotice(
    product
) {

    selectedProduct =
        product;


    purchaseProductName.textContent =
        product.name ||
        "Product";


    purchaseAmount.textContent =
        formatMoney(
            product.price
        );


    purchaseOverlay.classList.add(
        "open"
    );


    document.body.classList.add(
        "modal-open"
    );
}


/* =====================================================
   CLOSE PURCHASE NOTICE
===================================================== */

function closePurchaseNotice() {

    purchaseOverlay.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "modal-open"
    );


    selectedProduct =
        null;
}


modalClose?.addEventListener(
    "click",
    closePurchaseNotice
);


/* =====================================================
   CLICK OUTSIDE PURCHASE MODAL
===================================================== */

purchaseOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            purchaseOverlay
        ) {
            closePurchaseNotice();
        }
    }
);


/* =====================================================
   BUY NOW
===================================================== */

buyNowButton?.addEventListener(
    "click",
    async () => {

        if (!selectedProduct) {
            return;
        }


        if (!currentUser) {

            window.location.href =
                "signin.html";

            return;
        }


        buyNowButton.disabled =
            true;

        buyNowButton.textContent =
            "Checking...";


        try {

            /*
             * ALWAYS GET THE LATEST
             * BALANCE FROM FIREBASE
             */

            const walletRef =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "wallet",
                    "balance"
                );


            const walletSnapshot =
                await getDoc(
                    walletRef
                );


            let balance = 0;


            if (
                walletSnapshot.exists()
            ) {

                const walletData =
                    walletSnapshot.data();

                balance =
                    Number(
                        walletData.balance
                    ) || 0;
            }


            userBalance =
                balance;


            balanceAmount.textContent =
                formatMoney(balance);


            /*
             * REAL FIREBASE PRODUCT PRICE
             */

            const price =
                Number(
                    selectedProduct.price
                ) || 0;


            /*
             * CALCULATE SHORTAGE
             */

            const shortage =
                Math.max(
                    0,
                    price - balance
                );


            /*
             * NOT ENOUGH BALANCE
             */

            if (shortage > 0) {

                closePurchaseNotice();


                requiredTopupAmount.textContent =
                    formatMoney(
                        shortage
                    );


                topupOverlay.classList.add(
                    "open"
                );


                return;
            }


            /*
             * ENOUGH BALANCE
             *
             * Go to checkout.
             *
             * The actual balance deduction
             * MUST be performed securely
             * through trusted Firebase
             * backend/transaction logic.
             */

            window.location.href =
                `checkout.html?productId=${
                    encodeURIComponent(
                        selectedProduct.id
                    )
                }`;

        } catch (error) {

            console.error(
                "Purchase check failed:",
                error
            );


            alert(
                "Unable to check your balance. Please try again."
            );

        } finally {

            buyNowButton.disabled =
                false;

            buyNowButton.textContent =
                "Buy now";
        }
    }
);


/* =====================================================
   TOP-UP MODAL
===================================================== */

function closeTopupModal() {

    topupOverlay.classList.remove(
        "open"
    );
}


topupClose?.addEventListener(
    "click",
    closeTopupModal
);


topupOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            topupOverlay
        ) {
            closeTopupModal();
        }
    }
);


/* =====================================================
   GO TO WALLET
===================================================== */

goToWalletButton?.addEventListener(
    "click",
    () => {

        if (!selectedProduct) {

            window.location.href =
                "wallet.html";

            return;
        }


        const price =
            Number(
                selectedProduct.price
            ) || 0;


        const amount =
            Math.max(
                0,
                price - userBalance
            );


        const walletURL =
            new URL(
                "wallet.html",
                window.location.href
            );


        walletURL.searchParams.set(
            "amount",
            String(amount)
        );


        walletURL.searchParams.set(
            "productId",
            selectedProduct.id
        );


        topupOverlay.classList.remove(
            "open"
        );


        window.location.href =
            walletURL.toString();
    }
);


/* =====================================================
   CATEGORIES
===================================================== */

function buildCategories(
    products
) {

    if (!categoryList) {
        return;
    }


    const categories =
        [
            ...new Set(
                products
                    .map(
                        product =>
                            product.category
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                String(a).localeCompare(
                    String(b)
                )
        );


    categoryList.innerHTML =
        "";


    if (!categories.length) {

        categoryList.innerHTML = `
            <div class="empty-categories">
                No categories available
            </div>
        `;

        return;
    }


    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.className =
                "category-item";


            button.dataset.category =
                category;


            button.textContent =
                category;


            categoryList.appendChild(
                button
            );


            button.addEventListener(
                "click",
                () => {

                    selectedCategory =
                        category;


                    const filtered =
                        allProducts.filter(
                            product =>
                                String(
                                    product.category
                                ).toLowerCase() ===
                                String(
                                    category
                                ).toLowerCase()
                        );


                    renderProducts(
                        filtered
                    );


                    closeDrawer();
                }
            );
        }
    );
}


/* =====================================================
   CATEGORY SEARCH
===================================================== */

categorySearch?.addEventListener(
    "input",
    () => {

        const search =
            categorySearch.value
                .trim()
                .toLowerCase();


        document
            .querySelectorAll(
                ".category-item"
            )
            .forEach(
                item => {

                    const name =
                        item.textContent
                            .toLowerCase();


                    item.style.display =
                        name.includes(
                            search
                        )
                            ? ""
                            : "none";
                }
            );
    }
);


/* =====================================================
   FILTER BUTTON
===================================================== */

filterButton?.addEventListener(
    "click",
    openDrawer
);


function openDrawer() {

    categoryDrawer?.classList.add(
        "open"
    );

    drawerOverlay?.classList.add(
        "open"
    );

    document.body.classList.add(
        "drawer-open"
    );
}


function closeDrawer() {

    categoryDrawer?.classList.remove(
        "open"
    );

    drawerOverlay?.classList.remove(
        "open"
    );

    document.body.classList.remove(
        "drawer-open"
    );
}


drawerClose?.addEventListener(
    "click",
    closeDrawer
);


drawerOverlay?.addEventListener(
    "click",
    closeDrawer
);


/* =====================================================
   RESET CATEGORY WHEN HEADING FILTER IS OPENED
===================================================== */

categoryDrawer?.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                ".drawer-header"
            )
        ) {
            return;
        }
    }
);


/* =====================================================
   MENU
===================================================== */

function openMenu() {

    sideMenu?.classList.add(
        "open"
    );

    menuOverlay?.classList.add(
        "open"
    );
}


function closeMenu() {

    sideMenu?.classList.remove(
        "open"
    );

    menuOverlay?.classList.remove(
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
   PROFILE
===================================================== */

profileButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "profile.html";
    }
);


/* =====================================================
   THEME
===================================================== */

themeButton?.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-mode"
        );


        localStorage.setItem(
            "connectsphere_dark_mode",
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
        "connectsphere_dark_mode"
    ) === "true"
) {

    document.body.classList.add(
        "dark-mode"
    );
}


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,

    async user => {

        if (!user) {

            currentUser =
                null;

            balanceAmount.textContent =
                formatMoney(0);

            return;
        }


        currentUser =
            user;


        await loadUserData(
            user
        );
    }
);


/* =====================================================
   START FIREBASE PRODUCTS
===================================================== */

loadProducts();
