// app.js (Optimized - UI SAME, Logic Improved)

// ========= GLOBAL =========
window.currentProducts = [];
window.currentUser = null;

const $ = (id) => document.getElementById(id);

// ========= INIT =========
document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    initProducts();
    initFilters();
    initFirebaseSync();
    initAuthObserver();
});

// ========= SERVICE WORKER =========
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log("SW Registered"))
            .catch(err => console.warn("SW Failed:", err));
    }
}

// ========= PRODUCTS =========
function initProducts() {
    window.currentProducts = window.products || [];
    renderProducts(window.currentProducts);
}

// ========= FILTER SYSTEM =========
function initFilters() {
    const search = $('search');
    const category = $('category-filter');
    const rating = $('rating-filter');
    const sort = $('sort-filter');
    const clear = $('clear-filters-btn');

    const applyFilters = () => {
        let data = [...window.currentProducts];

        const q = search?.value.toLowerCase();
        if (q) {
            data = data.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            );
        }

        if (category?.value && category.value !== 'all') {
            data = data.filter(p => p.category === category.value);
        }

        if (rating?.value && rating.value !== '0') {
            const min = +rating.value;
            data = data.filter(p => {
                const avg = p.reviews?.length
                    ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
                    : 0;
                return avg >= min;
            });
        }

        if (sort?.value === 'low-high') data.sort((a, b) => a.price - b.price);
        if (sort?.value === 'high-low') data.sort((a, b) => b.price - a.price);

        renderProducts(data);
    };

    [search, category, rating, sort].forEach(el => {
        el?.addEventListener('input', applyFilters);
        el?.addEventListener('change', applyFilters);
    });

    clear?.addEventListener('click', () => {
        if (search) search.value = '';
        if (category) category.value = 'all';
        if (rating) rating.value = '0';
        if (sort) sort.value = 'none';
        renderProducts(window.currentProducts);
    });
}

// ========= FIREBASE =========
function initFirebaseSync() {
    if (!window.db) return;

    window.db.ref('products').on('value', snap => {
        const data = snap.val();
        if (!data) return;

        window.currentProducts = Array.isArray(data)
            ? data
            : Object.values(data);

        renderProducts(window.currentProducts);
    });
}

// ========= AUTH =========
function initAuthObserver() {
    if (!window.firebase?.auth) return;

    firebase.auth().onAuthStateChanged(user => {
        window.currentUser = user;
        updateAuthUI(user);

        if (user && window.db) loadUserProfile(user.uid);
        else resetProfileUI();
    });
}

// ========= GPS =========
window.fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
        return showToast("GPS support नहीं");
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();

            const address = data.display_name ||
                `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;

            $('prof-input-address').value = address;
            showToast("📍 Address updated");
        } catch {
            $('prof-input-address').value = `Lat: ${lat}, Lng: ${lng}`;
        }
    }, () => showToast("GPS Error"), {
        enableHighAccuracy: true,
        timeout: 15000
    });
};

// ========= PRODUCT RENDER =========
function renderProducts(list) {
    const container = $('products-container');
    if (!container) return;

    if (!list?.length) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;">कोई सामान नहीं मिला</div>';
        return;
    }

    const frag = document.createDocumentFragment();

    list.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.onclick = () => showProductDetails(p.id);

        div.innerHTML = `
            <img src="${p.image}" loading="lazy">
            <h3>${p.name}</h3>
            <p>${p.desc || ''}</p>
            <strong>₹${p.price}</strong>
            <button onclick="event.stopPropagation(); addToCart('${p.id}')">
                ${p.stockCount <= 0 ? 'खत्म' : '🛒 जोड़ें'}
            </button>
        `;

        frag.appendChild(div);
    });

    container.innerHTML = '';
    container.appendChild(frag);
}

// ========= MODALS =========
const toggleModal = (id, show = true) => {
    const el = $(id);
    if (el) el.style.display = show ? 'block' : 'none';
};

window.openCart = () => toggleModal('cart-modal');
window.closeCart = () => toggleModal('cart-modal', false);
window.openAuthModal = () => toggleModal('auth-modal');
window.closeAuthModal = () => toggleModal('auth-modal', false);
window.openProfileModal = () => toggleModal('profile-modal');
window.closeProfileModal = () => toggleModal('profile-modal', false);
window.openAboutModal = () => toggleModal('about-modal');
window.closeAboutModal = () => toggleModal('about-modal', false);

// ========= AUTH FUNCTIONS =========
window.loginUser = async () => {
    if (!firebase?.auth) return alert("Firebase error");

    const email = $('auth-email').value;
    const pass = $('auth-password').value;

    if (!email || !pass) return alert("Fill fields");

    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
        closeAuthModal();
        showToast("Login success");
    } catch (e) {
        alert(e.message);
    }
};

window.registerUser = async () => {
    const email = $('auth-email').value;
    const pass = $('auth-password').value;
    const conf = $('auth-confirm-password').value;

    if (pass !== conf) return alert("Password mismatch");

    try {
        await firebase.auth().createUserWithEmailAndPassword(email, pass);
        closeAuthModal();
    } catch (e) {
        alert(e.message);
    }
};

window.logoutUser = () => firebase.auth().signOut();

// ========= TOAST =========
window.showToast = (msg) => {
    const container = $('toast-container');
    if (!container) return;

    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;

    container.appendChild(t);
    setTimeout(() => t.remove(), 2500);
};