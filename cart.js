// Cart logic with localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let appliedDiscount = 0; // 0.10 means 10%

function addToCart(productId, quantity = 1) {
  // currentProducts (Firebase वाला डेटा) से सामान ढूंढें
  const source = (typeof currentProducts !== 'undefined' && currentProducts.length > 0) ? currentProducts : products;
  const product = source.find(p => String(p.id) === String(productId));
  
  if (!product) return;
  if (product.stockCount <= 0) {
    if (window.showToast) window.showToast("❌ यह सामान अभी स्टॉक में नहीं है।");
    else alert("❌ यह सामान अभी स्टॉक में नहीं है।");
    return;
  }
  const existingItem = cart.find(item => String(item.id) === String(productId));
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({...product, quantity: quantity});
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  
  // Simple feedback
  if (window.event && window.event.target && window.event.target.tagName === 'BUTTON') {
    const btn = window.event.target;
    const originalText = btn.textContent;
    btn.textContent = '✅ जोड़ा गया!';
    setTimeout(() => { btn.textContent = originalText; }, 1500);
  }
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = `🛒 ${count}`;
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * appliedDiscount;
  const total = subtotal - discountAmount;
  
  const discountRow = document.getElementById('discount-row');
  const discountDisplay = document.getElementById('discount-amount');

  if (cart.length === 0) {
    container.innerHTML = '<p>कार्ट खाली है</p>';
    document.getElementById('total').textContent = '₹0';
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #eee;">
      <img src="${item.image}" alt="${item.name}" loading="lazy" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #eee;">
      <div style="flex: 1;">
        <div style="font-weight: bold;">${item.name}</div>
        <div style="color: #666;">₹${item.price}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button onclick="changeQuantity('${item.id}', -1)" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">-</button>
        <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
        <button onclick="changeQuantity('${item.id}', 1)" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">+</button>
      </div>
      <div style="font-weight: bold; min-width: 80px; text-align: right;">
        ₹${(item.price * item.quantity).toLocaleString()}
      </div>
      <button onclick="removeFromCart('${item.id}')" style="background: #f44336; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">हटाएं</button>
    </div>
  `).join('');
  
  if (appliedDiscount > 0 && subtotal > 0) {
    discountRow.style.display = 'flex';
    discountDisplay.textContent = `-₹${discountAmount.toLocaleString()}`;
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('total').textContent = `₹${total.toLocaleString()}`;
}

function removeFromCart(id) {
  cart = cart.filter(item => String(item.id) !== String(id));
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
}

function changeQuantity(id, delta) {
  const item = cart.find(item => String(item.id) === String(id));
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(id);
    } else {
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      renderCartItems();
    }
  }
}

function clearCart() {
  cart = [];
  localStorage.removeItem('cart');
  updateCartCount();
  renderCartItems();
  closeCart();
}

// कूपन लागू करने का फंक्शन
window.applyCoupon = () => {
  const code = document.getElementById('coupon-code').value.trim().toUpperCase();
  if (code === 'RIYAJ10') {
    appliedDiscount = 0.10; // 10% छूट
    if (window.showToast) window.showToast('✅ कूपन "RIYAJ10" लागू किया गया (10% छूट)');
    else alert('✅ कूपन "RIYAJ10" लागू किया गया (10% छूट)');
  } else if (code === "") {
    appliedDiscount = 0;
  } else {
    alert('❌ अमान्य कूपन कोड');
    appliedDiscount = 0;
  }
  renderCartItems();
};

// GPS Location Function
window.fetchCurrentLocation = () => {
  const addressInput = document.getElementById('customer-address');
  if (!navigator.geolocation) {
    alert("❌ आपका ब्राउज़र लोकेशन सपोर्ट नहीं करता।");
    return;
  }
  
  addressInput.placeholder = "लोकेशन ढूंढ रहे हैं...";
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    try {
      // OpenStreetMap Nominatim API (Free) to reverse geocode
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      addressInput.value = data.display_name || `${latitude}, ${longitude}`;
    } catch (e) {
      addressInput.value = `${latitude}, ${longitude}`;
    }
  }, (err) => {
    alert("❌ लोकेशन नहीं मिल पाई। कृपया सेटिंग में GPS चालू करें।");
    addressInput.placeholder = "पूरा पता";
  });
};

function handleCheckout() {
  if (cart.length === 0) return;
  if (!window.currentUser) {
    alert("❌ ऑर्डर करने के लिए पहले लॉगिन करना अनिवार्य है।");
    window.openAuthModal();
    return;
  }

  // ग्राहक की जानकारी इनपुट फील्ड से लें
  const customerName = document.getElementById('customer-name').value;
  const customerPhone = document.getElementById('customer-phone').value;
  const customerAddress = document.getElementById('customer-address').value;
  const customerAadhar = document.getElementById('customer-aadhar').value;

  const phoneRegex = /^[0-9]{10}$/;
  const aadharRegex = /^[0-9]{12}$/;

  if (!customerName.trim() || !customerAddress.trim()) {
    alert('कृपया नाम और पता भरें।');
    return;
  }
  if (!phoneRegex.test(customerPhone)) {
    alert('❌ मोबाइल नंबर 10 अंकों का होना चाहिए।');
    return;
  }
  if (!aadharRegex.test(customerAadhar)) {
    alert('❌ आधार कार्ड नंबर 12 अंकों का होना चाहिए।');
    return;
  }

  const phone = "919936733308"; // रियाज अहमद जी का व्हाट्सएप नंबर
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - (subtotal * appliedDiscount);
  
  // अगर यूजर लॉग इन है और उसने 'सेव करें' चेकबॉक्स पर टिक किया है, तो प्रोफाइल अपडेट करें
  if (window.currentUser && document.getElementById('save-customer-details').checked) {
    window.db.ref('users/' + window.currentUser.uid).set({
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      aadhar: customerAadhar,
      email: window.currentUser.email // ईमेल भी सेव करें
    }).then(() => {
      console.log("User profile updated successfully!");
    }).catch(error => {
      console.error("Error updating user profile:", error);
    });
  }

  let message = `*नया ऑर्डर - रियाज अहमद खाद भंडार*%0A%0A`;
  message += `*नाम:* ${customerName}%0A`;
  message += `*ग्राहक मोबाइल:* ${customerPhone}%0A`;
  message += `*पता:* ${customerAddress}%0A`;
  message += `*आधार:* ${customerAadhar}%0A%0A`;
  
  cart.forEach(item => {
    message += `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}%0A`;
  });
  if (appliedDiscount > 0) {
    message += `%0A*छूट (10%):* -₹${subtotal * appliedDiscount}%0A`;
  }
  message += `%0A*कुल राशि: ₹${total.toLocaleString()}*`;

  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  window.open(whatsappUrl, '_blank');

  // ऑनलाइन ऑर्डर हिस्ट्री (Firebase) में सेव करें
  const orderId = Date.now();
  db.ref('orders/' + orderId).set({
    id: orderId,
    date: new Date().toLocaleString('hi-IN'),
    userId: window.currentUser ? window.currentUser.uid : 'guest', // यूजर ID भी सेव करें
    name: customerName.trim(),
    phone: customerPhone.trim(),
    address: customerAddress.trim(),
    aadhar: customerAadhar.trim(),
    items: cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
    total: total,
    status: 'New'
  });

  // ऑर्डर भेजने के बाद कार्ट खाली करें
  cart = [];
  localStorage.removeItem('cart');
  appliedDiscount = 0; // कूपन रिसेट करें
  updateCartCount();
  closeCart();
}

window.payViaUPI = () => {
  if (!window.currentUser) {
    alert("❌ पेमेंट करने के लिए पहले लॉगिन करना अनिवार्य है।");
    window.openAuthModal();
    return;
  }
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - (subtotal * appliedDiscount);
  if(total === 0) return;
  window.open(`upi://pay?pa=9936733308@upi&pn=Riyaj%20Ahmad&am=${total}&cu=INR`, '_blank');
};

function printInvoice() {
  if (cart.length === 0) return;
  
  const printWindow = window.open('', '_blank');
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const date = new Date().toLocaleDateString('hi-IN');

  let invoiceHTML = `
    <html>
    <head>
      <title>रसीद - रियाज अहमद खाद भंडार</title>
      <style>
        body { font-family: 'Arial', sans-serif; padding: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { text-align: right; font-size: 1.5rem; font-weight: bold; color: #2e7d32; }
        .footer { text-align: center; margin-top: 50px; font-size: 0.9rem; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>रियाज अहमद खाद भंडार</h1>
        <p>प्रो. रियाज अहमद | मोबाइल: 9936733308</p>
        <p>दिनांक: ${date}</p>
      </div>
      <table>
        <thead><tr><th>उत्पाद</th><th>दर</th><th>मात्रा</th><th>कुल</th></tr></thead>
        <tbody>
          ${cart.map(item => `<tr><td>${item.name}</td><td>₹${item.price}</td><td>${item.quantity}</td><td>₹${(item.price * item.quantity).toLocaleString()}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="total">कुल राशि: ₹${total.toLocaleString()}</div>
      <div class="footer"><p>हमारे यहाँ आने के लिए धन्यवाद! हम आपके उज्ज्वल भविष्य की कामना करते हैं।</p></div>
    </body></html>`;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  printWindow.print();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('clear-cart').onclick = clearCart;
  document.getElementById('print-cart').onclick = printInvoice;
  const checkoutBtn = document.getElementById('checkout');
  if (checkoutBtn) checkoutBtn.onclick = handleCheckout;
  updateCartCount();
});

// Global functions for onclick
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
