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

let currentProducts = [];
let filteredProducts = [];
let installPrompt;
const installBtn = document.getElementById('install-btn');
const shareBtn = document.getElementById('share-btn');

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
  console.log("App already installed");
  if(installBtn) installBtn.style.display = 'none';
}

// PWA Install Logic
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  installBtn.style.display = 'block';
  console.log("Install prompt ready");
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

installBtn.addEventListener('click', async () => {
  if (!installPrompt) return;
  const result = await installPrompt.prompt();
  console.log(`Install prompt was: ${result.outcome}`);
  installPrompt = null;
  installBtn.style.display = 'none';
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
};
window.closeCart = () => document.getElementById('cart-modal').style.display = 'none';

window.openProductDetails = openProductDetails;
window.closeProductModal = closeProductModal;
