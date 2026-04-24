// app.js - रियाज अहमद खाद भंडार PWA की मुख्य लॉजिक फाइल (GPS Fixed)

// ग्लोबल स्टेट
window.currentProducts = [];

// Debounce Function for Search
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. सर्विस वर्कर रजिस्ट्रेशन (PWA के लिए)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log("Service Worker: Registered"))
            .catch(err => console.log("Service Worker: Registration Failed", err));
    }

    // 2. शुरुआती डेटा लोड करना
    // products.js से डिफॉल्ट प्रोडक्ट्स लें
    window.currentProducts = window.products || [];
    renderProducts(window.currentProducts);

    // 3. सर्च फंक्शनलिटी (Corrected ID to 'search')
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.toLowerCase();
            const filtered = window.currentProducts.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.category.toLowerCase().includes(query)
            );
            renderProducts(filtered);
        }, 400));
    }

    // 4. कैटेगरी और सॉर्ट फिल्टर (Corrected for <select> elements)
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            const category = categoryFilter.value;
            const filtered = category === 'all' ? window.currentProducts : window.currentProducts.filter(p => p.category === category);
            renderProducts(filtered);
        });
    }

    const ratingFilter = document.getElementById('rating-filter');
    if (ratingFilter) {
        ratingFilter.addEventListener('change', () => {
            const minRating = parseInt(ratingFilter.value);
            const filtered = window.currentProducts.filter(p => {
                const avgRating = p.reviews && p.reviews.length > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0;
                return avgRating >= minRating;
            });
            renderProducts(filtered);
        });
    }

    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            const sortVal = sortFilter.value;
            let sorted = [...window.currentProducts];
            if (sortVal === 'low-high') sorted.sort((a, b) => a.price - b.price);
            if (sortVal === 'high-low') sorted.sort((a, b) => b.price - a.price);
            renderProducts(sorted);
        });
    }

    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = 'all';
            if (sortFilter) sortFilter.value = 'none';
            if (ratingFilter) ratingFilter.value = '0';
            renderProducts(window.currentProducts);
        });
    }

    // 5. Firebase से डेटा सिंक (यदि उपलब्ध हो)
    if (window.db) {
        window.db.ref('products').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                window.currentProducts = Array.isArray(data) ? data : Object.values(data);
                renderProducts(window.currentProducts);
            }
        });
    }

    // 6. Firebase Auth State Observer (Enhanced Fix)
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            window.currentUser = user;
            updateAuthUI(user);
            if (user && window.db) {
                loadUserProfile(user.uid);
            } else {
                // Reset UI for guest
                resetProfileUI();
            }
        });
        console.log("🔥 Firebase Auth Observer active");
    } else {
        console.warn("⚠️ Firebase Auth not available - check initialization");
    }

});

// 🔥 GPS Location Fix - 100% Working!
window.fetchCurrentLocation = (targetInputId = 'prof-input-address') => {
    const targetInput = document.getElementById(targetInputId);
    const originalPlaceholder = targetInput.placeholder;
    
    if (navigator.geolocation) {
        targetInput.placeholder = "📍 लोकेशन ढूँढ रहे हैं...";
        targetInput.value = "";
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                console.log("GPS Success:", lat, lng);
                
                // Reliable reverse geocoding (Nominatim)
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
                    .then(res => res.json())
                    .then(data => {
                        let address = 'GPS Location found';
                        if (data.display_name) {
                            address = data.display_name;
                        } else if (data.address) {
                            address = [
                                data.address.road || '',
                                data.address.neighbourhood || data.address.village || '',
                                data.address.city || data.address.town || '',
                                data.address.state || '',
                                data.address.country || ''
                            ].filter(Boolean).join(', ');
                        }                        
                        targetInput.value = address;
                        window.showToast("✅ GPS Address भरा गया: " + address.substring(0, 50));
                    })
                    .catch(err => {
                        console.log("Reverse geo fail, using coords:", err);
                        // Fallback to coordinates + simple address
                        document.getElementById(targetInputId).value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} - GPS Active`;
                        window.showToast("📍 GPS Coordinates भरे गए");
                    });
                targetInput.placeholder = originalPlaceholder;
            },
            (error) => {
                console.error("GPS Error:", error);
                targetInput.placeholder = originalPlaceholder;
                let msg = "GPS Error";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "GPS permission deny करें";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "GPS signal weak";
                        break;
                    case error.TIMEOUT:
                        msg = "GPS timeout - Try again";
                        break;
                }
                window.showToast(msg);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 20000, 
                maximumAge: 60000 
            }
        );
    } else {
        window.showToast("Browser में GPS support नहीं");
    }
};

// --- Product Detail Logic (IFFCO Style) ---  
window.showProductDetails = (id) => {
    const source = window.currentProducts || window.products || [];
    const product = source.find(p => String(p.id) === String(id));
    if (!product) return;

    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-details-content');
    const title = document.getElementById('modal-product-name');

    title.textContent = product.name;
    content.innerHTML = `
        <div class="product-detail-view" style="display: flex; flex-direction: column; gap: 20px;">
            <img src="${product.image}" alt="${product.name}" class="details-img" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px;">
            <div class="details-info">
                <span class="details-badge" style="background: #e8f5e9; color: #004831; padding: 5px 12px; border-radius: 4px; font-weight: bold; font-size: 0.8rem;">${product.category}</span>
                <h2 style="margin: 15px 0 10px; color: #004831;">₹${product.price}</h2>
                <p style="color: #555; line-height: 1.6; font-size: 1rem;">${product.desc}</p>
                <button onclick="addToCart('${product.id}'); closeProductModal();" class="add-to-cart-btn" style="width: 100%; margin-top: 20px; background: #004831; color: white; padding: 15px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; text-transform: uppercase;">🛒 कार्ट में जोड़ें</button>
            </div>
        </div>
    `;
    modal.style.display = 'block';
};

// उत्पादों को स्क्रीन पर दिखाने का फंक्शन
function renderProducts(productsList) {
    const container = document.getElementById('products-container');
    if (!container) return;

    // यदि लिस्ट खाली है, तो दोबारा चेक करें (Robustness)
    if (!productsList || productsList.length === 0) { // Fallback to global products if filtered list is empty
        productsList = window.currentProducts || window.products || [];
    }

    if (!productsList || productsList.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">कोई सामान नहीं मिला।</div>';
        return;
    }

    container.innerHTML = productsList.map(p => {
        const discount = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
        return `
        <div class="product-card" onclick="showProductDetails('${p.id}')">
            ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
            <div class="image-container">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
            </div>
            <div class="p-info" style="padding: 10px 0;">
                <h3 style="font-size: 1rem; color: #007185; margin: 0; line-height: 1.3; height: 2.6em; overflow: hidden;">${p.name}</h3>
                <div style="margin: 5px 0;">
                    <span style="font-size: 1.4rem; font-weight: bold;">₹${p.price}</span>
                    ${p.mrp ? `<span style="text-decoration: line-through; color: #565959; font-size: 0.8rem; margin-left: 5px;">M.R.P: ₹${p.mrp}</span>` : ''}
                </div>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${p.id}')" ${p.stockCount <= 0 ? 'disabled' : ''}>
                        ${p.stockCount <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button class="buy-now-btn" onclick="event.stopPropagation(); window.buyNow('${p.id}')" ${p.stockCount <= 0 ? 'disabled' : ''}>Buy Now</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

window.buyNow = (id) => {
    addToCart(id);
    openCart();
};

// मोडल कंट्रोल फंक्शन
window.openCart = () => {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'block';
        if (typeof renderCartItems === 'function') renderCartItems();
    }
};

window.closeProductModal = () => {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
};

window.closeCart = () => {
    const modal = document.getElementById('cart-modal');
    if (modal) modal.style.display = 'none';
};

window.openAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'block';
};

window.closeAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
};

window.openProfileModal = () => {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'block';
};

window.closeProfileModal = () => {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none';
};

// --- Authentication Functions (Fix for Auth Issues) ---
window.loginUser = async () => {
    // 🔥 Firebase Login Fix - Defensive Check
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert("❌ Firebase लोड नहीं हुआ। पेज रिफ्रेश करें।");
        console.error("Firebase not loaded");
        return;
    }
    
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    if (!email || !pass) return alert("कृपया ईमेल और पासवर्ड भरें।");
    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
        window.closeAuthModal();
        window.showToast("✅ लॉगिन सफल!");
    } catch (e) {
        alert("लॉगिन में त्रुटि: " + e.message);
    }
};


window.registerUser = async () => {
    // 🔥 Firebase Register Fix - Defensive Check
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert("❌ Firebase लोड नहीं हुआ। पेज रिफ्रेश करें।");
        console.error("Firebase not loaded");
        return;
    }
    
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    const conf = document.getElementById('auth-confirm-password').value;
    if (!email || !pass) return alert("कृपया सभी फील्ड भरें।");
    if (pass !== conf) return alert("पासवर्ड मेल नहीं खाते!");
    try {
        await firebase.auth().createUserWithEmailAndPassword(email, pass);
        window.closeAuthModal();
        window.showToast("✅ रजिस्ट्रेशन सफल!");
    } catch (e) {
        alert("रजिस्ट्रेशन में त्रुटि: " + e.message);
    }
};


window.logoutUser = () => {
    if (confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
        firebase.auth().signOut();
        window.showToast("👋 लॉगआउट सफल!");
    }
};

window.resetPassword = () => {
    const email = document.getElementById('auth-email').value.trim();
    if (!email) return alert("कृपया ईमेल भरें।");
    firebase.auth().sendPasswordResetEmail(email)
        .then(() => window.showToast("📧 पासवर्ड रिसेट लिंक आपके ईमेल पर भेज दिया गया है!"))
        .catch(e => {
            console.error(e);
            alert("त्रुटि: " + e.message + "\n\nसुझाव: सुनिश्चित करें कि आपने Firebase Console में 'Email/Password' इनेबल किया है और आप इसे localhost या लाइव सर्वर पर चला रहे हैं।");
        });
};

// --- Search History Logic (Amazon Style) ---
const HISTORY_KEY = 'riyaj_search_history';

function getSearchHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
}

function saveToHistory(term) {
    if (!term) return;
    let history = getSearchHistory();
    // डुप्लिकेट हटाएं और नया टर्म सबसे ऊपर जोड़ें, लिमिट 5 रखें
    history = [term, ...history.filter(h => h !== term)].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderSearchHistory() {
    const container = document.getElementById('search-history');
    if (!container) return;
    const history = getSearchHistory();
    
    if (history.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = history.map(term => `
        <div class="search-history-item" onclick="window.applySearchHistory('${term}')">
            <span>🕒 ${term}</span>
            <span style="color:#999;" onclick="event.stopPropagation(); window.removeFromHistory('${term}')">✕</span>
        </div>
    `).join('') + '<button class="clear-history-btn" onclick="window.clearHistory()">सर्च हिस्ट्री साफ करें</button>';
}

window.applySearchHistory = (term) => {
    const input = document.getElementById('search');
    input.value = term;
    input.dispatchEvent(new Event('input')); // फिल्टर ट्रिगर करें
};

window.removeFromHistory = (term) => {
    let history = getSearchHistory();
    history = history.filter(h => h !== term);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderSearchHistory();
};

window.clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    renderSearchHistory();
};

window.showRegistrationFields = () => {
    document.getElementById('confirm-pass-container').style.display = 'block';
    document.getElementById('real-reg-btn').style.display = 'block';
    document.getElementById('reg-toggle-btn').style.display = 'none';
    document.getElementById('auth-modal-title').textContent = '👤 नया अकाउंट रजिस्टर करें';
};

window.togglePasswordVisibility = (id) => {
    const el = document.getElementById(id);
    if (el) el.type = el.type === 'password' ? 'text' : 'password';
};

// --- User Profile Logic (Fix for Saving Issues) ---
function updateAuthUI(user) {
    const loginBtn = document.getElementById('menu-login');
    const profileBtn = document.getElementById('menu-profile');
    const logoutBtn = document.getElementById('menu-logout');
    const userGreeting = document.getElementById('menu-user-greeting');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'flex';
        if (userGreeting) userGreeting.textContent = `नमस्ते, ${user.displayName || 'किसान भाई'}`;
    } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (profileBtn) profileBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userGreeting) userGreeting.textContent = `नमस्ते, किसान भाई`;
    }
}

async function loadUserProfile(uid) {
    if (!window.db) return;
    window.db.ref('users/' + uid).on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (document.getElementById('prof-input-name')) document.getElementById('prof-input-name').value = data.name || '';
            if (document.getElementById('prof-input-phone')) document.getElementById('prof-input-phone').value = data.phone || '';
            if (document.getElementById('prof-input-aadhar')) document.getElementById('prof-input-aadhar').value = data.aadhar || '';
            
            if (document.getElementById('display-name')) document.getElementById('display-name').textContent = data.name || '---';
            if (document.getElementById('display-phone')) document.getElementById('display-phone').textContent = data.phone || '---';
            if (document.getElementById('display-aadhar')) document.getElementById('display-aadhar').textContent = data.aadhar || '---';
            
            let lastAddr = "---";
            if (data.addresses && data.addresses.length > 0) {
                lastAddr = data.addresses[data.addresses.length - 1];
                renderAddressesList(data.addresses);
            } else if (data.address) lastAddr = data.address;
            
            if (document.getElementById('display-address')) document.getElementById('display-address').textContent = lastAddr;
            if (data.name && document.getElementById('menu-user-greeting')) {
                document.getElementById('menu-user-greeting').textContent = `नमस्ते, ${data.name}`;
            }

            // Cart Modal UI Sync
            const statusDiv = document.getElementById('cart-profile-status');
            const infoDiv = document.getElementById('logged-in-user-info');
            if (data.name && data.phone && lastAddr !== "---") {
                if (statusDiv) statusDiv.style.display = 'none';
                if (infoDiv) infoDiv.style.display = 'block';
            } else {
                if (statusDiv) statusDiv.style.display = 'block';
                if (infoDiv) infoDiv.style.display = 'none';
            }
        }
    });
}

function renderAddressesList(addresses) {
    const container = document.getElementById('saved-addresses-list');
    if (container) {
        container.innerHTML = addresses.map((a, i) => `
            <div style="font-size:0.85rem; padding:8px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <span>📍 ${a}</span>
                <button onclick="window.removeAddress(${i})" style="color:#f44336; background:none; border:none; cursor:pointer; font-weight:bold;">✖</button>
            </div>
        `).join('');
    }
}

window.saveProfileData = async (silent = false) => {
    if (!window.currentUser) return;
    const name = document.getElementById('prof-input-name').value.trim();
    const phone = document.getElementById('prof-input-phone').value.trim();
    const aadhar = document.getElementById('prof-input-aadhar').value.trim();
    const address = document.getElementById('prof-input-address')?.value.trim();

    if (!name || !phone) return alert("कृपया नाम और मोबाइल नंबर भरें।");
    try {
        const updateData = { name, phone, aadhar };
        if (address) updateData.address = address; // एड्रेस को भी अपडेट में शामिल करें
        
        await window.db.ref('users/' + window.currentUser.uid).update(updateData);
        if (!silent) window.showToast("✅ प्रोफाइल अपडेट हुई!");
    } catch (e) { alert("त्रुटि: " + e.message); }
};

window.addAddressFromInput = async () => {
    if (!window.currentUser) return;
    const addr = document.getElementById('prof-input-address').value.trim();
    if (!addr) return;
    const ref = window.db.ref('users/' + window.currentUser.uid + '/addresses');
    const snap = await ref.once('value');
    let list = snap.val() || [];
    if (!Array.isArray(list)) list = [list];
    list.push(addr);
    await ref.set(list);
    document.getElementById('prof-input-address').value = '';
    window.showToast("✅ पता जोड़ दिया गया");
};

window.removeAddress = async (idx) => {
    if (!window.currentUser || !confirm("क्या आप यह पता हटाना चाहते हैं?")) return;
    const ref = window.db.ref('users/' + window.currentUser.uid + '/addresses');
    const snap = await ref.once('value');
    let list = snap.val() || [];
    list.splice(idx, 1);
    await ref.set(list);
};

function resetProfileUI() {
    const inputs = ['prof-input-name', 'prof-input-phone', 'prof-input-aadhar', 'prof-input-address'];
    inputs.forEach(id => { if (document.getElementById(id)) document.getElementById(id).value = ''; });
    const texts = ['display-name', 'display-phone', 'display-address', 'display-aadhar'];
    texts.forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = '---'; });
    if (document.getElementById('logged-in-user-info')) document.getElementById('logged-in-user-info').style.display = 'none';
}

// --- General App UI Functions ---
window.toggleMenu = () => {
    const menu = document.getElementById('side-menu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
};

// 🔥 Store Info - Added to Profile section as requested
window.openAboutModal = () => {
    const modal = document.getElementById('about-modal');
    if (modal) modal.style.display = 'block';
};

// 🔥 Full About Us Modal Functions
window.openAboutModal = () => {
    const modal = document.getElementById('about-modal');
    if (modal) modal.style.display = 'block';
};

window.closeAboutModal = () => {
    const modal = document.getElementById('about-modal');
    if (modal) modal.style.display = 'none';
};


window.toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
};

window.openMyOrders = () => {
    const modal = document.getElementById('orders-modal');
    if (modal) { modal.style.display = 'block'; renderMyOrders(); }
};

async function renderMyOrders() {
    const container = document.getElementById('my-orders-list');
    if (!container || !window.currentUser || !window.db) return;
    container.innerHTML = '<p style="text-align:center;">लोड हो रहा है...</p>';
    try {
        const snap = await window.db.ref('orders').orderByChild('userId').equalTo(window.currentUser.uid).once('value');
        const orders = snap.val();
        if (!orders) return container.innerHTML = '<p style="text-align:center; padding:20px;">कोई ऑर्डर नहीं मिला।</p>';
        container.innerHTML = Object.values(orders).reverse().map(o => `
            <div style="background:#f9f9f9; padding:12px; margin-bottom:10px; border-radius:10px; border-left:4px solid #2e7d32;">
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:0.9rem;">
                    <span>📅 ${o.date}</span><span style="color:#2e7d32;">₹${o.total.toLocaleString()}</span>
                </div>
                <div style="font-size:0.8rem; color:#666; margin:5px 0;">${o.items.map(i => i.name).join(', ')}</div>
            </div>
        `).join('');
    } catch (e) { container.innerHTML = "त्रुटि: " + e.message; }
}

window.openFeedbackModal = () => {
    const modal = document.getElementById('feedback-modal');
    if (modal) modal.style.display = 'block';
};

let currentRating = 0;
window.setFeedbackRating = (n) => {
    currentRating = n;
    document.querySelectorAll('.star-rating span').forEach((s, i) => s.textContent = i < n ? '★' : '☆');
};

window.submitFeedback = async () => {
    if (!currentRating) return alert("कृपया रेटिंग चुनें!");
    const text = document.getElementById('feedback-text').value;
    if (window.db) await window.db.ref('feedback').push({ rating: currentRating, text, user: window.currentUser ? window.currentUser.email : 'Guest' });
    window.showToast("शुक्रिया! आपकी राय हमें मिल गई है।");
    document.getElementById('feedback-modal').style.display = 'none';
};

window.changeLanguage = (lang) => { window.showToast("भाषा बदली गई: " + lang); };

// टोस्ट नोटिफिकेशन
window.showToast = (message) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    // 2.5s बाद हटा दें (CSS एनीमेशन के साथ मेल खाता हुआ)
    setTimeout(() => {
        toast.remove();
    }, 2500);
};