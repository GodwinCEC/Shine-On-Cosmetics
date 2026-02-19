import { products } from './products-data.js';

let currentProduct = null;
let currentQuantity = 1;

// Initialize product page
function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) {
        showError('Product not found');
        return;
    }
    
    currentProduct = products.find(p => p.id === productId);
    
    if (!currentProduct) {
        showError('Product not found');
        return;
    }
    
    renderProduct();
    renderRelatedProducts();
    setupEventListeners();
}

// Render product details
function renderProduct() {
    const content = document.getElementById('productContent');
    const breadcrumb = document.getElementById('breadcrumbProduct');
    
    if (breadcrumb) {
        breadcrumb.textContent = currentProduct.name;
    }
    
    // Update page title
    document.title = `${currentProduct.name} | Shine On`;
    
    // Stock status
    let stockStatus = '';
    let stockClass = '';
    if (currentProduct.stock === 0) {
        stockStatus = '• Out of Stock';
        stockClass = 'out-of-stock';
    } else if (currentProduct.stock < 10) {
        stockStatus = `• Only ${currentProduct.stock} left`;
        stockClass = 'low-stock';
    } else {
        stockStatus = '• In Stock';
        stockClass = 'in-stock';
    }
    
    content.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-images">
                <div class="product-main-img">
                    <img src="${currentProduct.image}" alt="${currentProduct.name}" id="mainImage">
                </div>
            </div>
            
            <div class="product-info-panel">
                <span class="product-category-tag">${currentProduct.category}</span>
                <h1>${currentProduct.name}</h1>
                
                <div class="product-rating">
                    <div class="stars">★★★★★</div>
                    <span class="rating-count">(${Math.floor(Math.random() * 200) + 50} reviews)</span>
                </div>
                
                <div class="product-price">$${currentProduct.price}</div>
                
                <p class="product-description">${currentProduct.description}</p>
                
                ${currentProduct.benefits ? `
                <div class="product-benefits">
                    <h4>Key Benefits</h4>
                    <div class="benefits-list">
                        ${currentProduct.benefits.map(benefit => `
                            <div class="benefit-item">
                                <span class="benefit-icon">✓</span>
                                <span>${benefit}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="product-actions">
                    <div class="quantity-box">
                        <span class="quantity-label">Quantity</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn" id="decreaseQty" ${currentProduct.stock === 0 ? 'disabled' : ''}>−</button>
                            <span id="quantityValue">1</span>
                            <button class="quantity-btn" id="increaseQty" ${currentProduct.stock === 0 ? 'disabled' : ''}>+</button>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-primary" id="addToCartBtn" ${currentProduct.stock === 0 ? 'disabled' : ''}>
                            ${currentProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button class="btn btn-wishlist" id="addToWishlistBtn" aria-label="Add to wishlist">
                            ♡ Save
                        </button>
                    </div>
                </div>
                
                <div class="product-meta">
                    <div class="meta-item">
                        <h4 class="meta-title">
                            <span>📦</span> Stock Status
                        </h4>
                        <div class="stock-status ${stockClass}">
                            ${stockStatus}
                        </div>
                    </div>
                    
                    ${currentProduct.ingredients ? `
                    <div class="meta-item">
                        <h4 class="meta-title">
                            <span>🌿</span> Ingredients
                        </h4>
                        <p class="meta-content">${currentProduct.ingredients}</p>
                    </div>
                    ` : ''}
                    
                    <div class="meta-item">
                        <h4 class="meta-title">
                            <span>🚚</span> Shipping & Returns
                        </h4>
                        <p class="meta-content">
                            Free shipping on orders over $75. Free returns within 30 days.
                            Ships within 2-3 business days.
                        </p>
                    </div>
                    
                    <div class="meta-item">
                        <h4 class="meta-title">
                            <span>✨</span> Care Instructions
                        </h4>
                        <p class="meta-content">
                            Store in a cool, dry place away from direct sunlight. 
                            For external use only. Patch test recommended before first use.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const quantityValue = document.getElementById('quantityValue');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const addToWishlistBtn = document.getElementById('addToWishlistBtn');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            if (currentQuantity > 1) {
                currentQuantity--;
                quantityValue.textContent = currentQuantity;
                decreaseBtn.disabled = currentQuantity === 1;
            }
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            if (currentQuantity < currentProduct.stock) {
                currentQuantity++;
                quantityValue.textContent = currentQuantity;
                decreaseBtn.disabled = false;
                increaseBtn.disabled = currentQuantity >= currentProduct.stock;
            }
        });
    }
    
    if (addToCartBtn && currentProduct.stock > 0) {
        addToCartBtn.addEventListener('click', () => {
            addToCart();
        });
    }
    
    if (addToWishlistBtn) {
        addToWishlistBtn.addEventListener('click', () => {
            addToWishlist();
        });
    }
}

// Add to cart function
function addToCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity += currentQuantity;
    } else {
        cart.push({
            ...currentProduct,
            quantity: currentQuantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count in navbar
    if (window.updateCartDisplay) {
        window.updateCartDisplay();
    }
    
    // Show notification
    showNotification(`Added ${currentQuantity} ${currentQuantity === 1 ? 'item' : 'items'} to cart!`, 'success');
    
    // Reset quantity
    currentQuantity = 1;
    document.getElementById('quantityValue').textContent = '1';
    document.getElementById('decreaseQty').disabled = true;
    document.getElementById('increaseQty').disabled = false;
}

// Add to wishlist function
function addToWishlist() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    
    if (!wishlist.find(item => item.id === currentProduct.id)) {
        wishlist.push(currentProduct);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        showNotification('Added to favorites!', 'success');
        
        const btn = document.getElementById('addToWishlistBtn');
        btn.innerHTML = '♥ Saved';
        btn.style.background = 'var(--color-sage)';
        btn.style.color = 'var(--color-white)';
        btn.style.borderColor = 'var(--color-sage)';
    } else {
        showNotification('Already in favorites', 'info');
    }
}

// Render related products
function renderRelatedProducts() {
    const grid = document.getElementById('relatedProducts');
    if (!grid) return;
    
    // Get products from same category, excluding current product
    const related = products
        .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 4);
    
    // If not enough in same category, add some featured products
    if (related.length < 4) {
        const additional = products
            .filter(p => p.isFeatured && p.id !== currentProduct.id && !related.includes(p))
            .slice(0, 4 - related.length);
        related.push(...additional);
    }
    
    grid.innerHTML = related.map((product, index) => `
        <div class="product-card" style="animation-delay: ${index * 0.1}s" data-product-id="${product.id}">
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
            window.location.href = `product.html?id=${productId}`;
        });
    });
}

// Show notification
function showNotification(message, type = 'info') {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        // Fallback notification
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
}

// Show error
function showError(message) {
    const content = document.getElementById('productContent');
    if (content) {
        content.innerHTML = `
            <div class="product-error">
                <h2>😕 Oops!</h2>
                <p>${message}</p>
                <a href="shop.html" class="btn btn-primary">Back to Shop</a>
            </div>
        `;
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initProductPage);