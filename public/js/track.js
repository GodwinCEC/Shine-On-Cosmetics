import { auth } from './firebase-config.js';
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

const functions = getFunctions();
const trackOrder = httpsCallable(functions, 'trackOrder');

// Track function
async function performTrack(orderNumber, email) {
    const btn = document.getElementById('trackBtn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<div class="loading"></div> Finding...';

    try {
        const result = await trackOrder({ orderNumber, email });
        const order = result.data;
        displayResult(order);
    } catch (error) {
        console.error("Tracking error:", error);
        alert(error.message || "Order not found. Please check your details.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Find My Order';
    }
}

// Auto-track on load if params exist
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const orderNum = params.get('order');
    const email = params.get('email');

    if (orderNum && email) {
        document.getElementById('orderNumber').value = orderNum;
        document.getElementById('email').value = email;
        performTrack(orderNum, email);
    }
});

document.getElementById('trackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderNumber = document.getElementById('orderNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    performTrack(orderNumber, email);
});

function displayResult(order) {
    const trackForm = document.getElementById('trackForm');
    const trackResult = document.getElementById('trackResult');
    
    if (trackForm) trackForm.classList.add('hidden');
    if (trackResult) trackResult.classList.remove('hidden');
    
    const badge = document.getElementById('statusBadge');
    if (badge) {
        badge.textContent = order.status;
        badge.className = `status-badge status-${order.status.toLowerCase()}`;
    }
    
    const icons = {
        pending: '📦',
        confirmed: '✅',
        shipped: '🚚',
        delivered: '🎁',
        cancelled: '❌'
    };
    
    const statusIcon = document.getElementById('statusIcon');
    if (statusIcon) statusIcon.textContent = icons[order.status.toLowerCase()] || '📦';
    
    const statusMsg = document.getElementById('statusMessage');
    if (statusMsg) statusMsg.textContent = `Order ${order.status}`;
    
    const loc = document.getElementById('displayLocation');
    if (loc && order.address) {
        if (order.address.hostel && order.address.hostel !== 'Other') {
            loc.textContent = `${order.address.hostel}${order.address.location ? ', ' + order.address.location : ''}`;
        } else {
            loc.textContent = `${order.address.city || ''}, ${order.address.street || ''}${order.address.location ? ' (' + order.address.location + ')' : ''}`;
        }
    }
    
    const tot = document.getElementById('displayTotal');
    if (tot) tot.textContent = `GH₵${order.totalAmount.toFixed(2)}`;
    
    const itemsContainer = document.getElementById('orderItems');
    if (itemsContainer) {
        itemsContainer.innerHTML = order.items.map(item => `
            <div class="order-item-mini">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=100'">
                <div style="flex: 1">
                    <h4 style="font-size: 0.9rem">${item.name}</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted)">Qty: ${item.quantity}</p>
                </div>
                <span style="font-weight: 600">GH₵${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
    }
}

