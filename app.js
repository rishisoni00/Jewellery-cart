// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://enjdvhldvejmcvkxeqhz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuamR2aGxkdmVqbWN2a3hlcWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTE0NjUsImV4cCI6MjEwMzY2NzQ2NX0.q14CWfBas4OF5opauxveUBocjCty4wNVrxILohBt5d8';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Products Catalog Data
let products = [
  { id: 1, name: "Royal Diamond Solitaire", category: "women", price: 125000, mudraReward: 50, img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500" },
  { id: 2, name: "Men's Solid Gold Kada", category: "men", price: 85000, mudraReward: 30, img: "https://images.unsplash.com/photo-1611591475155-4282fc289e74?w=500" },
  { id: 3, name: "Emerald Cut Platinum Ring", category: "women", price: 210000, mudraReward: 80, img: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=500" }
];

let currentUser = {
  isProfileCreated: false,
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

// Page Load Initializer
document.addEventListener('DOMContentLoaded', () => {
  displayProducts(products);
  updateUserUI();
});

// ==========================================
// PROFILE / AUTHENTICATION LOGIC
// ==========================================

function openAuthModal() {
  document.getElementById('authModal').style.display = 'flex';
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
}

function handleSignup(event) {
  if (event) event.preventDefault();
  
  const nameInput = document.getElementById('userNameInput');
  const contactInput = document.getElementById('userContactInput');

  const name = nameInput ? nameInput.value.trim() : "";
  const contact = contactInput ? contactInput.value.trim() : "";

  if (!name || !contact) {
    alert("Kripya Naam aur Contact Number dono bharein.");
    return;
  }

  // Save Local User Profile
  currentUser.isProfileCreated = true;
  currentUser.name = name;
  currentUser.contact = contact;
  currentUser.memberId = 'AUR-' + Math.floor(100000 + Math.random() * 900000);

  closeAuthModal();
  updateUserUI();
  alert(`Welcome, ${currentUser.name}! Aapka profile safaltapoorvak ban gaya hai.`);
  logDeveloperEvent(`PROFILE CREATED: ${currentUser.memberId} | ${currentUser.name}`);
}

function handleLogout() {
  currentUser.isProfileCreated = false;
  currentUser.name = "";
  currentUser.contact = "";
  currentUser.memberId = "";
  currentUser.wishlist = [];
  currentUser.cart = [];
  currentUser.orders = [];

  updateUserUI();
  toggleSidebar();
  alert("Aap logout ho chuke hain.");
}

// ==========================================
// USER INTERFACE & CATALOG
// ==========================================

function updateUserUI() {
  const isCreated = currentUser.isProfileCreated;

  // Sidebar Controls Toggle
  document.getElementById('guestSection').style.display = isCreated ? 'none' : 'block';
  document.getElementById('userSection').style.display = isCreated ? 'block' : 'none';

  // Display Text Updates
  document.getElementById('sidebar-user-name').innerText = isCreated ? currentUser.name : "Guest";
  document.getElementById('user-member-id').innerText = isCreated ? currentUser.memberId : "Not Registered";

  if (isCreated) {
    const elements = {
      'profile-id': currentUser.memberId,
      'profile-name': currentUser.name,
      'profile-contact': currentUser.contact,
      'profile-mudra': `${currentUser.mudraGold} Gold`
    };

    for (let key in elements) {
      const el = document.getElementById(key);
      if (el) el.innerText = elements[key];
    }
  }

  document.getElementById('wishlist-count').innerText = currentUser.wishlist.length;
  document.getElementById('cart-count').innerText = currentUser.cart.length;
}

function displayProducts(items) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  
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

function initiateBooking(id) {
  // Check if profile is created before booking
  if (!currentUser.isProfileCreated) {
    alert("Booking ke liye pehle Profile create karein (Sidebar -> Create Profile).");
    openAuthModal();
    return;
  }

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

  const generatedOrderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

  currentUser.orders.push({
    orderId: generatedOrderId,
    productName: pendingBookingProduct.name,
    price: pendingBookingProduct.price,
    status: 'Pending Confirmation'
  });

  updateUserUI();
  document.getElementById('checkoutStep1').style.display = 'none';
  document.getElementById('checkoutStep2').style.display = 'block';

  logDeveloperEvent(`BOOKING: User ${currentUser.memberId} requested ${pendingBookingProduct.name}`);
}

function closeCheckoutModal() {
  document.getElementById('bookingCheckoutModal').style.display = 'none';
}

function startInspectingProduct(id) {
  if (activeInspectedProduct !== null) recordTimeSpent(activeInspectedProduct);
  activeInspectedProduct = id;
  inspectionStartTime = Date.now();
}

function recordTimeSpent(id) {
  if (inspectionStartTime) {
    const elapsed = Math.round((Date.now() - inspectionStartTime) / 1000);
    logDeveloperEvent(`ANALYTICS: Product ${id} viewed for ${elapsed}s`);
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
  alert("Item cart me add ho gaya hai!");
}

function logDeveloperEvent(msg) {
  const time = new Date().toLocaleTimeString();
  developerLogs.unshift(`[${time}] ${msg}`);
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
  if (!container) return;

  if (currentUser.orders.length === 0) {
    container.innerHTML = "<p style='color:#ccc;'>Koi order nahi mila.</p>";
  } else {
    container.innerHTML = currentUser.orders.map(o => `
      <div style="background:#222; padding:12px; margin:8px 0; border-radius:6px; display:flex; justify-content:space-between; align-items:center; border:1px solid #333;">
        <div>
          <p style="margin:2px 0;"><strong>Order ID:</strong> ${o.orderId}</p>
          <p style="margin:2px 0;"><strong>Item:</strong> ${o.productName}</p>
          <p style="margin:2px 0;"><strong>Price:</strong> ₹${o.price.toLocaleString()}</p>
          <p style="margin:2px 0;"><strong>Status:</strong> <span style="color:#D4AF37;">${o.status}</span></p>
        </div>
        ${o.status !== 'Cancelled' ? `
          <button class="btn-gold-action" style="background:#ff4d4d; color:#fff; padding:6px 12px; font-size:0.8rem; margin-left:10px; border:none; cursor:pointer;" onclick="cancelOrder('${o.orderId}')">Cancel</button>
        ` : `<span style="color:#888; font-size:0.85rem;">Cancelled</span>`}
      </div>
    `).join('');
  }
  document.getElementById('myOrdersModal').style.display = 'flex';
}

function closeOrdersModal() {
  document.getElementById('myOrdersModal').style.display = 'none';
}

function cancelOrder(orderId) {
  if (!confirm("Kya aap sach me ye order cancel karna chahte hain?")) return;

  currentUser.orders = currentUser.orders.filter(o => o.orderId !== orderId);
  showMyOrdersModal();
  alert("Order cancel ho gaya hai.");
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

console.log('Maa Ambe Jewellers Store Ready!');
                                                                   
