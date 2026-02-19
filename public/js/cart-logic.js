let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// Initialize cart page
function initCart() {
    renderCart();
    setupEventListeners();
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
        <h2 style="margin-bottom: 2rem;">Your Items</h2>
        ${cart.map(item => `
            <div class="cart-item" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" loading="lazy">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-category">${item.category}</p>
                    <p class="cart-item-price">$${item.price}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls-cart">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})" ${item.quantity === 1 ? 'disabled' : ''}>−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <p class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</p>
                    <button class="remove-btn" onclick="removeItem(${item.id})" aria-label="Remove item">
                        ✕
                    </button>
                </div>
            </div>
        `).join('')}
    `;

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 75 ? 0 : 8.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    // Render summary
    cartSummary.innerHTML = `
        <h2 style="margin-bottom: 2rem;">Order Summary</h2>
        <div class="summary-row">
            <span>Subtotal</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span>
        </div>
        ${subtotal < 75 && subtotal > 0 ? `
            <div class="free-shipping-notice">
                Add $${(75 - subtotal).toFixed(2)} more for free shipping!
            </div>
        ` : ''}
        <div class="summary-row">
            <span>Tax (8%)</span>
            <span>$${tax.toFixed(2)}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row summary-total">
            <span>Total</span>
            <span>$${total.toFixed(2)}</span>
        </div>
        <button class="btn btn-primary btn-full" onclick="proceedToCheckout()">
            Proceed to Checkout
        </button>
        <a href="shop.html" class="continue-shopping">Continue Shopping</a>
    `;
}

// Update quantity
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;

    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
    }
}

// Remove item
function removeItem(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
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
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    window.location.href = '/checkout';
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