let cart = JSON.parse(localStorage.getItem('cart') || '[]');
window.acceptingOrders = true;

// Initialize cart page
async function initCart() {
    // 1. Handle Global Settings
    try {
        const { db } = await import('./firebase-config.js');
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const settingsDoc = await getDoc(doc(db, "app_settings", "global"));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.acceptingOrders === false) window.acceptingOrders = false;
        }
    } catch (e) {
        console.warn("Using default settings due to Firebase restriction:", e.message);
    }

    // 2. Hydrate Cart Data (Crucial for rendering price/name/img)
    await hydrateCartData();

    renderCart();
    setupEventListeners();
}

async function hydrateCartData() {
    let allProducts = [];
    
    // Try Firestore first
    try {
        const { db } = await import('./firebase-config.js');
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const snapshot = await getDocs(collection(db, "products"));
        snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn("Falling back to local product data for cart hydration:", e.message);
        try {
            const mod = await import('./products-data.js');
            allProducts = mod.products || [];
        } catch (err) {
            console.error("Critical: Could not load product data fallback");
        }
    }

    // Map cart IDs to full product objects
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = storedCart.map(storedItem => {
        const product = allProducts.find(p => p.id == storedItem.id);
        if (product) {
            return { ...product, quantity: storedItem.quantity };
        }
        // Fallback for unknown products (shouldn't happen often)
        return { 
            ...storedItem, 
            name: storedItem.name || 'Unknown Product', 
            price: storedItem.price || 0,
            image: storedItem.image || 'https://via.placeholder.com/150'
        };
    });
}

// Render cart items and summary
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    const cartLayout = document.getElementById('cartLayout');
    const emptyCart = document.getElementById('emptyCart');

    if (cart.length === 0) {
        cartLayout.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }

    cartLayout.style.display = 'grid';
    emptyCart.style.display = 'none';

    // Render cart items
    cartItems.innerHTML = `
        <div class="cart-items-header">
            <h2>Cart</h2>
            <span class="items-count">${cart.length} ${cart.length === 1 ? 'Product' : 'Products'}</span>
        </div>
        ${cart.map(item => {
        const displayImg = (item.images && item.images.length > 0) ? item.images[0].thumbnail || item.images[0].full : item.image;
        return `
            <div class="cart-item" data-item-id="${item.id}">
                <div class="cart-item-image-wrap">
                    <img src="${displayImg}" alt="${item.name}" class="cart-item-img" loading="lazy" 
                         onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800'">
                </div>

                <div class="cart-item-main">
                    <div class="cart-item-info">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <div class="cart-item-price-row">
                            <span class="cart-item-price">GH₵${(item.price || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="cart-item-configs">
                        <div class="cart-item-quantity">
                            <div class="quantity-controls-cart">
                                <button class="qty-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})" ${item.quantity === 1 ? 'disabled' : ''}>−</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn plus-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>

                            </div>
                        </div>
                        
                        <div class="cart-item-total-wrap">
                            <span class="config-label">Subtotal</span>
                            <p class="cart-item-total">GH₵${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                        </div>
                    </div>


                    <button class="remove-item-btn" onclick="removeItem('${item.id}')" aria-label="Remove item">
                        <i class="fas fa-trash-can"></i>
                    </button>
                </div>
            </div>
            `;
    }).join('')}
    `;


    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const shipping = 0;
    const tax = 0;
    const total = subtotal + shipping + tax;

    // Render summary
    cartSummary.innerHTML = `
        <h2 style="margin-bottom: 2rem;">Order Summary</h2>
        <div class="summary-row">
            <span>Subtotal</span>
            <span>GH₵${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Delivery</span>
            <span>FREE</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row summary-total">
            <span>Total</span>
            <span>GH₵${total.toFixed(2)}</span>
        </div>
        <button class="btn btn-primary btn-full" onclick="proceedToCheckout()" style="${!window.acceptingOrders ? 'opacity:0.6; cursor:not-allowed;' : ''}">
            Checkout
        </button>
        <a href="shop.html" class="continue-shopping">Continue Shopping</a>
    `;
}

// Array updates for Firebase
async function syncUserArrayToFirestore() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
        const user = JSON.parse(userStr);
        const { db } = await import('./firebase-config.js');
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const userRef = doc(db, 'users', user.uid);

        // Map hydrated cart back to thin IDs/quantities for sync
        const thinCart = cart.map(i => ({ id: i.id, quantity: i.quantity }));
        await setDoc(userRef, { cart: thinCart }, { merge: true });
    } catch (err) {
        console.warn("Sync Error (likely permissions):", err.message);
    }
}

// Update quantity
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;

    const item = cart.find(i => i.id == productId);
    if (item) {
        item.quantity = newQuantity;
        // Save only thin data to localStorage
        const thinCart = cart.map(i => ({ id: i.id, quantity: i.quantity }));
        localStorage.setItem('cart', JSON.stringify(thinCart));
        
        syncUserArrayToFirestore();
        renderCart();
        updateCartCount();
    }
}

// Remove item
function removeItem(productId) {
    cart = cart.filter(item => item.id != productId);
    // Save only thin data to localStorage
    const thinCart = cart.map(i => ({ id: i.id, quantity: i.quantity }));
    localStorage.setItem('cart', JSON.stringify(thinCart));
    
    syncUserArrayToFirestore();
    renderCart();
    updateCartCount();
    showNotification('Item removed from cart', 'info');
}

// Update cart count
function updateCartCount() {
    if (window.updateCartDisplay) {
        window.updateCartDisplay();
    }
}

// Proceed to checkout
function proceedToCheckout() {
    if (!window.acceptingOrders) {
        showNotification("We aren't currently accepting orders, but you can add items to your wishlist!", 'error');
        return;
    }

    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    const btn = document.querySelector('.btn-primary');
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Preparing Checkout ✓';
        btn.style.background = 'var(--color-sage)';
        btn.style.borderColor = 'var(--color-sage)';
        btn.style.pointerEvents = 'none';

        setTimeout(() => {
            window.location.href = 'checkout.html';
        }, 800);
    } else {
        window.location.href = 'checkout.html';
    }
}


// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#A8BF96' : type === 'error' ? '#C17A5C' : '#B8865F'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 100px;
        font-family: var(--font-heading);
        font-size: 0.9rem;
        font-weight: 600;
        box-shadow: var(--shadow-premium);
        z-index: 10000;
        animation: slideInRight 0.5s forwards;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s forwards';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Any additional listeners can be added here
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initCart);

// Make functions globally available
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.proceedToCheckout = proceedToCheckout;