// Perfect Firebase Config for रियाज अहमद खाद भंडार
window.firebaseConfig = {
  apiKey: "AIzaSyCssU0rVx9INImuarodfqZQYpPJLK7W62Q",
  authDomain: "riyaj-khad-store.firebaseapp.com",
  databaseURL: "https://riyaj-khad-store-default-rtdb.firebaseio.com/",
  projectId: "riyaj-khad-store",
  storageBucket: "riyaj-khad-store.appspot.com",
  messagingSenderId: "912749567277",
  appId: "1:912749567277:web:adeabfde5ff0e437e9c7a4"
};

// Initialize with error handling
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
    window.db = firebase.database();
    window.firebase = firebase;
    console.log("✅ Perfect Firebase initialized!");
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

