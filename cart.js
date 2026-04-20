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
      <img src="${item.image}" alt="${item.name}" loading="lazy"
           onload="this.classList.add('loaded')"
           style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #eee; transition: opacity 0.3s; opacity: 0;">
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
      // पता ढूंढने के लिए API कॉल
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

async function handleCheckout() {
  if (cart.length === 0) return;
  if (!window.currentUser) {
    alert("❌ ऑर्डर करने के लिए पहले लॉगिन करना अनिवार्य है।");
    window.openAuthModal();
    return;
  }

  // प्रोफाइल से डेटा लें
  const snapshot = await window.db.ref('users/' + window.currentUser.uid).once('value');
  const userData = snapshot.val();

  if (!userData || !userData.name || !userData.phone) {
    alert("❌ आपका प्रोफाइल अधूरा है। कृपया नाम और मोबाइल नंबर भरें।");
    window.openProfileModal();
    return;
  }

  // पते की जांच (पुराना स्ट्रिंग फॉर्मेट या नया एरे फॉर्मेट)
  let customerAddress = "";
  if (userData.addresses && userData.addresses.length > 0) {
    customerAddress = userData.addresses[userData.addresses.length - 1];
  } else if (userData.address) {
    customerAddress = userData.address;
  }

  if (!customerAddress) {
    alert("❌ कृपया 'मेरी प्रोफाइल' में कम से कम एक पता जोड़ें।");
    window.openProfileModal();
    return;
  }

  const customerName = userData.name;
  const customerPhone = userData.phone;
  const customerAadhar = userData.aadhar || "N/A";

  const phone = "919936733308"; // रियाज अहमद जी का व्हाट्सएप नंबर
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - (subtotal * appliedDiscount);
  
  const screenshotBase64 = document.getElementById('screenshot-base64').value;

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
  if (screenshotBase64) {
    message += `%0A%0A📸 *पेमेंट स्क्रीनशॉट अपलोड कर दिया गया है (Admin Panel में देखें)*`;
  }
  message += `%0A*कुल राशि: ₹${total.toLocaleString()}*`;

  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  window.open(whatsappUrl, '_blank');

  // ऑनलाइन ऑर्डर हिस्ट्री (Firebase) में सेव करें
  const orderId = Date.now();
  window.db.ref('orders/' + orderId).set({
    id: orderId,
    date: new Date().toLocaleString('hi-IN'),
    userId: window.currentUser ? window.currentUser.uid : 'guest', // यूजर ID भी सेव करें
    name: customerName.trim(),
    phone: customerPhone.trim(),
    address: customerAddress.trim(),
    aadhar: customerAadhar.trim(),
    items: cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
    total: total,
    paymentScreenshot: screenshotBase64 || null,
    status: 'New'
  });

  // ऑर्डर भेजने के बाद कार्ट खाली करें
  cart = [];
  localStorage.removeItem('cart');
  appliedDiscount = 0; // कूपन रिसेट करें
  document.getElementById('screenshot-base64').value = '';
  document.getElementById('payment-screenshot').value = '';
  document.getElementById('qr-payment-container').style.display = 'none';
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

  const upiUrl = `upi://pay?pa=9936733308-3@ybl&pn=Riyaj%20Ahmad&tn=Order%20from%20Riyaj%20Store&am=${total}&cu=INR`;

  // Mobile check for deep linking
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = upiUrl;
  } else {
    alert("💻 आप डेस्कटॉप पर हैं। कृपया 'QR कोड' बटन दबाएं और अपने मोबाइल से स्कैन करें।");
    window.showPaymentQR();
  }
};

window.showPaymentQR = () => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - (subtotal * appliedDiscount);
  if(total === 0) return alert("कार्ट खाली है!");
  
  const upiUri = `upi://pay?pa=9936733308-3@ybl&pn=Riyaj%20Ahmad&tn=Order%20from%20Riyaj%20Store&am=${total}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  const qrContainer = document.getElementById('qr-payment-container');
  if (!qrContainer) return;

  qrContainer.innerHTML = `
    <div style="text-align:center; padding:15px; background:#fff; border:2px solid #673ab7; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-top:10px;">
      <p style="font-weight:bold; color:#673ab7; margin-bottom:10px;">स्कैन करके पेमेंट करें</p>
      <img src="${qrUrl}" alt="Payment QR" style="width:200px; height:200px; border:1px solid #eee; padding:5px;">
      <p style="font-size:0.8rem; color:#666; margin-top:5px;">UPI ID: 9936733308-3@ybl</p>
      <button onclick="document.getElementById('qr-payment-container').style.display='none'" style="margin-top:10px; background:#f44336; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold; width:100%;">बंद करें (Close)</button>
    </div>
  `;
  qrContainer.style.display = 'block';
};

async function compressPaymentImage(base64Str) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      // क्वालिटी को 0.6 (60%) रखा है ताकि डेटाबेस पर लोड न पड़े
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
  });
}

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

  // स्क्रीनशॉट हैंडलर
  const screenshotInput = document.getElementById('payment-screenshot');
  if (screenshotInput) {
    screenshotInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const compressed = await compressPaymentImage(event.target.result);
          document.getElementById('screenshot-base64').value = compressed;
          if (window.showToast) window.showToast("✅ स्क्रीनशॉट तैयार है!");
        };
        reader.readAsDataURL(file);
      }
    };
  }

  updateCartCount();
});

// Global functions for onclick
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
