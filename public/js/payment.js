import PAYSTACK_CONFIG from './paystack-config.js';

// Checkout & Payment Logic
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function initCheckout() {
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    renderOrderSummary();
    setupEventListeners();
}

function renderOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    if (!orderSummary) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 75 ? 0 : 8.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    orderSummary.innerHTML = `
        <h2 style="margin-bottom: 2rem;">Order Summary</h2>
        
        <div class="checkout-items-preview" style="margin-bottom: 2rem; max-height: 300px; overflow-y: auto; padding-right: 0.5rem;">
            ${cart.map(item => `
                <div class="checkout-summary-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="checkout-summary-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.quantity} × $${item.price}</p>
                    </div>
                    <span style="font-weight: 600; color: var(--color-coffee);">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>

        <div class="summary-row">
            <span>Subtotal</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Estimated Tax</span>
            <span>$${tax.toFixed(2)}</span>
        </div>
        
        <div class="summary-divider"></div>
        
        <div class="summary-row summary-total">
            <span>Total</span>
            <span>$${total.toFixed(2)}</span>
        </div>

        <button type="submit" form="checkoutForm" class="btn btn-primary btn-full" id="placeOrderBtn">
            Complete Purchase
        </button>
        
        <p style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
            Secure Checkout Guaranteed
        </p>
    `;
}

function setupEventListeners() {
    const form = document.getElementById('checkoutForm');
    form?.addEventListener('submit', function (e) {
        e.preventDefault();

        const btn = document.getElementById('placeOrderBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<div class="loading"></div> Processing...';

        const formData = new FormData(form);
        const paymentMethod = formData.get('payment');
        const email = formData.get('email');

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 75 ? 0 : 8.99;
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;

        if (paymentMethod === 'paystack') {
            payWithPaystack(email, total, btn, originalText);
        } else {
            handleCOD(btn, originalText);
        }
    });
}

function payWithPaystack(email, amount, btn, originalText) {
    const handler = PaystackPop.setup({
        key: PAYSTACK_CONFIG.publicKey,
        email: email,
        amount: Math.round(amount * 100 * 12.5), // Example conversion to Kobo/Pesewas (assuming GHS for now as per architecture)
        currency: 'GHS',
        callback: function (response) {
            showNotification('Payment successful! Ritual complete.', 'success');
            clearCartAndRedirect();
        },
        onClose: function () {
            btn.disabled = false;
            btn.innerHTML = originalText;
            showNotification('Transaction cancelled', 'info');
        }
    });
    handler.openIframe();
}

function handleCOD(btn, originalText) {
    // Simulate API call
    setTimeout(() => {
        showNotification('Order placed! Prepare for your delivery.', 'success');
        clearCartAndRedirect();
    }, 1500);
}

function clearCartAndRedirect() {
    localStorage.removeItem('cart');
    setTimeout(() => {
        window.location.href = '/dashboard';
    }, 2000);
}

function showNotification(message, type = 'info') {
    // Check if notification function exists globally (from other scripts), if not use local one
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
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
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', initCheckout);
