// ========= FIREBASE CONFIG =========
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyCssU0rVx9INImuarodfqZQYpPJLK7W62Q",
    authDomain: "riyaj-khad-store.firebaseapp.com",
    databaseURL: "https://riyaj-khad-store-default-rtdb.firebaseio.com/",
    projectId: "riyaj-khad-store",
    storageBucket: "riyaj-khad-store.appspot.com",
    messagingSenderId: "912749567277",
    appId: "1:912749567277:web:adeabfde5ff0e437e9c7a4"
  };

  // ========= SAFE INIT =========
  const initFirebase = () => {
    try {
      if (!window.firebase) {
        console.error("❌ Firebase SDK not loaded");
        return;
      }

      // Prevent multiple initialization
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      // Attach global references (controlled)
      window.db = firebase.database();
      window.auth = firebase.auth();

      // Freeze config to prevent mutation
      Object.freeze(firebaseConfig);

      // Optional debug (only once)
      if (!window.__FIREBASE_INIT_DONE__) {
        console.log("✅ Firebase initialized successfully");
        window.__FIREBASE_INIT_DONE__ = true;
      }

    } catch (error) {
      console.error("🔥 Firebase initialization failed:", error);
    }
  };

  // ========= LOAD HANDLING =========
  if (document.readyState === "complete" || document.readyState === "interactive") {
    initFirebase();
  } else {
    document.addEventListener("DOMContentLoaded", initFirebase);
  }

  // ========= EXPORT =========
  window.firebaseConfig = firebaseConfig;

})();