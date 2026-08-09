import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyAKAD0Gxtk4XxMmnR_kpjmy5VLoX72Dtls",
    authDomain: "connectsphere-7a679.firebaseapp.com",
    projectId: "connectsphere-7a679",
    storageBucket: "connectsphere-7a679.firebasestorage.app",
    messagingSenderId: "748741698521",
    appId: "1:748741698521:web:ea08d28f31a4d8638c2fc8",
    measurementId: "G-WRQ5GX3KMZ"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


export {
    app,
    auth,
    db
};
