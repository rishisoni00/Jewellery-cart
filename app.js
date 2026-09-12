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
  tray: [],
  orders: []
};

let developerLogs = [];
let startTime = Date.now();
let activeInspectedProduct = null;
let inspectionStartTime = null;
let pendingBookingProduct = null;

function handleSignup(event) {
  event.preventDefault();
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
  
    document.getElementById('mainApp').style.display = 'block';
    updateUserUI();
    displayProducts(products);
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
  document.getElementById('tray-count').innerText = currentUser.tray.length;
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
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"[...]
          </svg>
        </div>
        <div class="img-container">
          <img src="${p.img}" class="product-img" alt="${p.name}">
        </div>
        <h3>${p.name}</h3>
        <p class="mudra-tag">Reward: ${p.mudraReward} Mudra Gold</p>
        <p class="price">₹${p.price.toLocaleString()}</p>
        <button class="btn-gold-action" onclick="event.stopPropagation(); initiateBooking(${p.id})">Book Now</button>
        <button class="btn-gold-action" style="background:#444; color:#fff" onclick="event.stopPropagation(); addToCart(${p.id})">tray</button>
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
  currentUser.tray.push(id);
  updateUserUI();
  alert("Item added to tray!");
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

// Payment Section Functions
function openPaymentSection() {
  document.getElementById('paymentSectionModal').style.display = 'flex';
  displayPaymentProducts();
}

function closePaymentSection() {
  document.getElementById('paymentSectionModal').style.display = 'none';
}

function displayPaymentProducts() {
  const container = document.getElementById('paymentProducts');
  container.innerHTML = '';
  products.forEach(p => {
    container.innerHTML += `
      <div style="background:#1a1a1a; padding:10px; margin:5px 0; border-radius:3px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <p style="color:#D4AF37; font-weight:bold;">${p.name}</p>
          <p style="color:#999; font-size:0.9em;">₹${p.price.toLocaleString()}</p>
        </div>
        <button class="btn-gold-action" style="padding:5px 10px; font-size:0.9em;" onclick="addProductToPayment(${p.id})">Add</button>
      </div>
    `;
  });
}

function addProductToPayment(id) {
  const product = products.find(p => p.id === id);
  if (!currentUser.cart) currentUser.cart = [];
  currentUser.cart.push(product);
  updatePaymentUI();
}

function updatePaymentUI() {
  const selectedList = document.getElementById('selectedItemsList');
  const totalAmount = document.getElementById('totalPaymentAmount');
  
  if (currentUser.cart.length === 0) {
    selectedList.innerHTML = '<p style="color:#999;">No items selected</p>';
    totalAmount.innerText = '₹0';
  } else {
    let total = 0;
    selectedList.innerHTML = currentUser.cart.map((item, index) => {
      total += item.price;
      return `
        <div style="display:flex; justify-content:space-between; color:#ccc; font-size:0.9em; margin-bottom:5px;">
          <span>${item.name}</span>
          <span>₹${item.price.toLocaleString()}</span>
        </div>
      `;
    }).join('');
    totalAmount.innerText = '₹' + total.toLocaleString();
  }
}

function proceedToRazorpay() {
  if (currentUser.cart.length === 0) {
    alert('Please select products first');
    return;
  }
  
  const totalAmount = currentUser.cart.reduce((sum, item) => sum + item.price, 0);
  
  const options = {
    key: "rzp_test_1DP5ibUg0xrxPF", // Replace with your actual Razorpay Key ID
    amount: totalAmount * 100, // Convert to paise
    currency: "INR",
    name: "Maa Ambe Jewellers",
    description: "Jewelry Purchase",
    customer_id: currentUser.memberId,
    prefill: {
      name: currentUser.name,
      contact: currentUser.contact
    },
    theme: { 
      color: "#D4AF37" 
    },
    handler: function(response) {
      alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
      logDeveloperEvent(`PAYMENT SUCCESS: ${response.razorpay_payment_id} | Amount: ₹${totalAmount}`);
      currentUser.cart = [];
      updatePaymentUI();
      closePaymentSection();
    },
    modal: {
      ondismiss: function() {
        logDeveloperEvent(`PAYMENT CANCELLED by user`);
      }
    }
  };
  
  const rzp = new Razorpay(options);
  rzp.open();
}

function openWishlistModal() {
  if (currentUser.wishlist.length === 0) {
    alert('Your wishlist is empty');
    return;
  }
  const wishlistProducts = products.filter(p => currentUser.wishlist.includes(p.id));
  alert('Wishlist Items:\n' + wishlistProducts.map(p => `${p.name} - ₹${p.price.toLocaleString()}`).join('\n'));
}

function opentrayModal() {
  if (currentUser.tray.length === 0) {
    alert('Your tray is empty');
    return;
  }
  const trayProducts = currentUser.tray.map(id => products.find(p => p.id === id));
  alert('Tray Items:\n' + trayProducts.map(p => `${p.name} - ₹${p.price.toLocaleString()}`).join('\n'));
}

setInterval(() => {
  const liveUsers = Math.floor(Math.random() * (160 - 110 + 1)) + 110;
  const liveUsersElement = document.getElementById('live-users');
  if (liveUsersElement) {
    liveUsersElement.innerText = liveUsers;
  }
}, 3000);

// No signup logic - clean file
console.log('jewellery Collection Loaded');
