import { products, getFeaturedProducts } from './products-data.js';

// Initialize cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

// Update cart count in navbar
export function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Array updates for Firebase
async function syncUserArrayToFirestore(type, itemOrList) {
    const userStr = localStorage.getItem('user');
    if (!userStr) return; // Only sync if logged in

    try {
        const user = JSON.parse(userStr);
        const { db } = await import('./firebase-config.js');
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        const userRef = doc(db, 'users', user.uid);

        // Optimistically sync whatever is in local storage directly to the array
        const listStr = localStorage.getItem(type) || '[]';
        const listItems = JSON.parse(listStr);

        const updateObj = {};
        if (type === 'wishlist') {
            updateObj.favorites = listItems.map(p => p.id);
        } else {
            updateObj.cart = listItems;
        }

        await setDoc(userRef, updateObj, { merge: true });
    } catch (err) {
        console.error("Error syncing to Firestore:", err);
    }
}

// Add to cart function
export async function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return false;

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...product,
            quantity: quantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    await syncUserArrayToFirestore('cart');
    updateCartCount();
    showNotification('Added to cart!', 'success');
    return true;
}

// Add to wishlist function
export async function addToWishlist(productId) {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return false;

    if (!wishlist.find(item => item.id === product.id)) {
        wishlist.push(product);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        await syncUserArrayToFirestore('wishlist');
        showNotification('Added to wishlist!', 'success');
        return true;
    } else {
        showNotification('Already in wishlist', 'info');
        return false;
    }
}

// Show notification
export function showNotification(message, type = 'info') {
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
        animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        max-width: 300px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Scroll Reveal Animation
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Hero Carousel removed - static background used instead

// Helper to initialize custom horizontal sliders with dots
function initSlider(sliderId, indicatorsId) {
    const slider = document.getElementById(sliderId);
    const indicatorsContainer = document.getElementById(indicatorsId);
    if (!slider || !indicatorsContainer) return;

    const items = slider.children;
    if (items.length === 0) return;

    // Create dots
    indicatorsContainer.innerHTML = Array.from(items).map((_, i) => `
        <div class="indicator-dot-premium ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
    `).join('');

    const dots = indicatorsContainer.querySelectorAll('.indicator-dot-premium');

    // Update active dot on scroll
    const scrollHint = slider.parentElement ? slider.parentElement.querySelector('.scroll-hint') : null;

    slider.addEventListener('scroll', () => {
        const index = Math.round(slider.scrollLeft / slider.offsetWidth);
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));

        // Hide hint once user scrolls
        if (scrollHint && slider.scrollLeft > 30) {
            scrollHint.style.opacity = '0';
            scrollHint.style.pointerEvents = 'none';
        }
    }, { passive: true });

    // Click dot to scroll
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.dataset.index);
            slider.scrollTo({
                left: slider.offsetWidth * index,
                behavior: 'smooth'
            });
        });
    });
}

// Featured Products Grid
function initFeaturedProducts() {
    const grid = document.getElementById('featuredProducts');
    if (!grid) return;

    const featured = getFeaturedProducts().slice(0, 3);

    grid.innerHTML = featured.map((product, index) => `
        <div class="product-card reveal" style="transition-delay: ${index * 0.1}s" data-product-id="${product.id}">
            <div class="card-img">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.stock === 0 ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
            </div>
            <div class="product-info-minimal">
                <span class="category-tag">${product.category}</span>
                <h3>${product.name}</h3>
                <div class="price-row">
                    <p class="price">GH₵${product.price}</p>
                    <span class="view-btn">View Detail <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        </div>
    `).join('');

    // Re-initialize Scroll Reveal for the new elements
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Handle clicks (no drag needed as we use native scroll snap)
    grid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const productId = card.dataset.productId;
            window.location.href = `product.html?id=${productId}`;
        });
    });

    // Init custom slider logic for dots
    initSlider('featuredProducts', 'featuredIndicators');
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Newsletter form handler
function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;

            // Simulate API call
            setTimeout(() => {
                showNotification('Welcome to the Shine On family! ✨', 'success');
                form.reset();
            }, 500);
        });
    }
}

// Initialize everything on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initScrollReveal();
    initFeaturedProducts();
    initSlider('testimonialsSlider', 'testimonialsIndicators');
    initSmoothScroll();
    initNewsletter();
});

// Make functions globally available
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.updateCartCount = updateCartCount;

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);