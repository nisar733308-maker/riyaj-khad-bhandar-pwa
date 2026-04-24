// Cart logic with localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let appliedDiscount = 0; // 0.10 means 10%

function addToCart(productId, quantity = 1) {
  // currentProducts (Firebase वाला डेटा) से सामान ढूंढें
  const source = window.currentProducts || window.products || [];
  const product = source.find(p => String(p.id) === String(productId));
  
  if (!product) return console.error("Product not found:", productId);
  if (product.stockCount !== undefined && product.stockCount <= 0) {
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
  
  // Simple feedback (Robust way)
  // querySelector को बेहतर बनाया गया है ताकि यह event.stopPropagation वाले बटनों को भी ढूंढ सके
  const buttons = document.querySelectorAll('button');
  const targetBtn = Array.from(buttons).find(b => b.getAttribute('onclick')?.includes(`addToCart('${productId}')`));
  if (targetBtn) {
    const originalText = targetBtn.innerHTML;
    targetBtn.innerHTML = '✅ जोड़ा गया';
    setTimeout(() => { targetBtn.innerHTML = originalText; }, 1500);
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

  // Authentication display logic
  const loginPrompt = document.getElementById('login-prompt-in-cart');
  if (loginPrompt) loginPrompt.style.display = window.currentUser ? 'none' : 'block';
  // Note: 'logged-in-user-info' visibility is managed by loadUserProfile in app.js

  if (cart.length === 0) {
    container.innerHTML = '<p>कार्ट खाली है</p>';
    document.getElementById('total').textContent = '₹0';
    return;
  }
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #eee;">
      <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.name}" loading="lazy" 
           style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #eee;">
      <div style="flex: 1;">
        <div style="font-weight: 600; color: #333;">${item.name}</div>
        <div style="color: #2e7d32; font-weight: bold;">₹${item.price}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button onclick="changeQuantity('${item.id}', -1)" style="width: 30px; height: 30px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px; cursor: pointer;">-</button>
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
  } else {
    // अगर DB में नहीं है, तो इनपुट फील्ड से चेक करें (प्रोफाइल या कार्ट)
    const manualAddr = document.getElementById('prof-input-address')?.value || document.getElementById('customer-address')?.value;
    customerAddress = userData.address || manualAddr || "";
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
  
  const screenshotBase64 = document.getElementById('screenshot-base64')?.value;

  let text = `*नया ऑर्डर - रियाज अहमद खाद भंडार*\n\n`;
  text += `*नाम:* ${customerName}\n`;
  text += `*मोबाइल:* ${customerPhone}\n`;
  text += `*पता:* ${customerAddress}\n`;
  text += `*आधार:* ${customerAadhar}\n\n`;
  
  cart.forEach(item => {
    text += `• ${item.name} (x${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString()}\n`;
  });
  if (appliedDiscount > 0) {
    text += `\n*छूट (10%):* -₹${(subtotal * appliedDiscount).toLocaleString()}\n`;
  }
  text += `\n*कुल राशि: ₹${total.toLocaleString()}*`;
  if (screenshotBase64) text += `\n\n📸 _पेमेंट स्क्रीनशॉट पोर्टल पर अपलोड कर दिया गया है_`;

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
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
  const finalTotal = (subtotal - (subtotal * appliedDiscount)).toFixed(2);
  if(parseFloat(finalTotal) <= 0) return;

  const upiUrl = `upi://pay?pa=9936733308-3@ybl&pn=Riyaj%20Ahmad&tn=OrderPayment&am=${finalTotal}&cu=INR`;

  // Mobile check for deep linking
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = 'payment.html';
  } else {
    window.location.href = 'payment.html';
  }
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
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - (subtotal * appliedDiscount);
  const date = new Date().toLocaleDateString('hi-IN');
  
  const upiUri = `upi://pay?pa=9936733308-3@ybl&pn=Riyaj Ahmad&tn=InvoicePayment&am=${total}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`;

  let invoiceHTML = `
    <html>
    <head>
      <title>रसीद - रियाज अहमद खाद भंडार</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; line-height: 1.6; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #2e7d32; padding-bottom: 15px; margin-bottom: 25px; }
        .logo { width: 80px; height: 80px; margin-bottom: 10px; border-radius: 50%; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #e8f5e9; color: #2e7d32; }
        .invoice-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; }
        .qr-section { text-align: center; border: 1px solid #eee; padding: 10px; border-radius: 10px; }
        .total-box { text-align: right; font-size: 1.3rem; font-weight: bold; color: #2e7d32; }
        .shop-info { font-size: 0.9rem; color: #555; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="./new-icon-192.png" alt="Logo" class="logo" style="width:80px; height:80px; border-radius:12px; margin-bottom:5px; object-fit:cover;">
        <img src="./new-icon-512.png" alt="Website Logo" style="width:60px; height:60px; border-radius:8px; margin-top:5px; object-fit:cover; display:block; margin:0 auto;">
        <h1>रियाज अहमद खाद भंडार</h1>
        <div class="shop-info">
          <p><strong>प्रो. रियाज अहमद</strong> | मोबाइल: 9936733308</p>
          <p>इलाहवास, बहादुरी बाजार, महाराजगंज (U.P.)</p>
          <p><strong>दिनांक:</strong> ${date}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>उत्पाद</th><th>दर</th><th>मात्रा</th><th>कुल</th></tr></thead>
        <tbody>
          ${cart.map(item => `<tr><td>${item.name}</td><td>₹${item.price}</td><td>${item.quantity}</td><td>₹${(item.price * item.quantity).toLocaleString()}</td></tr>`).join('')}
        </tbody>
      </table>
      
      <div class="invoice-footer">
        <div class="qr-section">
          <img src="${qrUrl}" alt="Payment QR">
          <p style="font-size: 0.7rem; margin-top: 5px;">भुगतान के लिए स्कैन करें</p>
        </div>
        <div class="total-box">
          ${appliedDiscount > 0 ? `<p style="font-size: 0.9rem; color: red; margin-bottom: 5px;">छूट: -₹${(subtotal * appliedDiscount).toLocaleString()}</p>` : ''}
          कुल राशि: ₹${total.toLocaleString()}
        </div>
      </div>
      <div style="text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px;">
        <p>🌸 हमारे यहाँ आने के लिए धन्यवाद! 🌸</p>
      </div>
      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2e7d32; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
      </div>
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
