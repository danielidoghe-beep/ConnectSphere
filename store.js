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

const listingsContainer =
    document.getElementById("listingsContainer");

const productModal =
    document.getElementById("productModal");

const noticeModal =
    document.getElementById("noticeModal");

const modalProductName =
    document.getElementById("modalProductName");

const modalProductDescription =
    document.getElementById("modalProductDescription");

const modalProductImage =
    document.getElementById("modalProductImage");

const modalProductPrice =
    document.getElementById("modalProductPrice");

const noticeProductName =
    document.getElementById("noticeProductName");

const noticeProductPrice =
    document.getElementById("noticeProductPrice");

const buyNowButton =
    document.getElementById("buyNowButton");

const cancelNoticeButton =
    document.getElementById("cancelNoticeButton");

const closeProductButton =
    document.getElementById("closeProductButton");


/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let selectedProduct = null;


/* =====================================================
   MONEY FORMAT
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
   LOAD PRODUCTS
===================================================== */

function loadProducts() {

    const productsRef =
        collection(db, "products");

    const productsQuery =
        query(
            productsRef,
            orderBy("createdAt", "desc")
        );

    onSnapshot(
        productsQuery,
        snapshot => {

            listingsContainer.innerHTML = "";

            const products =
                snapshot.docs.map(item => ({
                    id: item.id,
                    ...item.data()
                }));


            /*
             * FIREBASE IS EMPTY
             */

            if (!products.length) {

                listingsContainer.innerHTML = `
                    <div class="empty-products">
                        <h3>No products available</h3>
                        <p>
                            There are no products available
                            at the moment.
                        </p>
                    </div>
                `;

                return;
            }


            /*
             * CREATE PRODUCTS
             */

            products.forEach(product => {

                const price =
                    Number(product.price) || 0;

                const card =
                    document.createElement("article");

                card.className =
                    "product-card";


                card.innerHTML = `

                    <div class="product-image-wrap">

                        ${
                            product.imageUrl
                            ? `
                                <img
                                    class="product-image"
                                    src="${escapeHTML(
                                        product.imageUrl
                                    )}"
                                    alt="${escapeHTML(
                                        product.name
                                    )}"
                                    loading="lazy"
                                >
                            `
                            : `
                                <div class="product-image-placeholder">
                                    No image
                                </div>
                            `
                        }

                    </div>


                    <div class="product-content">

                        <h3>
                            ${escapeHTML(
                                product.name
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


                        <p class="product-description">
                            ${escapeHTML(
                                product.description || ""
                            )}
                        </p>


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


                listingsContainer.appendChild(card);
            });


            /*
             * BUY BUTTONS
             */

            document
                .querySelectorAll(
                    ".product-buy-button"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const productId =
                                button.dataset.productId;

                            const product =
                                products.find(
                                    item =>
                                        item.id ===
                                        productId
                                );

                            if (!product) {
                                return;
                            }

                            openProductModal(product);
                        }
                    );
                });

        },

        error => {

            console.error(
                "Products loading error:",
                error
            );

            listingsContainer.innerHTML = `
                <div class="empty-products">
                    <h3>Unable to load products</h3>
                    <p>
                        Please try again later.
                    </p>
                </div>
            `;
        }
    );
}


/* =====================================================
   PRODUCT MODAL
===================================================== */

function openProductModal(product) {

    selectedProduct =
        product;


    modalProductName.textContent =
        product.name || "Product";


    modalProductDescription.textContent =
        product.description || "";


    modalProductPrice.textContent =
        formatMoney(product.price);


    if (product.imageUrl) {

        modalProductImage.src =
            product.imageUrl;

        modalProductImage.alt =
            product.name || "Product";

        modalProductImage.style.display =
            "block";

    } else {

        modalProductImage.removeAttribute(
            "src"
        );

        modalProductImage.style.display =
            "none";
    }


    productModal.classList.add("open");

    document.body.classList.add(
        "modal-open"
    );
}


/* =====================================================
   CLOSE PRODUCT MODAL
===================================================== */

function closeProductModal() {

    productModal.classList.remove(
        "open"
    );

    document.body.classList.remove(
        "modal-open"
    );

    selectedProduct =
        null;
}


closeProductButton?.addEventListener(
    "click",
    closeProductModal
);


/* =====================================================
   BUY
===================================================== */

document
    .querySelector(
        "#productBuyButton"
    )
    ?.addEventListener(
        "click",
        () => {

            if (!selectedProduct) {
                return;
            }

            openImportantNotice(
                selectedProduct
            );
        }
    );


/* =====================================================
   IMPORTANT NOTICE
===================================================== */

function openImportantNotice(product) {

    noticeProductName.textContent =
        product.name || "Product";


    /*
     * REAL FIREBASE PRICE
     */

    noticeProductPrice.textContent =
        formatMoney(product.price);


    noticeModal.classList.add(
        "open"
    );
}


/* =====================================================
   CANCEL NOTICE
===================================================== */

cancelNoticeButton?.addEventListener(
    "click",
    () => {

        noticeModal.classList.remove(
            "open"
        );
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
             * READ THE REAL USER WALLET
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
                await getDoc(walletRef);


            let walletBalance = 0;


            if (walletSnapshot.exists()) {

                const walletData =
                    walletSnapshot.data();


                walletBalance =
                    Number(
                        walletData.balance
                    ) || 0;
            }


            /*
             * REAL PRODUCT PRICE
             */

            const productPrice =
                Number(
                    selectedProduct.price
                ) || 0;


            /*
             * CALCULATE SHORTAGE
             */

            const amountNeeded =
                Math.max(
                    0,
                    productPrice -
                    walletBalance
                );


            /*
             * NOT ENOUGH MONEY
             */

            if (amountNeeded > 0) {

                noticeModal.classList.remove(
                    "open"
                );

                closeProductModal();


                /*
                 * SEND EXACT AMOUNT
                 * TO WALLET PAGE
                 */

                const walletUrl =
                    new URL(
                        "wallet.html",
                        window.location.href
                    );


                walletUrl.searchParams.set(
                    "amount",
                    String(amountNeeded)
                );


                walletUrl.searchParams.set(
                    "productId",
                    selectedProduct.id
                );


                window.location.href =
                    walletUrl.toString();

                return;
            }


            /*
             * ENOUGH BALANCE
             *
             * The actual purchase should be
             * performed by trusted backend/
             * Cloud Function logic rather than
             * trusting the browser.
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
                "Unable to check your wallet balance. Please try again."
            );

        } finally {

            buyNowButton.disabled =
                false;

            buyNowButton.textContent =
                "BUY NOW";
        }
    }
);


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    user => {

        currentUser =
            user || null;
    }
);


/* =====================================================
   START
===================================================== */

loadProducts();
