// Main app logic + PWA Install Fix for Live Server

// Firebase Configuration
var firebaseConfig = {
  apiKey: "AIzaSyCssU0rVx9INImuarodfqZQYpPJLK7W62Q", 
  authDomain: "riyaj-khad-store.firebaseapp.com",
  databaseURL: "https://riyaj-khad-store-default-rtdb.firebaseio.com",
  projectId: "riyaj-khad-store",
  storageBucket: "riyaj-khad-store.appspot.com",
  messagingSenderId: "912749567277",
  appId: "1:912749567277:web:6aa9a25e2556f9b87c1474"
};

// Translation Dictionary
const translations = {
  hi: { 
    shopTitle: "🌾 रियाज अहमद खाद भंडार", shopDesc: "खाद और कृषि उत्पाद", cart: "🛒 कार्ट", login: "👤 लॉगिन / रजिस्टर", 
    search: "उत्पाद खोजें...", checkout: "✅ व्हाट्सएप ऑर्डर", pay: "💸 पेमेंट", qr: "🖼️ QR कोड", continue: "जारी रखें", clear: "🗑️ साफ", print: "🖨️ रसीद", call: "📞 कॉल"
  },
  en: { 
    shopTitle: "🌾 Riyaj Ahmad Fertilizer Store", shopDesc: "Fertilizer & Agri Products", cart: "🛒 Cart", login: "👤 Login / Register", 
    search: "Search products...", checkout: "✅ WhatsApp Order", pay: "💸 Payment", qr: "🖼️ QR Code", continue: "Continue Shopping", clear: "🗑️ Clear", print: "🖨️ Print", call: "📞 Call"
  },
  bho: { 
    shopTitle: "🌾 रियाज अहमद खाद भंडार", shopDesc: "खाद आउर खेती के सामान", cart: "🛒 झोरा", login: "👤 लॉगिन करीं", 
    search: "सामान खोजीं...", checkout: "✅ व्हाट्सएप भेजीं", pay: "💸 पइसा भेजीं", qr: "🖼️ QR कोड", continue: "जारी रखीं", clear: "🗑️ खाली", print: "🖨️ पर्ची", call: "📞 फोन करीं"
  }
};

let currentLang = localStorage.getItem('appLanguage') || 'hi';

window.changeLanguage = (lang) => {
  currentLang = lang;
  localStorage.setItem('appLanguage', lang);
  applyTranslations(lang);
  displayProducts(filteredProducts); 
};

function applyTranslations(lang) {
  const t = translations[lang] || translations.hi;
  const shopTitle = document.getElementById('shop-title');
  const shopDesc = document.getElementById('shop-desc');
  const cartCount = document.getElementById('cart-count');
  const menuLogin = document.getElementById('menu-login');
  
  if(shopTitle) shopTitle.innerText = t.shopTitle;
  if(shopDesc) shopDesc.innerText = t.shopDesc;
  if(cartCount) cartCount.innerHTML = t.cart + " " + (cart.length || 0);
  if(menuLogin) menuLogin.innerText = t.login;

  // बटन के टेक्स्ट भी बदलें
  if(document.getElementById('checkout')) document.getElementById('checkout').innerText = t.checkout;
  if(document.getElementById('btn-pay-text')) document.getElementById('btn-pay-text').innerText = t.pay;
  if(document.getElementById('btn-qr-text')) document.getElementById('btn-qr-text').innerText = t.qr;
  if(document.getElementById('btn-continue-text')) document.getElementById('btn-continue-text').innerText = t.continue;
  if(document.getElementById('clear-cart')) document.getElementById('clear-cart').innerText = t.clear;
  if(document.getElementById('print-cart')) document.getElementById('print-cart').innerText = t.print;
  
  // Re-render products to update labels if needed
  if(typeof filterProducts === 'function') filterProducts();
}

// Feedback Logic
let currentFeedbackRating = 0;
window.openFeedbackModal = () => document.getElementById('feedback-modal').style.display = 'block';
window.closeFeedbackModal = () => document.getElementById('feedback-modal').style.display = 'none';

window.setFeedbackRating = (rating) => {
  currentFeedbackRating = rating;
  const stars = document.querySelectorAll('.star-rating span');
  stars.forEach((s, i) => {
    s.textContent = i < rating ? '★' : '☆';
  });
};

window.submitFeedback = () => {
  if (currentFeedbackRating === 0) return alert("कृपया स्टार रेटिंग चुनें।");
  const text = document.getElementById('feedback-text').value;
  
  const feedbackData = {
    rating: currentFeedbackRating,
    comment: text,
    user: window.currentUser ? window.currentUser.email : 'Guest',
    date: new Date().toLocaleString()
  };

  db.ref('feedback').push(feedbackData).then(() => {
    alert("✅ आपकी रेटिंग के लिए धन्यवाद!");
    window.closeFeedbackModal();
    // Reset stars
    currentFeedbackRating = 0;
    document.querySelectorAll('.star-rating span').forEach(s => s.textContent = '☆');
    document.getElementById('feedback-text').value = '';
  }).catch(e => alert("Error: " + e.message));
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
var db = firebase.database();
var auth = firebase.auth();
window.db = firebase.database();
window.auth = firebase.auth();

let currentProducts = [];
let filteredProducts = [];
let installPrompt;
const installBtn = document.getElementById('install-btn');
const shareBtn = document.getElementById('share-btn');

window.currentUser = null; // ग्लोबल एक्सेस के लिए window.currentUser का उपयोग करें

// Custom Toast Function
window.showToast = (message) => {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

// Featured Offers Data
const featuredOffers = [
  { title: "धमाका ऑफर! 💥", text: "यूरिया पर 10% की भारी छूट", bg: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=800" },
  { title: "मानसून सेल 🌧️", text: "कीटनाशकों पर 'एक के साथ एक' मुफ्त", bg: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800" },
  { title: "नया स्टॉक उपलब्ध ✅", text: "इफको डीएपी अब दुकान पर आ चुका है", bg: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=800" }
];

function initSlider() {
  const wrapper = document.getElementById('slider-wrapper');
  if (!wrapper) return;

  wrapper.innerHTML = featuredOffers.map(offer => `
    <div class="slide" style="background-image: url('${offer.bg}')">
      <div class="slide-overlay"></div>
      <div class="slide-content">
        <h2 style="font-size: 1.5rem; margin-bottom: 5px;">${offer.title}</h2>
        <p style="font-size: 1rem; opacity: 0.9;">${offer.text}</p>
      </div>
    </div>
  `).join('');

  let currentIndex = 0;
  if (featuredOffers.length > 1) {
    setInterval(() => {
      currentIndex = (currentIndex + 1) % featuredOffers.length;
      wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    }, 4000);
  }
}

// Function to display products
function displayProducts(items) {
  const container = document.getElementById('products-container');
  const t = translations[currentLang] || translations.hi;
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="skeleton" style="height:300px; width:100%;"></div>'.repeat(3);
    return;
  }
  container.innerHTML = items.map(product => {
    // औसत रेटिंग की गणना करें
    const avgRating = product.reviews && product.reviews.length > 0
      ? Math.round(product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length)
      : 0;
    const stars = '★'.repeat(avgRating) + '☆'.repeat(5 - avgRating);
    const isBestSeller = avgRating === 5 && product.reviews && product.reviews.length > 0;
    const isOutOfStock = product.stockCount <= 0;
    
    const bestSellerBadge = isBestSeller ? '<span class="best-seller-badge">✨ बेस्ट सेलर</span>' : '';
    const lowStockBadge = (product.stockCount > 0 && product.stockCount < 10) 
      ? '<span class="low-stock-badge">⚠️ स्टॉक कम है</span>' 
      : (isOutOfStock ? '<span class="out-of-stock-badge">🚫 स्टॉक खत्म</span>' : '');
    
    const statusLabel = isOutOfStock ? '🚫 स्टॉक खत्म' : (product.stockStatus === 'Limited' ? '⚠️ सीमित स्टॉक' : '✅ स्टॉक में उपलब्ध');
    const statusClass = isOutOfStock ? 'status-out-of-stock' : (product.stockStatus === 'Limited' ? 'status-limited' : 'status-in-stock');

    return `
      <div class="product-card">
        ${bestSellerBadge}
        ${lowStockBadge}
        <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" onclick="window.openProductDetails('${product.id}')" style="cursor:pointer; background: #f0f0f0;">
        <h3 onclick="window.openProductDetails('${product.id}')" style="cursor:pointer;">${product.name}</h3>
        <div class="card-rating">${stars} <span style="font-size: 0.8rem; color: #666;">(${product.reviews ? product.reviews.length : 0})</span></div>
        <div class="stock-status ${statusClass}">${statusLabel}</div>
        <p>${product.desc}</p>
        <p class="price">₹${product.price}</p>
        <button class="add-to-cart-btn" style="width:100%;" onclick="addToCart('${product.id}')" ${isOutOfStock ? 'disabled style="background:#ccc;"' : ''}>${isOutOfStock ? '❌' : t.cart}</button>
      </div>
    `;
  }).join('');
}

function openProductDetails(id) {
  const product = currentProducts.find(p => String(p.id) === String(id));
  const content = document.getElementById('product-details-content');
  const t = translations[currentLang] || translations.hi;
  const isOutOfStock = product.stockCount <= 0;
  document.getElementById('modal-product-name').innerText = product.name;
  
  const reviewsHTML = product.reviews ? `
    <div class="reviews-section">
      <h3 style="margin-bottom: 15px;">⭐ ग्राहक समीक्षाएं</h3>
      ${product.reviews.map(r => `
        <div class="review-card">
          <div class="review-header">
            <span>👤 ${r.user}</span>
            <span style="color: #fbc02d;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
          </div>
          <p style="font-size: 0.85rem; color: #666;">${r.text}</p>
        </div>
      `).join('')}
    </div>
  ` : '';

  content.innerHTML = `
    <img src="${product.image}" class="details-img" decoding="async">
    <span class="details-badge">${product.category}</span>
    <span class="details-badge ${product.stockStatus === 'Limited' ? 'status-limited-bg' : ''}">
      ${product.stockStatus === 'Limited' ? '⚠️' : '✅'} स्टॉक: ${product.stockCount} बोरी
    </span>
    <p style="font-size: 1.1rem; margin-bottom: 15px; color: ${isOutOfStock ? '#f44336' : 'inherit'}">${isOutOfStock ? 'यह सामान फिलहाल उपलब्ध नहीं है।' : product.desc}</p>
    <h2 style="color: #2e7d32; margin-bottom: 20px;">₹${product.price}</h2>
    ${reviewsHTML}
    <div class="modal-action-buttons">
      <button onclick="addToCart('${product.id}', 1); closeProductModal();" style="width: 100%; background: ${isOutOfStock ? '#ccc' : '#2e7d32'}; color: white; border: none; padding: 15px; border-radius: 8px; font-weight: bold; cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'};" ${isOutOfStock ? 'disabled' : ''}>${isOutOfStock ? 'स्टॉक खत्म' : t.cart}</button>
    </div>
  `;
  document.getElementById('product-modal').style.display = 'block';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

// सर्च हिस्ट्री लॉजिक
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
let searchTimeout;

function saveSearch(term) {
  if (!term || term.trim().length < 2) return;
  term = term.trim();
  searchHistory = searchHistory.filter(h => h.toLowerCase() !== term.toLowerCase());
  searchHistory.unshift(term);
  searchHistory = searchHistory.slice(0, 5); // केवल आखिरी 5 सर्च याद रखें
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

function renderSearchHistory() {
  const dropdown = document.getElementById('search-history');
  if (searchHistory.length === 0) {
    dropdown.style.display = 'none';
    return;
  }
  dropdown.innerHTML = searchHistory.map(term => `
    <div class="search-history-item">
      <span onclick="window.applyHistorySearch('${term}')">🕒 ${term}</span>
      <small onclick="window.deleteHistoryItem('${term}')" style="color:#f44336; font-size:1.2rem; cursor:pointer; padding:0 5px;">&times;</small>
    </div>
  `).join('');
  dropdown.innerHTML += `<button class="clear-history-btn" onclick="window.clearAllHistory()">🗑️ सभी हिस्ट्री मिटाएं</button>`;
  dropdown.style.display = 'block';
}

// सभी हिस्ट्री मिटाने का फंक्शन
window.clearAllHistory = () => {
  searchHistory = [];
  localStorage.removeItem('searchHistory');
  renderSearchHistory();
};

// Combined Filter Logic (Search + Rating)
function filterProducts() {
  const term = document.getElementById('search').value.toLowerCase();
  const minRating = Number(document.getElementById('rating-filter').value);
  const sortType = document.getElementById('sort-filter').value;
  const category = document.getElementById('category-filter').value;

  // सर्च हिस्ट्री छुपाएं जब ग्राहक टाइप करना शुरू करे
  document.getElementById('search-history').style.display = 'none';

  // 2 सेकंड रुकने के बाद सर्च शब्द सेव करें (Debounce)
  clearTimeout(searchTimeout);
  if (term.length >= 2) {
    searchTimeout = setTimeout(() => saveSearch(document.getElementById('search').value), 2000);
  }

  let result = currentProducts.filter(p => {
    const matchesTerm = p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
    const matchesCategory = category === 'all' || p.category === category;
    
    // Calculate Average Rating
    const avgRating = p.reviews && p.reviews.length > 0 
      ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length 
      : 0;

    return matchesTerm && matchesCategory && avgRating >= minRating;
  });

  // Apply Sorting
  if (sortType === 'low-high') {
    result.sort((a, b) => a.price - b.price);
  } else if (sortType === 'high-low') {
    result.sort((a, b) => b.price - a.price);
  }

  filteredProducts = result;
  displayProducts(filteredProducts);
}

document.getElementById('search').addEventListener('input', filterProducts);
document.getElementById('rating-filter').addEventListener('change', filterProducts);
document.getElementById('sort-filter').addEventListener('change', filterProducts);

document.getElementById('clear-filters-btn').addEventListener('click', () => {
  document.getElementById('search').value = '';
  document.getElementById('rating-filter').value = '0';
  document.getElementById('sort-filter').value = 'none';
  // सभी फिल्टर हटाने के बाद लिस्ट को रिफ्रेश करें
  filterProducts();
});

// हिस्ट्री पर क्लिक करने पर सर्च अप्लाई करें
window.applyHistorySearch = (term) => {
  document.getElementById('search').value = term;
  filterProducts();
};

// हिस्ट्री आइटम डिलीट करें
window.deleteHistoryItem = (term) => {
  event.stopPropagation(); // क्लिक को ऊपर जाने से रोकें
  searchHistory = searchHistory.filter(h => h !== term);
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  renderSearchHistory();
};

// चेक करें कि क्या ऐप पहले से इंस्टॉल है
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
  console.log("App detected as already installed");
  if(installBtn) installBtn.style.display = 'none';
}

// PWA Install Logic
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isMiBrowser = /MiuiBrowser/i.test(navigator.userAgent);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'block';
});

// iPhone के लिए विशेष संदेश (यदि इंस्टॉल नहीं है)
if (isIOS && !window.navigator.standalone) {
  setTimeout(() => {
    const iosNote = document.createElement('div');
    iosNote.style = "background:#fff9c4; padding:10px; text-align:center; font-size:0.8rem; border-bottom:1px solid #fbc02d;";
    iosNote.innerHTML = "iPhone पर ऐप इंस्टॉल करने के लिए 📤 शेयर बटन दबाएं और फिर 'Add to Home Screen' चुनें।";
    document.body.prepend(iosNote);
  }, 2000);
}

// Mi Browser के लिए विशेष संदेश
if (isMiBrowser && !window.matchMedia('(display-mode: standalone)').matches) {
  setTimeout(() => {
    const miNote = document.createElement('div');
    miNote.style = "background:#e3f2fd; padding:10px; text-align:center; font-size:0.8rem; border-bottom:1px solid #2196f3;";
    miNote.innerHTML = "Mi Browser पर ऐप इंस्टॉल करने के लिए ≡ मेनू दबाएं और 'Add to Home Screen' चुनें।";
    document.body.prepend(miNote);
  }, 3000);
}

installBtn.addEventListener('click', async () => {
  if (installPrompt) {
    const result = await installPrompt.prompt();
    console.log(`Install prompt outcome: ${result.outcome}`);
    installPrompt = null;
  } else {
    // अगर ब्राउज़र प्रॉम्प्ट नहीं दे रहा, तो मैन्युअल तरीका बताएं
    alert("📲 ऐप इंस्टॉल करने के लिए:\n1. ऊपर या नीचे के 3-डॉट (⋮) मेनू पर क्लिक करें।\n2. 'Install App' या 'Add to Home Screen' चुनें।");
  }
});

// Menu and UI Toggles
window.toggleMenu = () => {
  const menu = document.getElementById('side-menu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
};

window.togglePasswordVisibility = (inputId) => {
  const input = document.getElementById(inputId);
  const toggleIcon = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    toggleIcon.textContent = '🙈';
  } else {
    input.type = 'password';
    toggleIcon.textContent = '👁️';
  }
};

// Dark Mode Logic
window.toggleDarkMode = () => {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDark);
  updateDarkModeUI(isDark);
};

function updateDarkModeUI(isDark) {
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = isDark ? '☀️ लाइट मोड चालू करें' : '🌙 डार्क मोड चालू करें';
  }
}

// Initialize Theme on Load
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  updateDarkModeUI(true);
}

// My Orders Logic
window.openMyOrders = () => {
  if (!currentUser) return;
  
  const container = document.getElementById('my-orders-list');
  container.innerHTML = '<p style="text-align:center;">लोड हो रहा है...</p>';
  document.getElementById('orders-modal').style.display = 'block';

  db.ref('orders').once('value', (snapshot) => {
    const data = snapshot.val();
    const allOrders = data ? Object.values(data) : [];
    // सिर्फ वर्तमान यूजर के ऑर्डर फिल्टर करें
    const myOrders = allOrders.filter(o => o.userId === currentUser.uid).reverse();

    if (myOrders.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:20px;">आपने अभी तक कोई ऑर्डर नहीं दिया है।</p>';
      return;
    }

    container.innerHTML = myOrders.map(o => {
       const statusColor = o.status === 'Delivered' ? '#2e7d32' : '#fbc02d';
       const statusText = o.status === 'Delivered' ? '✅ पूरा हुआ' : '⏳ नया ऑर्डर';
       return `
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: var(--bg-card, #fff);">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px;">
            <span>ID: ${o.id}</span>
            <span>${o.date.split(',')[0]}</span>
          </div>
          <div style="font-weight: bold; margin-bottom: 5px;">${o.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
             <span style="color: #2e7d32; font-weight: bold;">₹${o.total.toLocaleString()}</span>
             <span style="font-size: 0.8rem; padding: 3px 8px; border-radius: 4px; background: ${statusColor}11; color: ${statusColor}; font-weight: bold;">${statusText}</span>
          </div>
        </div>
       `;
    }).join('');
  });
};

window.closeOrdersModal = () => document.getElementById('orders-modal').style.display = 'none';

// Firebase Authentication Functions
function openAuthModal() {
  document.getElementById('auth-modal').style.display = 'block';
}

function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}

async function loginUser() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (!email || !password) {
    alert('कृपया ईमेल और पासवर्ड भरें।');
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    alert('✅ सफलतापूर्वक लॉगिन किया गया!');
    closeAuthModal();
  } catch (error) {
    alert('❌ लॉगिन विफल: ' + error.message);
  }
}

window.showRegistrationFields = () => {
  document.getElementById('confirm-pass-container').style.display = 'block';
  document.getElementById('real-reg-btn').style.display = 'block';
  document.getElementById('reg-toggle-btn').style.display = 'none';
  document.getElementById('auth-modal-title').innerText = '👤 नया अकाउंट बनाएं';
};

async function registerUser() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const confirmPassword = document.getElementById('auth-confirm-password').value;

  if (password !== confirmPassword) {
    alert('❌ दोनों पासवर्ड एक जैसे नहीं हैं!');
    return;
  }

  if (!email || !password || password.length < 6) {
    alert('कृपया वैध ईमेल और कम से कम 6 अंकों का पासवर्ड भरें।');
    return;
  }

  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert('✅ सफलतापूर्वक रजिस्टर किया गया! अब आप लॉगिन कर सकते हैं।');
    closeAuthModal();
  } catch (error) {
    alert('❌ रजिस्ट्रेशन विफल: ' + error.message);
  }
}

async function resetPassword() {
  const email = document.getElementById('auth-email').value;

  if (!email) {
    alert('कृपया पासवर्ड रीसेट करने के लिए ऊपर अपना ईमेल भरें।');
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    alert('✅ पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है। कृपया अपना इनबॉक्स (और स्पैम फोल्डर) चेक करें।');
  } catch (error) {
    alert('❌ एरर: ' + error.message);
  }
}

async function logoutUser() {
  try {
    await auth.signOut();
    alert('✅ सफलतापूर्वक लॉगआउट किया गया!');
  } catch (error) {
    alert('❌ लॉगआउट विफल: ' + error.message);
  }
}

// Firebase Auth State Listener
auth.onAuthStateChanged(async (user) => {
window.auth.onAuthStateChanged(async (user) => {
  if (user) {
    window.currentUser = user;
    // लॉगिन होने पर मेनू में 'मेरी प्रोफाइल' और 'लॉगआउट' दिखाएं
    document.getElementById('menu-login').style.display = 'none';
    document.getElementById('menu-profile').style.display = 'block';
    document.getElementById('menu-orders').style.display = 'block';
    document.getElementById('menu-logout').style.display = 'block';
    
    console.log("User logged in:", user.uid);

    // यूजर प्रोफाइल डेटा लोड करें
    db.ref('users/' + user.uid).on('value', (snapshot) => {
    window.db.ref('users/' + user.uid).on('value', (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        document.getElementById('display-name').textContent = userData.name || '';
        document.getElementById('display-phone').textContent = userData.phone || '';
        document.getElementById('display-address').textContent = userData.address || '';
        document.getElementById('display-aadhar').textContent = userData.aadhar || '';
        
        // कार्ट में भी प्री-फिल करें
        document.getElementById('customer-name').value = userData.name || '';
        document.getElementById('customer-phone').value = userData.phone || '';
        document.getElementById('customer-address').value = userData.address || '';
        document.getElementById('customer-aadhar').value = userData.aadhar || '';

        document.getElementById('logged-in-user-info').style.display = 'block';
        document.getElementById('customer-input-fields').style.display = 'none';
        document.getElementById('login-prompt-in-cart').style.display = 'none';
        document.getElementById('save-details-checkbox').style.display = 'none';
      } else {
        // अगर यूजर लॉग इन है लेकिन प्रोफाइल डेटा नहीं है, तो इनपुट फील्ड दिखाएं और सेव करने का विकल्प दें
        document.getElementById('logged-in-user-info').style.display = 'none';
        document.getElementById('customer-input-fields').style.display = 'flex';
        document.getElementById('login-prompt-in-cart').style.display = 'none';
        document.getElementById('save-details-checkbox').style.display = 'block';
      }
    });
  } else {
    window.currentUser = null;
    // मेनू रिसेट करें
    document.getElementById('menu-login').style.display = 'block';
    document.getElementById('menu-profile').style.display = 'none';
    document.getElementById('menu-orders').style.display = 'none';
    document.getElementById('menu-logout').style.display = 'none';

    console.log("User logged out");
    // लॉगआउट होने पर कार्ट में इनपुट फील्ड दिखाएं
    // लॉगआउट होने पर UI रिसेट करें
    document.getElementById('logged-in-user-info').style.display = 'none';
    document.getElementById('customer-input-fields').style.display = 'flex';
    document.getElementById('login-prompt-in-cart').style.display = 'block';
    document.getElementById('save-details-checkbox').style.display = 'none';
  }
});

// Profile Modal Logic
window.openProfileModal = () => {
  if (!window.currentUser) return openAuthModal();
  renderProfileUI();
  document.getElementById('profile-modal').style.display = 'block';
};

async function renderProfileUI() {
  if (!window.currentUser) return;
  db.ref('users/' + window.currentUser.uid).on('value', (snapshot) => {
  window.db.ref('users/' + window.currentUser.uid).on('value', (snapshot) => {
    const data = snapshot.val() || {};
    document.getElementById('prof-input-name').value = data.name || '';
    document.getElementById('prof-input-phone').value = data.phone || '';
    document.getElementById('prof-input-aadhar').value = data.aadhar || '';
  
  const addressList = document.getElementById('saved-addresses-list');
  const addresses = data.addresses || [];
  
  if (addresses.length === 0) {
    addressList.innerHTML = '<p style="font-size:0.8rem; color:#666;">कोई पता सेव नहीं है।</p>';
  } else {
    addressList.innerHTML = addresses.map((addr, index) => `
      <div style="background:#f0f4f0; padding:10px; border-radius:8px; margin-bottom:5px; font-size:0.9rem; display:flex; justify-content:space-between; align-items:center;">
        <span>${addr}</span>
        <button onclick="window.removeAddress(${index})" style="background:none; border:none; color:red; cursor:pointer;">🗑️</button>
      </div>
    `).join('');
  }
  });
}

window.addAddressFromInput = () => {
  const addrInput = document.getElementById('prof-input-address');
  const newAddr = addrInput.value.trim();
  if (!newAddr) return alert("पता खाली नहीं हो सकता!");

  db.ref('users/' + window.currentUser.uid + '/addresses').once('value').then(snap => {
    const list = snap.val() || [];
    list.push(newAddr);
    db.ref('users/' + window.currentUser.uid).update({ 
        addresses: list,
        name: document.getElementById('prof-input-name').value,
        phone: document.getElementById('prof-input-phone').value,
        aadhar: document.getElementById('prof-input-aadhar').value
    }).then(() => {
      addrInput.value = '';
      renderProfileUI();
      showToast("✅ पता जोड़ दिया गया");
    });
  });
};

window.removeAddress = (index) => {
  db.ref('users/' + window.currentUser.uid + '/addresses').once('value').then(snap => {
    let list = snap.val() || [];
    list.splice(index, 1);
    db.ref('users/' + window.currentUser.uid).update({ addresses: list }).then(() => renderProfileUI());
  });
};

window.saveProfileData = () => {
    const name = document.getElementById('prof-input-name').value;
    const phone = document.getElementById('prof-input-phone').value;
    const aadhar = document.getElementById('prof-input-aadhar').value;
    
    db.ref('users/' + window.currentUser.uid).update({ name, phone, aadhar }).then(() => {
        alert("✅ जानकारी अपडेट हो गई");
        window.closeProfileModal();
    });
};

window.closeProfileModal = () => document.getElementById('profile-modal').style.display = 'none';

// Firebase से प्रोडक्ट लोड करने का मुख्य फंक्शन
window.loadProductsFromFirebase = () => {
  if (!db) return;
  
  const container = document.getElementById('products-container');
  // लोडिंग के दौरान स्केलेटन दिखाएं
  container.innerHTML = '<div class="skeleton" style="height:300px; width:100%;"></div>'.repeat(3);

  db.ref('products').on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
          currentProducts = Object.keys(data).map(key => ({ ...data[key], id: String(data[key].id || key) }));
          filteredProducts = [...currentProducts];
          displayProducts(filteredProducts);
      } else {
          const initialData = (typeof products !== 'undefined') ? products : [];
          initialData.forEach(p => db.ref('products/' + p.id).set(p));
      }
  }, (error) => {
      console.error("Firebase Error:", error);
      container.innerHTML = `
        <div style="text-align: center; padding: 50px; grid-column: 1 / -1;">
          <p style="color: #f44336; margin-bottom: 15px; font-weight: bold;">❌ सामान लोड नहीं हो पाया।</p>
          <button onclick="window.loadProductsFromFirebase()" style="background: #1976d2; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">🔄 दोबारा कोशिश करें (Retry)</button>
        </div>`;
  });
};

// Share App Logic
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'रियाज अहमद खाद भंडार',
          text: 'किसान भाइयों, अब घर बैठे खाद और कृषि उत्पाद ऑर्डर करें। रियाज अहमद खाद भंडार ऐप डाउनलोड करें!',
          url: window.location.href // यह अपने आप नया GitHub लिंक ले लेगा
        });
      } catch (err) { console.log('Share failed or cancelled'); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('ऐप का लिंक कॉपी हो गया है! अब आप इसे व्हाट्सएप पर शेयर कर सकते हैं।');
    }
  });
}

// इंस्टॉल होने के बाद बटन को पूरी तरह छुपाएं
window.addEventListener('appinstalled', () => {
  console.log('PWA installed');
  installBtn.style.display = 'none';
});

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    // PWA Install check again
    if (window.matchMedia('(display-mode: standalone)').matches) {
        if(installBtn) installBtn.style.display = 'none';
    }

    // बटन को हमेशा दिखाने के लिए (यूजर की मांग पर)
    if(installBtn) installBtn.style.display = 'block';

    if (!db) {
        console.error("Firebase not initialized");
        // Fallback: If DB fails, show local products
        if (typeof products !== 'undefined') {
            currentProducts = products;
            displayProducts(currentProducts);
        }
        return;
    }
    
    const savedLang = localStorage.getItem('appLanguage') || 'hi';
    document.getElementById('app-lang').value = savedLang;
    applyTranslations(savedLang);
    
    // सर्च बार पर क्लिक करने पर हिस्ट्री दिखाएं
    const searchInput = document.getElementById('search');
    if (searchInput) searchInput.addEventListener('focus', renderSearchHistory);
    
    // बाहर क्लिक करने पर हिस्ट्री छुपाएं
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.filter-group')) {
        document.getElementById('search-history').style.display = 'none';
      }
    });

    initSlider(); // स्लाइडर शुरू करें
    window.loadProductsFromFirebase();
});

window.openCart = () => {
  renderCartItems();
  document.getElementById('cart-modal').style.display = 'block';
  // लॉगिन की सही जांच करें
  if (window.currentUser) {
    document.getElementById('logged-in-user-info').style.display = 'block';
    document.getElementById('customer-input-fields').style.display = 'none';
    document.getElementById('login-prompt-in-cart').style.display = 'none';
    document.getElementById('save-details-checkbox').style.display = 'none';
  } else {
    document.getElementById('logged-in-user-info').style.display = 'none';
    document.getElementById('customer-input-fields').style.display = 'flex';
    document.getElementById('login-prompt-in-cart').style.display = 'block';
    document.getElementById('save-details-checkbox').style.display = 'none';
  }
};

window.editCustomerDetails = () => {
  document.getElementById('logged-in-user-info').style.display = 'none';
  document.getElementById('customer-input-fields').style.display = 'flex';
  document.getElementById('save-details-checkbox').style.display = 'block'; // सेव करने का विकल्प दें
  document.getElementById('login-prompt-in-cart').style.display = 'none';
};
window.closeCart = () => document.getElementById('cart-modal').style.display = 'none';

window.openProductDetails = openProductDetails;
window.closeProductModal = closeProductModal;
window.resetPassword = resetPassword;
