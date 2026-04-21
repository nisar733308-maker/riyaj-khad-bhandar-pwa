// app.js - रियाज अहमद खाद भंडार PWA की मुख्य लॉजिक फाइल

// ग्लोबल स्टेट
window.currentProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. सर्विस वर्कर रजिस्ट्रेशन (PWA के लिए)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log("Service Worker: Registered"))
            .catch(err => console.log("Service Worker: Registration Failed", err));
    }

    // 2. शुरुआती डेटा लोड करना
    // products.js से डिफॉल्ट प्रोडक्ट्स लें
    window.currentProducts = typeof products !== 'undefined' ? products : [];
    renderProducts(window.currentProducts);

    // 3. सर्च फंक्शनलिटी (Corrected ID to 'search')
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = window.currentProducts.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.category.toLowerCase().includes(query)
            );
            renderProducts(filtered);
        });
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

    // 6. Firebase Auth State Observer (Fix for Auth/Profile Sync)
    if (typeof firebase !== 'undefined') {
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
    }
});

// उत्पादों को स्क्रीन पर दिखाने का फंक्शन
function renderProducts(productsList) {
    const container = document.getElementById('products-container');
    if (!container) return;

    // यदि लिस्ट खाली है, तो दोबारा चेक करें (Robustness)
    if (!productsList || productsList.length === 0) {
        if (window.currentProducts && window.currentProducts.length > 0) {
            productsList = window.currentProducts;
        } else if (typeof products !== 'undefined' && products.length > 0) {
            productsList = products;
        }
    }

    if (!productsList || productsList.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">कोई सामान नहीं मिला।</div>';
        return;
    }

    container.innerHTML = productsList.map(product => `
        <div class="product-card" style="background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 20px rgba(0,0,0,0.08); transition: all 0.3s ease; border: 1px solid #f0f0f0; position: relative; display: flex; flex-direction: column;">
            <div style="position: relative; overflow: hidden;">
                <img src="${product.image || 'https://via.placeholder.com/400x300?text=Product'}" 
                     alt="${product.name}" 
                     loading="lazy"
                     onload="this.classList.add('loaded')"
                     onerror="this.src='https://via.placeholder.com/400x300?text=Image+Error'"
                     style="width: 100%; height: 200px; object-fit: cover; transition: all 0.5s ease;">
                ${product.stockCount <= 0 ? 
                    `<div style="position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #d32f2f; z-index: 2;">स्टॉक खत्म</div>` : ''}
                <span style="position: absolute; top: 12px; left: 12px; background: rgba(46, 125, 50, 0.9); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: bold; z-index: 1;">${product.category}</span>
            </div>
            <div style="padding: 16px; flex-grow: 1; display: flex; flex-direction: column;">
                <h3 style="margin: 0 0 8px 0; font-size: 1.15rem; color: #1a1a1a; font-weight: 700;">${product.name}</h3>
                <p style="font-size: 0.85rem; color: #757575; line-height: 1.4; height: 3.8em; overflow: hidden; margin-bottom: 15px;">${product.desc || ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                    <div>
                        <span style="font-size: 1.3rem; font-weight: 800; color: #2e7d32;">₹${product.price}</span>
                    </div>
                    <button onclick="addToCart('${product.id}')" 
                            ${product.stockCount <= 0 ? 'disabled' : ''}
                            style="background: ${product.stockCount <= 0 ? '#ccc' : '#2e7d32'}; color: white; border: none; padding: 10px 18px; border-radius: 10px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 10px rgba(46, 125, 50, 0.2);">
                        ${product.stockCount <= 0 ? 'खत्म' : '🛒 जोड़ें'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// मोडल कंट्रोल फंक्शन
window.openCart = () => {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'block';
        if (typeof renderCartItems === 'function') renderCartItems();
    }
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
    const email = document.getElementById('auth-email').value;
    if (!email) return alert("कृपया ईमेल भरें।");
    firebase.auth().sendPasswordResetEmail(email)
        .then(() => alert("पासवर्ड रिसेट लिंक भेज दिया गया है।"))
        .catch(e => alert(e.message));
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

window.saveProfileData = async () => {
    if (!window.currentUser) return;
    const name = document.getElementById('prof-input-name').value.trim();
    const phone = document.getElementById('prof-input-phone').value.trim();
    const aadhar = document.getElementById('prof-input-aadhar').value.trim();
    if (!name || !phone) return alert("कृपया नाम और मोबाइल नंबर भरें।");
    try {
        await window.db.ref('users/' + window.currentUser.uid).update({ name, phone, aadhar });
        window.showToast("✅ प्रोफाइल अपडेट हुई!");
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
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    toast.className = 'toast show';
    setTimeout(() => { 
        toast.className = 'toast';
        setTimeout(() => { toast.style.display = 'none'; }, 500);
    }, 3000);
};