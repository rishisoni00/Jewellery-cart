// Supabase Client Config
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Existing Static Data Array preserved
const products = [
    { id: 1, name: "Gold Coins Offer", price: 500, mudraReward: 50 },
    { id: 2, name: "Silver Savings Pack", price: 1000, mudraReward: 100 }
];

let currentUser = {
    memberId: null,
    name: '',
    contact: '',
    mudraGold: 0,
    wishlist: [],
    cart: [],
    orders: []
};

let pendingBookingProduct = null;

// Auth Sync with Supabase Session
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        const user = session.user;
        
        let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) {
            const { data } = await supabase.from('profiles').insert([
                { id: user.id, name: "User", contact: user.phone || user.email, mudra_gold: 0 }
            ]).select().single();
            profile = data;
        }

        currentUser.memberId = user.id;
        currentUser.name = profile.name || "User";
        currentUser.contact = profile.contact;
        currentUser.mudraGold = profile.mudra_gold || 0;

        await syncUserDataFromSupabase(user.id);
        
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        updateUserUI();
        displayProducts(products);
    } else {
        document.getElementById('authModal').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }
});

// OTP Sign In Logic
async function handleSignup(event) {
    event.preventDefault();
    const contact = document.getElementById('userContactInput').value;

    const { error } = await supabase.auth.signInWithOtp({ phone: contact });

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("OTP sent to " + contact);
    }
}

// Fetch Cart, Wishlist, Orders directly from Database
async function syncUserDataFromSupabase(userId) {
    const { data: wishlistData } = await supabase.from('wishlist').select('product_id').eq('user_id', userId);
    currentUser.wishlist = wishlistData ? wishlistData.map(w => w.product_id) : [];

    const { data: cartData } = await supabase.from('cart').select('product_id').eq('user_id', userId);
    currentUser.cart = cartData ? cartData.map(c => c.product_id) : [];

    const { data: orderData } = await supabase.from('orders').select('*').eq('user_id', userId);
    currentUser.orders = orderData || [];
}

function updateUserUI() {
    document.getElementById('displayUserName').innerText = currentUser.name;
    document.getElementById('displayMudraGold').innerText = currentUser.mudraGold;
}

function displayProducts(items) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    items.forEach(product => {
        const isWishlisted = currentUser.wishlist.includes(product.id);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <h4>${product.name}</h4>
            <p>Price: ₹${product.price}</p>
            <p>Reward: ${product.mudraReward} Mudra Gold</p>
            <button onclick="openBooking(${product.id})" class="btn-primary">Book Now</button>
            <button onclick="toggleWishlist(${product.id})" class="btn-secondary">
                ${isWishlisted ? '❤️ Saved' : '🤍 Wishlist'}
            </button>
        `;
        grid.appendChild(card);
    });
}

// Wishlist Logic via Supabase
async function toggleWishlist(id) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const index = currentUser.wishlist.indexOf(id);
    if (index === -1) {
        currentUser.wishlist.push(id);
        await supabase.from('wishlist').insert([{ user_id: session.user.id, product_id: id }]);
    } else {
        currentUser.wishlist.splice(index, 1);
        await supabase.from('wishlist').delete().eq('user_id', session.user.id).eq('product_id', id);
    }
    displayProducts(products);
}

function openBooking(productId) {
    pendingBookingProduct = products.find(p => p.id === productId);
    document.getElementById('bookingProductName').innerText = pendingBookingProduct.name;
    document.getElementById('bookingProductPrice').innerText = "Amount: ₹" + pendingBookingProduct.price;
    document.getElementById('checkoutStep1').style.display = 'block';
    document.getElementById('checkoutStep2').style.display = 'none';
    document.getElementById('checkoutModal').style.display = 'flex';
}

// Booking Execution Logic via Supabase
async function executeSureBooking() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const reward = pendingBookingProduct.mudraReward;
    const newMudraBalance = currentUser.mudraGold + reward;

    await supabase
        .from('profiles')
        .update({ mudra_gold: newMudraBalance })
        .eq('id', session.user.id);

    currentUser.mudraGold = newMudraBalance;

    const { data: order } = await supabase.from('orders').insert([{
        user_id: session.user.id,
        product_name: pendingBookingProduct.name,
        price: pendingBookingProduct.price,
        status: 'Pending'
    }]).select().single();

    if (order) currentUser.orders.push(order);

    updateUserUI();
    document.getElementById('checkoutStep1').style.display = 'none';
    document.getElementById('checkoutStep2').style.display = 'block';
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

async function handleLogout() {
    await supabase.auth.signOut();
    location.reload();
}
