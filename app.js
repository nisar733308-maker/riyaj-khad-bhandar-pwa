// Main app logic + PWA Install Fix for Live Server

// Firebase Configuration
var firebaseConfig = {
  apiKey: "AIzaSyCixWsFNzK4M0CdtcOp38smXFwJg0ZDSM0", 
  authDomain: "riyaj-khad-store.firebaseapp.com",
  databaseURL: "https://riyaj-khad-store-default-rtdb.firebaseio.com",
  projectId: "riyaj-khad-store",
  storageBucket: "riyaj-khad-store.appspot.com",
  messagingSenderId: "912749567277",
  appId: "1:912749567277:web:6aa9a25e2556f9b87c1474"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
var db = firebase.database();
var auth = firebase.auth();

let currentProducts = [];
let filteredProducts = [];
let installPrompt;
const installBtn = document.getElementById('install-btn');
const shareBtn = document.getElementById('share-btn');

let currentUser = null; // वर्तमान में लॉग इन उपयोगकर्ता
// Function to display products
function displayProducts(items) {
  const container = document.getElementById('products-container');
  container.innerHTML = items.map(product => {
    // औसत रेटिंग की गणना करें
    const avgRating = product.reviews && product.reviews.length > 0
      ? Math.round(product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length)
      : 0;
    const stars = '★'.repeat(avgRating) + '☆'.repeat(5 - avgRating);
    const isBestSeller = avgRating === 5 && product.reviews && product.reviews.length > 0;
    const bestSellerBadge = isBestSeller ? '<span class="best-seller-badge">✨ बेस्ट सेलर</span>' : '';
    const statusLabel = product.stockStatus === 'Limited' ? '⚠️ सीमित स्टॉक' : '✅ स्टॉक में उपलब्ध';
    const statusClass = product.stockStatus === 'Limited' ? 'status-limited' : 'status-in-stock';

    return `
      <div class="product-card">
        ${bestSellerBadge}
        <img src="${product.image}" alt="${product.name}" onclick="window.openProductDetails('${product.id}')" style="cursor:pointer;">
        <h3 onclick="window.openProductDetails('${product.id}')" style="cursor:pointer;">${product.name}</h3>
        <div class="card-rating">${stars} <span style="font-size: 0.8rem; color: #666;">(${product.reviews ? product.reviews.length : 0})</span></div>
        <div class="stock-status ${statusClass}">${statusLabel}</div>
        <p>${product.desc}</p>
        <p class="price">₹${product.price}</p>
        <button onclick="addToCart('${product.id}')">🛒 कार्ट में जोड़ें</button>
      </div>
    `;
  }).join('');
}

function openProductDetails(id) {
  const product = currentProducts.find(p => String(p.id) === String(id));
  const content = document.getElementById('product-details-content');
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
    <img src="${product.image}" class="details-img">
    <span class="details-badge">${product.category}</span>
    <span class="details-badge ${product.stockStatus === 'Limited' ? 'status-limited-bg' : ''}">
      ${product.stockStatus === 'Limited' ? '⚠️' : '✅'} स्टॉक: ${product.stockCount} बोरी
    </span>
    <p style="font-size: 1.1rem; margin-bottom: 15px;">${product.desc}</p>
    <h2 style="color: #2e7d32; margin-bottom: 20px;">₹${product.price}</h2>
    ${reviewsHTML}
    <button onclick="addToCart('${product.id}', 1); closeProductModal();" style="background: #2e7d32; color: white; border: none; padding: 15px; width: 100%; border-radius: 8px; font-weight: bold; cursor: pointer;">कार्ट में जोड़ें</button>
  `;
  document.getElementById('product-modal').style.display = 'block';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

// Combined Filter Logic (Search + Rating)
function filterProducts() {
  const term = document.getElementById('search').value.toLowerCase();
  const minRating = Number(document.getElementById('rating-filter').value);
  const sortType = document.getElementById('sort-filter').value;
  const category = document.getElementById('category-filter').value;

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
  
  // अगर पहले से इंस्टॉल नहीं है, तभी बटन दिखाएं
  if (!window.matchMedia('(display-mode: standalone)').matches) {
    installBtn.style.display = 'block';
    console.log("Install prompt ready and visible");
  }
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
  if (!installPrompt) return;
  const result = await installPrompt.prompt();
  console.log(`Install prompt was: ${result.outcome}`);
  installPrompt = null;
  installBtn.style.display = 'none';
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

async function registerUser() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

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
  if (user) {
    currentUser = user;
    // लॉगिन होने पर मेनू में 'मेरी प्रोफाइल' और 'लॉगआउट' दिखाएं
    document.getElementById('menu-login').style.display = 'none';
    document.getElementById('menu-profile').style.display = 'block';
    document.getElementById('menu-orders').style.display = 'block';
    document.getElementById('menu-logout').style.display = 'block';
    
    console.log("User logged in:", user.uid);

    // यूजर प्रोफाइल डेटा लोड करें
    db.ref('users/' + user.uid).on('value', (snapshot) => {
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
    currentUser = null;
    // मेनू रिसेट करें
    document.getElementById('menu-login').style.display = 'block';
    document.getElementById('menu-profile').style.display = 'none';
    document.getElementById('menu-orders').style.display = 'none';
    document.getElementById('menu-logout').style.display = 'none';

    console.log("User logged out");
    // लॉगआउट होने पर कार्ट में इनपुट फील्ड दिखाएं
    document.getElementById('logged-in-user-info').style.display = 'none';
    document.getElementById('customer-input-fields').style.display = 'flex';
    document.getElementById('login-prompt-in-cart').style.display = 'block';
    document.getElementById('save-details-checkbox').style.display = 'none';
  }
});

// Share App Logic
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'रियाज अहमद खाद भंडार',
          text: 'किसान भाइयों, अब घर बैठे खाद और कृषि उत्पाद ऑर्डर करें। रियाज अहमद खाद भंडार ऐप डाउनलोड करें!',
          url: 'https://stupendous-crisp-9ed8a1.netlify.app/'
        });
      } catch (err) { console.log('Share failed or cancelled'); }
    } else {
      navigator.clipboard.writeText('https://stupendous-crisp-9ed8a1.netlify.app/');
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
    if (!db) return;
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentProducts = Object.keys(data).map(key => {
                const item = data[key];
                return { ...item, id: String(item.id || key) };
            });
            filteredProducts = [...currentProducts];
            displayProducts(filteredProducts);
        } else {
            const initialData = (typeof products !== 'undefined') ? products : [];
            initialData.forEach(p => db.ref('products/' + p.id).set(p));
        }
    }, (error) => {
        console.error("Firebase Error:", error);
        alert("❌ डेटाबेस एरर: शायद आपके Firebase Rules 'true' नहीं हैं।");
    });
});

window.openCart = () => {
  renderCartItems();
  document.getElementById('cart-modal').style.display = 'block';
  // कार्ट खुलने पर लॉगिन स्थिति के अनुसार UI अपडेट करें
  if (currentUser) {
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
