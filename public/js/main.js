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

// Add to cart function
export function addToCart(productId, quantity = 1) {
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
    updateCartCount();
    showNotification('Added to cart!', 'success');
    return true;
}

// Add to wishlist function
export function addToWishlist(productId) {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return false;

    if (!wishlist.find(item => item.id === product.id)) {
        wishlist.push(product);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        showNotification('Added to favorites!', 'success');
        return true;
    } else {
        showNotification('Already in favorites', 'info');
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

// Hero Carousel Logic - Enhanced 3D Rotation
function initHeroCarousel() {
    const queue = document.getElementById('heroQueue');
    if (!queue) return;

    const featured = getFeaturedProducts().slice(0, 5);
    let currentIndex = 0;

    function renderCarousel() {
        queue.innerHTML = '';
        featured.forEach((product, index) => {
            const item = document.createElement('div');
            item.className = 'queue-item';

            const relativeIndex = (index - currentIndex + featured.length) % featured.length;

            if (relativeIndex === 0) {
                item.classList.add('focus');
            } else if (relativeIndex === 1) {
                item.classList.add('back-right');
            } else if (relativeIndex === featured.length - 1) {
                item.classList.add('back-left');
            } else {
                item.classList.add('hidden');
            }

            item.innerHTML = `<img src="${product.image}" alt="${product.name}" loading="lazy">`;
            item.addEventListener('click', () => {
                if (item.classList.contains('focus')) {
                    window.location.href = `/product?id=${product.id}`;
                }
            });

            queue.appendChild(item);
        });
    }

    function rotate() {
        currentIndex = (currentIndex + 1) % featured.length;
        renderCarousel();
    }

    renderCarousel();
    const interval = setInterval(rotate, 4500);

    // Pause on hover
    queue.addEventListener('mouseenter', () => clearInterval(interval));
    queue.addEventListener('mouseleave', () => {
        clearInterval(interval);
        setInterval(rotate, 4500);
    });
}

// Featured Products Grid
function initFeaturedProducts() {
    const grid = document.getElementById('featuredProducts');
    if (!grid) return;

    const featured = getFeaturedProducts().slice(0, 8);

    grid.innerHTML = featured.map((product, index) => `
        <div class="product-card reveal" style="animation-delay: ${index * 0.1}s" data-product-id="${product.id}">
            <div class="card-img">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info-minimal">
                <span class="category-tag">${product.category}</span>
                <h3>${product.name}</h3>
                <p class="price">$${product.price}</p>
            </div>
        </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const productId = card.dataset.productId;
            window.location.href = `/product?id=${productId}`;
        });
    });
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
    initHeroCarousel();
    initFeaturedProducts();
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