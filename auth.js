// ============================================================
//  Firebase Authentication for Connecsphere login page
//  Uses the Firebase v10 modular SDK from the CDN (no build step,
//  works directly on GitHub Pages).
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ------------------------------------------------------------
//  YOUR FIREBASE CONFIG
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAKAD0Gxtk4XxMmnR_kpjmy5VLoX72Dtls",
  authDomain: "connectsphere-7a679.firebaseapp.com",
  projectId: "connectsphere-7a679",
  storageBucket: "connectsphere-7a679.firebasestorage.app",
  messagingSenderId: "748741698521",
  appId: "1:748741698521:web:ea08d28f31a4d8638c2fc8",
  measurementId: "G-WRQ5GX3KMZ",
};

// Where to send users after a successful login.
const REDIRECT_URL = "./index.html";
// ------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ---------- Element references ----------
const form = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("remember");
const messageBox = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const googleBtn = document.getElementById("googleBtn");
const googleBtnText = document.getElementById("googleBtnText");
const forgotBtn = document.getElementById("forgotBtn");
const toggleMode = document.getElementById("toggleMode");
const footerText = document.getElementById("footerText");
const togglePassword = document.getElementById("togglePassword");
const authTitle = document.querySelector(".auth-title");

// ---------- State ----------
let mode = "signin"; // "signin" | "signup"

// ---------- Helpers ----------
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = "message " + type; // type = "error" | "success"
  messageBox.hidden = false;
}

function clearMessage() {
  messageBox.hidden = true;
  messageBox.className = "message";
  messageBox.textContent = "";
}

// Turn Firebase error codes into friendly, human messages.
function friendlyError(error) {
  const code = error && error.code ? error.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password";
    case "auth/invalid-email":
      return "Please enter a valid email address";
    case "auth/missing-password":
      return "Please enter your password";
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again";
    default:
      return (error && error.message) || "Something went wrong. Please try again";
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  googleBtn.disabled = isLoading;
  submitBtn.textContent = isLoading
    ? mode === "signin"
      ? "Signing in..."
      : "Creating account..."
    : mode === "signin"
      ? "Sign in"
      : "Sign up";
}

function redirect() {
  window.location.href = REDIRECT_URL;
}

// ---------- Show / hide password ----------
togglePassword.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePassword.classList.toggle("revealed", isHidden);
  togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

// ---------- Toggle sign in / sign up ----------
toggleMode.addEventListener("click", () => {
  clearMessage();
  if (mode === "signin") {
    mode = "signup";
    authTitle.textContent = "Sign up";
    submitBtn.textContent = "Sign up";
    footerText.textContent = "Already have an account?";
    toggleMode.textContent = "Sign in";
    googleBtnText.textContent = "Sign up with Google";
    passwordInput.setAttribute("autocomplete", "new-password");
  } else {
    mode = "signin";
    authTitle.textContent = "Sign in";
    submitBtn.textContent = "Sign in";
    footerText.textContent = "Don't have an account?";
    toggleMode.textContent = "Sign up";
    googleBtnText.textContent = "Sign in with Google";
    passwordInput.setAttribute("autocomplete", "current-password");
  }
});

// ---------- Email / password submit ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("Please enter your email and password", "error");
    return;
  }

  setLoading(true);
  try {
    // "Remember me" controls whether the session survives a browser restart.
    await setPersistence(
      auth,
      rememberInput.checked ? browserLocalPersistence : browserSessionPersistence,
    );

    if (mode === "signin") {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("Login successful! Redirecting...", "success");
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
      showMessage("Account created! Redirecting...", "success");
    }
    setTimeout(redirect, 1200);
  } catch (error) {
    showMessage(friendlyError(error), "error");
    setLoading(false);
  }
});

// ---------- Google sign in ----------
googleBtn.addEventListener("click", async () => {
  clearMessage();
  setLoading(true);
  try {
    await setPersistence(
      auth,
      rememberInput.checked ? browserLocalPersistence : browserSessionPersistence,
    );
    await signInWithPopup(auth, googleProvider);
    showMessage("Login successful! Redirecting...", "success");
    setTimeout(redirect, 1200);
  } catch (error) {
    showMessage(friendlyError(error), "error");
    setLoading(false);
  }
});

// ---------- Forgot password ----------
forgotBtn.addEventListener("click", async () => {
  clearMessage();
  const email = emailInput.value.trim();
  if (!email) {
    showMessage("Enter your email above, then tap Forgot password", "error");
    emailInput.focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    showMessage("Password reset email sent! Check your inbox", "success");
  } catch (error) {
    showMessage(friendlyError(error), "error");
  }
});
