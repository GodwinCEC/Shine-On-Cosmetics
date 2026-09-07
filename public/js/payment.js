import PAYSTACK_CONFIG from './paystack-config.js';
import { auth, db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Checkout & Payment Logic
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
window.acceptingOrders = true;
let currentUser = null;

async function initCheckout() {
    // Check Auth
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'auth.html?redirect=checkout.html';
            return;
        }
        currentUser = user;
        // Autofill email if exists
        const emailInput = document.getElementById('email');
        if (emailInput && user.email) emailInput.value = user.email;
        const nameInput = document.getElementById('fullName');
        if (nameInput && user.displayName) nameInput.value = user.displayName;
    });

    try {
        const settingsDoc = await getDoc(doc(db, "app_settings", "global"));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.acceptingOrders === false) window.acceptingOrders = false;
        }
    } catch (e) {
        console.warn("Using default settings due to Firebase restriction:", e.message);
    }

    // Hydrate Cart Data
    await hydrateCartData();

    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    renderOrderSummary();
    setupEventListeners();
}

async function hydrateCartData() {
    let allProducts = [];
    
    try {
        const snapshot = await getDocs(collection(db, "products"));
        snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn("Falling back to local product data for checkout hydration:", e.message);
        try {
            const mod = await import('./products-data.js');
            allProducts = mod.products || [];
        } catch (err) {
            console.error("Critical: Could not load product data fallback");
        }
    }

    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = storedCart.map(storedItem => {
        const product = allProducts.find(p => p.id == storedItem.id);
        if (product) {
            return { 
                ...product, 
                quantity: storedItem.quantity || 1,
                price: product.price || 0 
            };
        }
        return { 
            ...storedItem, 
            name: storedItem.name || 'Unknown Product', 
            price: storedItem.price || 0,
            quantity: storedItem.quantity || 1,
            image: storedItem.image || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800'
        };
    });
}

function renderOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    if (!orderSummary) return;

    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const shipping = 0;
    const tax = 0;
    const total = subtotal + shipping + tax;

    orderSummary.innerHTML = `
        <h2 style="margin-bottom: 2rem;">Order Summary</h2>
        
        <div class="checkout-items-preview" style="margin-bottom: 2rem; max-height: 300px; overflow-y: auto; padding-right: 0.5rem;">
            ${cart.map(item => {
        const displayImg = (item.images && item.images.length > 0) ? item.images[0].thumbnail || item.images[0].full : item.image;
        return `
                <div class="checkout-summary-item">
                    <img src="${displayImg}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800'">
                    <div class="checkout-summary-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.quantity} × GH₵${(item.price || 0).toFixed(2)}</p>
                    </div>
                    <span style="font-weight: 600; color: var(--coffee);">GH₵${((item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
            `;
    }).join('')}
        </div>

        <div class="summary-row">
            <span>Subtotal</span>
            <span>GH₵${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Shipping</span>
            <span>FREE</span>
        </div>
        
        <div class="summary-divider"></div>
        
        <div class="summary-row summary-total">
            <span>Total</span>
            <span>GH₵${total.toFixed(2)}</span>
        </div>

        <button type="submit" form="checkoutForm" class="btn btn-primary btn-full" id="placeOrderBtn" style="${!window.acceptingOrders ? 'opacity:0.6; cursor:not-allowed;' : ''}">
            Complete Purchase
        </button>
        
        <p style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
            Secure Checkout Guaranteed
        </p>
    `;
}

function setupEventListeners() {
    const form = document.getElementById('checkoutForm');
    form?.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!window.acceptingOrders) {
            showNotification("We aren't currently accepting orders, but you can add items to your wishlist!", 'error');
            return;
        }

        if (!currentUser) {
            showNotification("Please sign in to place an order.", 'error');
            window.location.href = 'auth.html?redirect=checkout.html';
            return;
        }

        const btn = document.getElementById('placeOrderBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<div class="loading"></div> Processing...';

        const formData = new FormData(form);
        const email = formData.get('email');
        const fullName = formData.get('fullName');
        const phone = formData.get('phone');
        const locationSelect = document.getElementById('location-select');
        const locationValue = locationSelect.value;
        const address = formData.get('address'); // Room / House No
        
        let city = 'Kumasi'; // Default
        let hostel = '';
        let street = '';

        if (locationValue === 'other') {
            city = formData.get('city');
            street = formData.get('street');
            hostel = 'Other';
        } else {
            hostel = locationSelect.options[locationSelect.selectedIndex].text;
            // You can also extract campus from locationValue if needed
        }

        const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        const total = subtotal;

        // Generate Order Number
        const orderNumber = generateOrderNumber();

        try {
            // Create Order in Firestore
            const orderRef = await addDoc(collection(db, "orders"), {
                orderNumber: orderNumber,
                userId: currentUser.uid,
                customer: {
                    name: fullName,
                    email: email,
                    phone: phone
                },
                items: cart.map(item => ({
                    id: item.id || 'unknown',
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: (item.images && item.images.length > 0) ? item.images[0].thumbnail || item.images[0].full : (item.image || '')
                })),
                totalAmount: total,
                address: {
                    city: city,
                    hostel: hostel,
                    street: street,
                    location: address // This is the Room/House Number
                },
                payment: {
                    method: 'paystack',
                    status: 'pending'
                },
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            payWithPaystack(email, total, orderNumber, btn, originalText);
        } catch (error) {
            console.error("Order creation error:", error);
            showNotification("Could not create order. Please try again.", "error");
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

function generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SO-${dateStr}-${random}`;
}

function payWithPaystack(email, amount, orderNumber, btn, originalText) {
    const handler = PaystackPop.setup({
        key: PAYSTACK_CONFIG.publicKey,
        email: email,
        amount: Math.round(amount * 100), // Amount in pesewas
        currency: 'GHS',
        ref: orderNumber,
        callback: function (response) {
            showNotification('Payment successful! Order complete.', 'success');
            
            // Store order info for success page
            sessionStorage.setItem('lastOrder', JSON.stringify({
                orderNumber: orderNumber,
                totalAmount: amount,
                paymentStatus: 'paid'
            }));

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

async function clearCartAndRedirect() {
    localStorage.removeItem('cart');
    
    // Also clear Firestore cart for the user
    if (currentUser && db) {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, { cart: [] }, { merge: true });
            console.log("Firestore cart cleared");
        } catch (e) {
            console.error("Failed to clear Firestore cart:", e);
        }
    }

    setTimeout(() => {
        window.location.href = 'order-success.html';
    }, 1000);
}


function showNotification(message, type = 'info') {
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
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideInRight 0.5s forwards;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

function handleLocationChange() {
    const locationSelect = document.getElementById('location-select');
    const otherFields = document.getElementById('other-location-fields');
    const cityInput = document.getElementById('city');
    const streetInput = document.getElementById('street');
    const addressLabel = document.querySelector('label[for="address"]');

    if (locationSelect.value === 'other') {
        otherFields.style.display = 'grid';
        cityInput.required = true;
        streetInput.required = true;
        if (addressLabel) addressLabel.innerHTML = 'Room / House Number <span style="color: var(--color-error)">*</span>';
    } else {
        otherFields.style.display = 'none';
        cityInput.required = false;
        streetInput.required = false;
        if (addressLabel) addressLabel.innerHTML = 'Room Number <span style="color: var(--color-error)">*</span>';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
    document.getElementById('location-select')?.addEventListener('change', handleLocationChange);
});

