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
});

// उत्पादों को स्क्रीन पर दिखाने का फंक्शन
function renderProducts(productsList) {
    const container = document.getElementById('product-grid');
    if (!container) return;

    if (productsList.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">कोई सामान नहीं मिला।</div>';
        return;
    }

    container.innerHTML = productsList.map(product => `
        <div class="product-card" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: transform 0.2s;">
            <div style="position: relative;">
                <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}" 
                     style="width: 100%; height: 180px; object-fit: cover;">
                ${product.stockCount <= 0 ? 
                    `<span style="position: absolute; top: 10px; right: 10px; background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">आउट ऑफ स्टॉक</span>` 
                    : ''}
            </div>
            <div style="padding: 15px;">
                <span style="font-size: 0.75rem; color: #2e7d32; font-weight: bold; text-transform: uppercase;">${product.category}</span>
                <h3 style="margin: 5px 0; font-size: 1.1rem; color: #333;">${product.name}</h3>
                <p style="font-size: 0.85rem; color: #666; height: 40px; overflow: hidden; margin-bottom: 10px;">${product.desc || ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.2rem; font-weight: bold; color: #2e7d32;">₹${product.price}</span>
                    <button onclick="addToCart('${product.id}')" 
                            ${product.stockCount <= 0 ? 'disabled' : ''}
                            style="background: #2e7d32; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        ${product.stockCount <= 0 ? 'खत्म' : 'जोड़ें +'}
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