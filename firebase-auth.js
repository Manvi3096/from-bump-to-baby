import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJOKnb1hJLPh1jCc9yJG5NGqRipI2QLvQ",
  authDomain: "from-bump-to-baby.firebaseapp.com",
  projectId: "from-bump-to-baby",
  storageBucket: "from-bump-to-baby.firebasestorage.app",
  messagingSenderId: "666764905793",
  appId: "1:666764905793:web:dc05dfcd8e1065b05925c0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

window.firebaseAuth = {
  auth,
  provider,
  signInWithPopup,
  signOut
};

console.log("Firebase initialized");
const loginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("googleLogoutBtn");
const userEmail = document.getElementById("userEmail");

loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert(e.message);
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    userEmail.textContent = user.email;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    userEmail.textContent = "";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
});
