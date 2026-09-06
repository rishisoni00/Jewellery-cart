let products = [
  { id: 1, name: "Royal Diamond Solitaire", category: "women", price: 125000, mudraReward: 50, img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500" },
  { id: 2, name: "Men's Solid Gold Kada", category: "men", price: 85000, mudraReward: 30, img: "https://images.unsplash.com/photo-1611591475155-4282fc289e74?w=500" },
  { id: 3, name: "Emerald Cut Platinum Ring", category: "women", price: 210000, mudraReward: 80, img: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=500" }
];

let currentUser = {
  memberId: "",
  name: "",
  contact: "",
  mudraGold: 0,
  mudraSilver: 0,
  wishlist: [],
  cart: [],
  orders: []
};

let developerLogs = [];
let startTime = Date.now();
let activeInspectedProduct = null;
let inspectionStartTime = null;
let pendingBookingProduct = null;

function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById('userNameInput').value;
  const contact = document.getElementById('userContactInput').value;
  const generatedId = 'AUR-' + Math.floor(100000 + Math.random() * 900000);
  
  currentUser.memberId = generatedId;
  currentUser.name = name;
  currentUser.contact = contact;

  localStorage.setItem('aura_user', JSON.stringify(currentUser));
  
  document.getElementById('authModal').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';

  updateUserUI();
  logDeveloperEvent(`NEW SIGNUP: ${generatedId} | ${name} | ${contact}`);
  displayProducts(products);
}

window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('aura_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    updateUserUI();
    displayProducts(products);
  } else {
    document.getElementById('authModal').style.display = 'flex';
  }
});

function updateUserUI() {
  document.getElementById('user-member-id').innerText = currentUser.memberId;
  document.getElementById('sidebar-user-name').innerText = currentUser.name;
  document.getElementById('profile-id').innerText = currentUser.memberId;
  document.getElementById('profile-name').innerText = currentUser.name;
  document.getElementById('profile-contact').innerText = currentUser.contact;
  document.getElementById('mudra-gold').innerText = currentUser.mudraGold;
  document.getElementById('profile-mudra').innerText = `${currentUser.mudraGold} Gold`;
  document.getElementById('wishlist-count').innerText = currentUser.wishlist.length;
  document.getElementById('cart-count').innerText = currentUser.cart.length;
}

function displayProducts(items) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  items.forEach(p => {
    const isWishlisted = currentUser.wishlist.includes(p.id);
    grid.innerHTML += `
      <div class="product-card" onclick="openHDView('${p.img}', '${p.name}', ${p.price}, ${p.id}, ${p.mudraReward})">
        <div class="card-wishlist-icon" onclick="event.stopPropagation(); toggleWishlist(${p.id})">
          <svg class="icon-svg ${isWishlisted ? 'active-wishlist' : ''}" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div class="img-container">
          <img src="${p.img}" class="product-img" alt="${p.name}">
        </div>
        <h3>${p.name}</h3>
        <p class="mudra-tag">Reward: ${p.mudraReward} Mudra Gold</p>
        <p class="price">₹${p.price.toLocaleString()}</p>
        <button class="btn-gold-action" onclick="event.stopPropagation(); initiateBooking(${p.id})">Book Now</button>
        <button class="btn-gold-action" style="background:#444; color:#fff" onclick="event.stopPropagation(); addToCart(${p.id})">Cart</button>
        <button class="btn-gold-action" style="background:#222; color:#D4AF37" onclick="event.stopPropagation(); open3D()">View</button>
      </div>
    `;
  });
}

function startInspectingProduct(id) {
  if (activeInspectedProduct !== null) recordTimeSpent(activeInspectedProduct);
  activeInspectedProduct = id;
  inspectionStartTime = Date.now();
}

function recordTimeSpent(id) {
  if (inspectionStartTime) {
    const elapsed = Math.round((Date.now() - inspectionStartTime) / 1000);
    logDeveloperEvent(`ANALYTICS: Member ${currentUser.memberId} spent ${elapsed}s on Product ${id}`);
  }
}

function openHDView(imgSrc, title, price, id, mudra) {
  startInspectingProduct(id);
  pendingBookingProduct = products.find(p => p.id === id);
  document.getElementById('hdModalImage').src = imgSrc;
  document.getElementById('hdModalTitle').innerText = title;
  document.getElementById('hdModalPrice').innerText = `₹${price.toLocaleString()}`;
  document.getElementById('hdModalMudra').innerText = `Reward: ${mudra} Mudra Gold`;
  document.getElementById('modalBookBtn').onclick = () => initiateBooking(id);
  document.getElementById('imageModal').style.display = 'flex';
}

function closeImageModal() {
  if (activeInspectedProduct !== null) {
    recordTimeSpent(activeInspectedProduct);
    activeInspectedProduct = null;
  }
  document.getElementById('imageModal').style.display = 'none';
}

function toggleWishlist(id) {
  const index = currentUser.wishlist.indexOf(id);
  if (index === -1) {
    currentUser.wishlist.push(id);
  } else {
    currentUser.wishlist.splice(index, 1);
  }
  updateUserUI();
  displayProducts(products);
}

function addToCart(id) {
  currentUser.cart.push(id);
  updateUserUI();
  alert("Item added to cart!");
}

function initiateBooking(id) {
  closeImageModal();
  pendingBookingProduct = products.find(p => p.id === id);
  document.getElementById('checkoutProdName').innerText = pendingBookingProduct.name;
  document.getElementById('checkoutProdPrice').innerText = `₹${pendingBookingProduct.price.toLocaleString()}`;
  document.getElementById('checkoutMudraCredit').innerText = pendingBookingProduct.mudraReward / 2;
  
  document.getElementById('checkoutStep1').style.display = 'block';
  document.getElementById('checkoutStep2').style.display = 'none';
  document.getElementById('bookingCheckoutModal').style.display = 'flex';
}

function executeSureBooking() {
  const halfReward = pendingBookingProduct.mudraReward / 2;
  currentUser.mudraGold += halfReward;
  
  const newOrder = {
    orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    productName: pendingBookingProduct.name,
    price: pendingBookingProduct.price,
    status: 'Pending Confirmation'
  };
  currentUser.orders.push(newOrder);

  updateUserUI();
  document.getElementById('checkoutStep1').style.display = 'none';
  document.getElementById('checkoutStep2').style.display = 'block';

  logDeveloperEvent(`BOOKING: User ${currentUser.memberId} requested ${pendingBookingProduct.name}. Credit: ${halfReward} Mudra`);
}

function closeCheckoutModal() {
  document.getElementById('bookingCheckoutModal').style.display = 'none';
}

function logDeveloperEvent(msg) {
  const time = new Date().toLocaleTimeString();
  developerLogs.unshift(`[${time}] ${msg}`);
  const logContainer = document.getElementById('developerAnalyticsLog');
  if (logContainer) {
    logContainer.innerHTML = developerLogs.map(l => `<div>${l}</div>`).join('');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

function showUserDetailsModal() {
  document.getElementById('session-time').innerText = Math.round((Date.now() - startTime) / 1000);
  document.getElementById('userModal').style.display = 'flex';
}

function closeUserModal() {
  document.getElementById('userModal').style.display = 'none';
}

function showMyOrdersModal() {
  const container = document.getElementById('ordersListContainer');
  if (currentUser.orders.length === 0) {
    container.innerHTML = "No orders requested yet.";
  } else {
    container.innerHTML = currentUser.orders.map(o => `
      <div style="background:#222; padding:10px; margin:8px 0; border-radius:4px;">
        <p><strong>Order ID:</strong> ${o.orderId}</p>
        <p><strong>Item:</strong> ${o.productName}</p>
        <p><strong>Status:</strong> ${o.status}</p>
      </div>
    `).join('');
  }
  document.getElementById('myOrdersModal').style.display = 'flex';
}

function closeOrdersModal() {
  document.getElementById('myOrdersModal').style.display = 'none';
}

function toggleAdminPanel() {
  const panel = document.getElementById('adminPanel');
  panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
}

function addNewProduct() {
  const name = document.getElementById('newProdName').value;
  const price = Number(document.getElementById('newProdPrice').value);
  const category = document.getElementById('newProdCat').value;
  const img = document.getElementById('newProdImg').value;
  const mudraReward = Number(document.getElementById('newProdMudra').value);

  if (name && price && category && img) {
    const newProd = { id: products.length + 1, name, price, category, img, mudraReward: mudraReward || 20 };
    products.push(newProd);
    displayProducts(products);
    toggleAdminPanel();
    alert('Product added to catalog!');
  }
}

function filterProducts() {
  const val = document.getElementById('searchInput').value.toLowerCase();
  const filtered = products.filter(p => p.name.toLowerCase().includes(val));
  displayProducts(filtered);
}

function sortProducts() {
  const val = document.getElementById('sortPrice').value;
  let sorted = [...products];
  if (val === 'low-high') sorted.sort((a, b) => a.price - b.price);
  if (val === 'high-low') sorted.sort((a, b) => b.price - a.price);
  displayProducts(sorted);
}

function filterCategory(cat) {
  if (cat === 'all') return displayProducts(products);
  const filtered = products.filter(p => p.category === cat);
  displayProducts(filtered);
}

function open3D() {
  document.getElementById('3dModal').style.display = 'flex';
  const container = document.getElementById('three-container');
  container.innerHTML = '';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, 300);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
  const material = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true });
  const ring = new THREE.Mesh(geometry, material);
  scene.add(ring);

  camera.position.z = 3;

  function animate() {
    requestAnimationFrame(animate);
    ring.rotation.x += 0.01;
    ring.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}

function close3DModal() {
  document.getElementById('3dModal').style.display = 'none';
}

setInterval(() => {
  const liveUsers = Math.floor(Math.random() * (160 - 110 + 1)) + 110;
  const target = document.getElementById('live-users');
  if (target) target.innerText = liveUsers;
}, 3000);

console.log('Royal Collection Loaded');

It is my css code--
:root {
  --primary-gold: #D4AF37;
  --gold-hover: #F3E5AB;
  --dark-bg: #0A0A0A;
  --card-bg: #151515;
  --text-light: #F5F5F5;
  --border-color: #2A2A2A;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
  background-color: var(--dark-bg);
  color: var(--text-light);
  overflow-x: hidden;
}

/* Fix Auth Modal */
.auth-modal {
  display: flex !important;
  z-index: 9999;
}

.auth-content input {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border-radius: 4px;
  border: 1px solid var(--primary-gold);
  background: #1f1f1f;
  color: #fff;
}

/* Floating Welcome Component */
.welcome-container {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px 0;
  background-color: #000;
}

.welcome-badge {
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid var(--primary-gold);
  border-radius: 30px;
  padding: 6px 20px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: var(--primary-gold);
}

.ladies-hands-svg {
  width: 24px;
  height: 24px;
}

/* Active Buyers Header Bar */
.announcement {
  background: #D4AF37;
  color: #000;
  text-align: center;
  padding: 8px;
  font-weight: bold;
  font-size: 0.9rem;
}

/* Fix Navbar Alignment */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background-color: #000;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: 10px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.menu-toggle {
  background: #1a1a1a;
  border: 1px solid var(--primary-gold);
  color: #fff;
  padding: 8px 14px;
  border-radius: 4px;
  cursor: pointer;
}

.menu-toggle:active {
  transform: scale(0.95);
}

.logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.site-logo {
  width: 50px;
  height: 50px;
}

.logo-text {
  font-size: 0.85rem;
  color: var(--primary-gold);
  letter-spacing: 1px;
  font-weight: bold;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-actions select, .interactive-btn {
  background: #1a1a1a;
  color: #fff;
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.interactive-btn:active {
  transform: scale(0.94);
}

.interactive-btn.active-wishlist .icon-svg {
  fill: #ff3366;
}

.icon-svg {
  width: 16px;
  height: 16px;
  fill: #fff;
}

/* Fix Search Input Overflow */
.search-bar-section {
  width: 100%;
  padding: 14px 20px;
  display: flex;
  justify-content: center;
  background: #050505;
  border-bottom: 1px solid var(--border-color);
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 600px;
}

.search-icon-svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  fill: var(--primary-gold);
}

.search-input-wrapper input {
  width: 100%;
  padding: 10px 16px 10px 42px;
  border-radius: 25px;
  border: 1px solid var(--primary-gold);
  background: #151515;
  color: #fff;
  outline: none;
  font-size: 0.9rem;
}

/* Fix Drawer Overlay */
.sidebar {
  position: fixed;
  top: 0;
  left: -320px;
  width: 300px;
  height: 100%;
  background-color: #111;
  border-right: 1px solid var(--primary-gold);
  z-index: 10000;
  transition: 0.3s ease;
  padding: 20px;
}

.sidebar.active {
  left: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

.close-sidebar {
  font-size: 1.6rem;
  cursor: pointer;
  color: var(--primary-gold);
}

.user-profile-card {
  margin: 15px 0;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 6px;
}

.option-btn-border {
  border: 1px double var(--primary-gold);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: rgba(212, 175, 55, 0.05);
}

.mudra-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.sidebar-menu {
  list-style: none;
}

.menu-option-btn {
  padding: 10px;
  margin: 6px 0;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  background: #1a1a1a;
  transition: 0.2s;
}

.menu-option-btn:hover {
  border-color: var(--primary-gold);
  color: var(--primary-gold);
}

.menu-option-btn:active {
  transform: scale(0.96);
}

/* Categories & Product Cards Grid */
.categories {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0 10px;
}

.cat-btn {
  background: #1e1e1e;
  color: #fff;
  border: 1px solid var(--border-color);
  padding: 6px 18px;
  cursor: pointer;
  border-radius: 4px;
}

.cat-btn:hover {
  border-color: var(--primary-gold);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.product-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s, border-color 0.2s;
}

.product-card:active {
  transform: scale(0.97);
}

.product-card:hover {
  border-color: var(--primary-gold);
}

.card-wishlist-icon {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  background: rgba(0,0,0,0.6);
  padding: 6px;
  border-radius: 50%;
}

.img-container {
  height: 220px;
  width: 100%;
  overflow: hidden;
  border-radius: 6px;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mudra-tag {
  font-size: 0.8rem;
  color: #888;
  margin: 6px 0;
}

.price {
  color: var(--primary-gold);
  font-size: 1.2rem;
  margin: 6px 0;
}

.btn-gold-action {
  background: var(--primary-gold);
  border: none;
  color: #000;
  padding: 10px 16px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  margin: 4px;
  transition: 0.2s ease;
}

.btn-gold-action:active {
  transform: scale(0.93);
}

/* Modals */
.modal {
  display: none;
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.9);
  justify-content: center;
  align-items: center;
  z-index: 99999;
}

.modal-content {
  background: #181818;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  position: relative;
  border: 1px solid var(--primary-gold);
}

.img-modal-content {
  max-width: 700px;
  text-align: center;
}

.zoom-image-wrapper {
  max-height: 60vh;
  overflow: hidden;
  margin-bottom: 12px;
}

.zoom-image-wrapper img {
  width: 100%;
  max-height: 60vh;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.zoom-image-wrapper img:hover {
  transform: scale(1.35);
}

.close {
  position: absolute;
  top: 12px;
  right: 18px;
  font-size: 26px;
  cursor: pointer;
  color: var(--primary-gold);
}

.stylish-tick-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-gold);
  color: #000;
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 15px auto;
  font-weight: bold;
}

/* Admin Panel */
.admin-panel {
  display: none;
  position: fixed;
  right: 0; top: 0; width: 320px; height: 100%;
  background: #111;
  border-left: 1px solid var(--primary-gold);
  padding: 20px;
  z-index: 10000;
  overflow-y: auto;
}

.admin-panel input {
  width: 100%;
  margin: 6px 0;
  padding: 8px;
  background: #222;
  border: 1px solid #444;
  color: #fff;
}

.developer-log-box {
  background: #000;
  border: 1px solid #333;
  padding: 8px;
  font-family: monospace;
  font-size: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  color: #00ff66;
}

/* Footer & Ticker */
.royal-footer {
  margin-top: 40px;
  padding: 20px 0 50px 0;
  background: #000;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.ticker-wrap {
  width: 100%;
  overflow: hidden;
  background: rgba(212, 175, 55, 0.1);
  border-top: 1px solid var(--primary-gold);
  border-bottom: 1px solid var(--primary-gold);
  padding: 8px 0;
  margin-bottom: 30px;
}

.ticker {
  display: inline-block;
  white-space: nowrap;
  animation: tickerLoop 20s linear infinite;
  color: var(--primary-gold);
  font-size: 0.85rem;
}

@keyframes tickerLoop {
  0% { transform: translate3d(100%, 0, 0); }
  100% { transform: translate3d(-100%, 0, 0); }
}

.bottom-welcome h2 {
  font-size: 3rem;
  letter-spacing: 10px;
  color: rgba(212, 175, 55, 0.2);
  padding-bottom: 10px;
    }

Ye hai mera css and javascript code  mai html deta hu
