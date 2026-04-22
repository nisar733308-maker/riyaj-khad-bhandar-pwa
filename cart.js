// ========= STATE =========
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let appliedDiscount = 0;

const $ = (id) => document.getElementById(id);

// ========= HELPERS =========
const saveCart = () => localStorage.setItem('cart', JSON.stringify(cart));

const getProductsSource = () =>
  (window.currentProducts?.length ? window.currentProducts :
    window.products || []);

const calculateTotals = () => {
  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const discount = subtotal * appliedDiscount;
  return {
    subtotal,
    discount,
    total: subtotal - discount
  };
};

// ========= CART ACTIONS =========
function addToCart(productId, quantity = 1) {
  const product = getProductsSource().find(p => String(p.id) === String(productId));

  if (!product) return console.error("Product not found:", productId);

  if (product.stockCount !== undefined && product.stockCount <= 0) {
    return window.showToast?.("❌ यह सामान स्टॉक में नहीं है") || alert("❌ Out of stock");
  }

  const item = cart.find(i => String(i.id) === String(productId));

  if (item) item.quantity += quantity;
  else cart.push({ ...product, quantity });

  saveCart();
  updateCartCount();
}

function removeFromCart(id) {
  cart = cart.filter(i => String(i.id) !== String(id));
  saveCart();
  updateCartCount();
  renderCartItems();
}

function changeQuantity(id, delta) {
  const item = cart.find(i => String(i.id) === String(id));
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) return removeFromCart(id);

  saveCart();
  updateCartCount();
  renderCartItems();
}

function clearCart() {
  cart = [];
  appliedDiscount = 0;
  localStorage.removeItem('cart');
  updateCartCount();
  renderCartItems();
  window.closeCart?.();
}

// ========= UI =========
function updateCartCount() {
  const el = $('cart-count');
  if (!el) return;
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  el.textContent = `🛒 ${count}`;
}

function renderCartItems() {
  const container = $('cart-items');
  if (!container) return;

  const { subtotal, discount, total } = calculateTotals();

  const loginPrompt = $('login-prompt-in-cart');
  if (loginPrompt) loginPrompt.style.display = window.currentUser ? 'none' : 'block';

  if (!cart.length) {
    container.innerHTML = '<p>कार्ट खाली है</p>';
    $('total').textContent = '₹0';
    return;
  }

  const frag = document.createDocumentFragment();

  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';

    div.innerHTML = `
      <img src="${item.image || 'https://via.placeholder.com/60'}" loading="lazy">
      <div>${item.name}</div>
      <div>₹${item.price}</div>
      <div>
        <button onclick="changeQuantity('${item.id}',-1)">-</button>
        ${item.quantity}
        <button onclick="changeQuantity('${item.id}',1)">+</button>
      </div>
      <div>₹${(item.price * item.quantity).toLocaleString()}</div>
      <button onclick="removeFromCart('${item.id}')">हटाएं</button>
    `;

    frag.appendChild(div);
  });

  container.innerHTML = '';
  container.appendChild(frag);

  const discountRow = $('discount-row');
  const discountDisplay = $('discount-amount');

  if (appliedDiscount > 0 && subtotal > 0) {
    discountRow.style.display = 'flex';
    discountDisplay.textContent = `-₹${discount.toLocaleString()}`;
  } else {
    discountRow.style.display = 'none';
  }

  $('total').textContent = `₹${total.toLocaleString()}`;
}

// ========= COUPON =========
window.applyCoupon = () => {
  const code = $('coupon-code')?.value.trim().toUpperCase();

  if (code === 'RIYAJ10') {
    appliedDiscount = 0.10;
    window.showToast?.("✅ 10% छूट लागू") || alert("10% Discount applied");
  } else if (!code) {
    appliedDiscount = 0;
  } else {
    appliedDiscount = 0;
    alert("❌ गलत कूपन");
  }

  renderCartItems();
};

// ========= CHECKOUT =========
async function handleCheckout() {
  if (!cart.length) return;
  if (!window.currentUser) {
    alert("पहले लॉगिन करें");
    return window.openAuthModal?.();
  }

  const snap = await window.db?.ref('users/' + window.currentUser.uid).once('value');
  const user = snap?.val();

  if (!user?.name || !user?.phone) {
    alert("प्रोफाइल पूरा करें");
    return window.openProfileModal?.();
  }

  const address = user.addresses?.at(-1) || user.address ||
    $('prof-input-address')?.value || $('customer-address')?.value;

  if (!address) {
    alert("पता जोड़ें");
    return window.openProfileModal?.();
  }

  const { subtotal, total } = calculateTotals();
  const phone = "919936733308";

  let text = `*नया ऑर्डर*\n\nनाम: ${user.name}\nमोबाइल: ${user.phone}\nपता: ${address}\n\n`;

  cart.forEach(i => {
    text += `• ${i.name} x${i.quantity} - ₹${(i.price * i.quantity)}\n`;
  });

  text += `\nकुल: ₹${total}`;

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);

  const id = Date.now();
  await window.db.ref('orders/' + id).set({
    id,
    date: new Date().toLocaleString('hi-IN'),
    userId: window.currentUser.uid,
    name: user.name,
    phone: user.phone,
    address,
    items: cart,
    total,
    status: 'New'
  });

  clearCart();
}

// ========= INIT =========
document.addEventListener('DOMContentLoaded', () => {
  $('clear-cart')?.addEventListener('click', clearCart);
  $('print-cart')?.addEventListener('click', printInvoice);
  $('checkout')?.addEventListener('click', handleCheckout);

  updateCartCount();
});

// ========= GLOBAL =========
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;