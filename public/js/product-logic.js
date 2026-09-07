import { products as hardcodedProducts } from './products-data.js';

let currentProduct = null;
let currentQuantity = 1;
window.acceptingOrders = true;

// Initialize product page
async function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showError('Product not found');
        return;
    }

    try {
        const { db } = await import('./firebase-config.js');
        const { doc, getDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const settingsDoc = await getDoc(doc(db, "app_settings", "global"));
        let useHardcoded = true;
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.useHardcodedData === false) useHardcoded = false;
            if (data.acceptingOrders === false) window.acceptingOrders = false;
            window.globalTags = data.tags || [];
        }

        if (!useHardcoded) {
            const pDoc = await getDoc(doc(db, "products", productId));
            if (pDoc.exists()) {
                const data = pDoc.data();
                if (data.isVisible !== false) {
                    currentProduct = { id: pDoc.id, ...data };
                }
            }

            // Also fetch related products
            const querySnapshot = await getDocs(collection(db, "products"));
            const liveProducts = [];
            querySnapshot.forEach(d => {
                const p = d.data();
                if (p.isVisible !== false) liveProducts.push({ id: d.id, ...p });
            });
            window.allProducts = liveProducts;
        } else {
            currentProduct = hardcodedProducts.find(p => p.id == productId);
            window.allProducts = hardcodedProducts;
        }
    } catch (err) {
        console.error("Error loading product:", err);
        currentProduct = hardcodedProducts.find(p => p.id == productId);
        window.allProducts = hardcodedProducts;
    }

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
    document.title = `${currentProduct.name} | Shine On Cosmetics`;

    // Stock status
    // Stock status (Removed)
    /*
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
    */

    const fullImages = currentProduct.images
        ? currentProduct.images.map(img => img.full || img.thumbnail)
        : [currentProduct.image];

    const thumbnailImages = currentProduct.images
        ? currentProduct.images.map(img => img.thumbnail || img.full)
        : [currentProduct.image];

    content.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-images">
                <div class="product-main-img clickable" id="mainImageContainer">
                    <div class="image-track" id="mainImageTrack">
                        ${fullImages.map(img => `
                            <div class="track-item">
                                <img src="${img}" alt="${currentProduct.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800'">
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${thumbnailImages.length > 1 ? `
                <div class="product-thumbnails">
                    ${thumbnailImages.map((img, idx) => `
                        <div class="thumbnail ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                            <img src="${img}" alt="${currentProduct.name} view ${idx + 1}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800'">
                        </div>
                    `).join('')}
                </div>
                ` : ''}

            </div>
            
            <div class="product-info-panel">
                <h1>${currentProduct.name}</h1>
                <div class="product-category-minimal">${(currentProduct.categories && Array.isArray(currentProduct.categories) ? currentProduct.categories : [currentProduct.category || '']).filter(Boolean).join(' • ')}</div>

                ${currentProduct.tags && currentProduct.tags.length > 0 ? `
                    <div class="tag-chips-container">
                        ${currentProduct.tags.map(tagId => {
                            const tagObj = (window.globalTags || []).find(t => t.id === tagId);
                            const name = tagObj ? tagObj.name : tagId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            return `<span class="tag-chip">${name}</span>`;
                        }).join('')}
                    </div>
                ` : ''}
                
                <div class="product-price">GH₵${parseFloat(currentProduct.price).toFixed(2)}</div>
                
                <div class="product-actions">
                    <div class="quantity-box">
                        <span class="quantity-label">Quantity</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn" id="decreaseQty" disabled>−</button>
                            <span id="quantityValue">1</span>
                            <button class="quantity-btn" id="increaseQty">+</button>
                        </div>
                    </div>
                    
                    <div id="productSubtotal" class="product-subtotal-info" style="display:none; font-family:var(--font-heading); font-weight:600; font-size:0.95rem; color:var(--caramel); margin-bottom:1.5rem">
                        Subtotal: <span class="subtotal-val">GH₵${parseFloat(currentProduct.price).toFixed(2)}</span>
                    </div>
                    
                    <div class="action-buttons" id="mainActionSuite">
                        <button class="btn-icon share-btn-trigger" title="Share">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button class="btn btn-primary add-to-cart-trigger" style="${!window.acceptingOrders ? 'opacity:0.6; cursor:not-allowed;' : ''}">
                            Add to Cart
                        </button>
                        <button class="btn-icon favorite-btn-trigger" aria-label="Add to wishlist">
                            <i class="${isFavorited() ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>

                <div class="product-description-section">
                    <p class="product-description">${currentProduct.description || ''}</p>
                </div>
            </div>
        </div>
    `;
}

// Helper to check if product is favorited
function isFavorited() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return wishlist.some(item => item.id == currentProduct.id);
}

function updateSubtotal() {
    const subtotalEl = document.getElementById('productSubtotal');
    const floatingBtn = document.getElementById('floatingAddToCart');
    
    const total = parseFloat(currentProduct.price) * currentQuantity;
    const totalStr = `GH₵${total.toFixed(2)}`;

    if (subtotalEl) {
        subtotalEl.querySelector('.subtotal-val').textContent = totalStr;
        subtotalEl.style.display = currentQuantity > 1 ? 'block' : 'none';
        subtotalEl.style.animation = 'fadeInUp .3s var(--ease-out)';
    }

    if (floatingBtn) {
        // floatingBtn.textContent = `Add to Cart — ${totalStr}`;
        floatingBtn.textContent = `Add to Cart`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Quantity Controls
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const quantityValue = document.getElementById('quantityValue');

    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            if (currentQuantity > 1) {
                currentQuantity--;
                quantityValue.textContent = currentQuantity;
                decreaseBtn.disabled = currentQuantity === 1;
                updateSubtotal();
            }
        });
    }

    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            currentQuantity++;
            quantityValue.textContent = currentQuantity;
            decreaseBtn.disabled = false;
            updateSubtotal();
        });
    }

    // Unified Add to Cart Buttons
    const addToCartTrigger = document.body.querySelectorAll('.add-to-cart-trigger, #floatingAddToCart');
    addToCartTrigger.forEach(btn => {
        if (btn) {
            btn.onclick = () => addToCart();
        }
    });

    // Unified Favorite Buttons
    const favoriteTriggers = document.body.querySelectorAll('.favorite-btn-trigger, #floatingFavorite, .product-main-img .btn-wishlist');
    favoriteTriggers.forEach(btn => {
        if (btn) {
            btn.onclick = () => toggleWishlist(btn);
        }
    });

    // Unified Share Buttons
    const shareTriggers = document.body.querySelectorAll('.share-btn-trigger, #shareBtn');
    shareTriggers.forEach(btn => {
        if (btn) {
            btn.onclick = () => {
                if (navigator.share) {
                    navigator.share({
                        title: currentProduct.name,
                        text: currentProduct.description,
                        url: window.location.href
                    }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(window.location.href);
                    showNotification('Link copied to clipboard!', 'info');
                }
            };
        }
    });

    // Image Gallery & Lightbox
    const mainImageContainer = document.getElementById('mainImageContainer');
    const mainImageTrack = document.getElementById('mainImageTrack');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const imageModal = document.getElementById('imageModal');
    const modalImageTrack = document.getElementById('modalImageTrack');
    const closeModal = document.getElementById('closeModal');
    const modalCounter = document.getElementById('modalCounter');

    let currentImageIndex = 0;
    const images = currentProduct.images
        ? currentProduct.images.map(img => img.full || img.thumbnail)
        : [currentProduct.image];

    // Populate Modal Track if empty
    if (modalImageTrack) {
        // Redraw modal track every time to ensure it shows the correct 'full' images for the loaded product
        modalImageTrack.innerHTML = images.map(img => `
            <div class="track-item">
                <img src="${img}" alt="${currentProduct.name}" onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800'">
            </div>
        `).join('');
    }

    const updateGalleryState = (index) => {
        // Handle circular navigation
        if (index < 0) index = images.length - 1;
        if (index >= images.length) index = 0;

        currentImageIndex = index;

        // Update main image track
        if (mainImageTrack) {
            mainImageTrack.style.transform = `translateX(-${currentImageIndex * 100}%)`;
        }

        // Update lightbox image track
        if (modalImageTrack) {
            modalImageTrack.style.transform = `translateX(-${currentImageIndex * 100}%)`;
        }

        // Update thumbnails
        thumbnails.forEach((t, i) => {
            t.classList.toggle('active', i === currentImageIndex);
        });

        // Update counter
        if (modalCounter) {
            modalCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
        }
    };

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            updateGalleryState(parseInt(thumb.dataset.index));
        });
    });

    mainImageContainer?.addEventListener('click', (e) => {
        // Only open modal if we didn't just swipe
        if (!isSwiping) {
            updateGalleryState(currentImageIndex);
            imageModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    imageModal?.addEventListener('click', (e) => {
        if (e.target === imageModal || e.target.classList.contains('modal-content')) {
            imageModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    closeModal?.addEventListener('click', (e) => {
        e.stopPropagation();
        imageModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Integrated Touch Swipe Logic
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;

    const attachSwipeListener = (element) => {
        if (!element) return;

        element.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            isSwiping = false;
        }, { passive: true });

        element.addEventListener('touchmove', () => {
            isSwiping = true;
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                // Swipe Left -> Next
                updateGalleryState(currentImageIndex + 1);
            } else if (touchEndX > touchStartX + swipeThreshold) {
                // Swipe Right -> Prev
                updateGalleryState(currentImageIndex - 1);
            }

            // Small delay to reset isSwiping so clicks aren't immediately blocked
            setTimeout(() => { isSwiping = false; }, 50);
        }, { passive: true });
    };

    // Apply swipe to both main image and lightbox
    attachSwipeListener(mainImageContainer);
    attachSwipeListener(imageModal);

    // Lightbox Nav
    document.querySelector('.modal-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        updateGalleryState(currentImageIndex - 1);
    });

    document.querySelector('.modal-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        updateGalleryState(currentImageIndex + 1);
    });

    // Keyboard Navigation
    window.addEventListener('keydown', (e) => {
        if (!imageModal.classList.contains('active')) return;

        if (e.key === 'ArrowLeft') updateGalleryState(currentImageIndex - 1);
        if (e.key === 'ArrowRight') updateGalleryState(currentImageIndex + 1);
        if (e.key === 'Escape') {
            imageModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Dynamic Floating CTA (Show when main actions are scrolled out)
    const floatingCTA = document.getElementById('floatingCTA');
    const mainActionSuite = document.getElementById('mainActionSuite');

    if (floatingCTA && mainActionSuite) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // If main action suite is NOT intersecting (out of view), show floating bar
                // But only if we are below it (scrolled down)
                const isBelow = entry.boundingClientRect.top < 0;

                if (!entry.isIntersecting && isBelow) {
                    floatingCTA.classList.add('visible');
                } else {
                    floatingCTA.classList.remove('visible');
                }
            });
        }, {
            threshold: 0,
            rootMargin: '-10px 0px 0px 0px' // Trigger slightly before it fully leaves or enters
        });

        observer.observe(mainActionSuite);
    }


    // Back to Top Logic
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
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
            updateObj.favorites = listItems.map(p => p.id); // Storing IDs for favorites
        } else {
            updateObj.cart = listItems; // Storing full objects for cart
        }

        await setDoc(userRef, updateObj, { merge: true });
    } catch (err) {
        console.error("Error syncing to Firestore:", err);
    }
}

// Add to cart function
async function addToCart() {
    if (!window.acceptingOrders) {
        showNotification("We aren't currently accepting orders, but you can add items to your wishlist!", 'error');
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id == currentProduct.id);

    if (existingItem) {
        existingItem.quantity += currentQuantity;
    } else {
        cart.push({
            ...currentProduct,
            quantity: currentQuantity
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    syncUserArrayToFirestore('cart');

    // Update cart count in navbar
    if (window.updateCartDisplay) {
        window.updateCartDisplay();
    }

    // Show notification
    showNotification(`Added ${currentQuantity} ${currentQuantity === 1 ? 'item' : 'items'} to cart!`, 'success');

    // Reset quantity
    currentQuantity = 1;
    const qtyValueDisplay = document.getElementById('quantityValue');
    const decrBtn = document.getElementById('decreaseQty');
    if (qtyValueDisplay) qtyValueDisplay.textContent = '1';
    if (decrBtn) decrBtn.disabled = true;

    // Button Feedback Flow
    const allAddToCartBtns = document.querySelectorAll('.add-to-cart-trigger, #floatingAddToCart');
    allAddToCartBtns.forEach(btn => {
        const originalText = btn.textContent;
        const previousPointerEvents = btn.style.pointerEvents;

        btn.textContent = 'Added to Cart ✓';
        btn.style.background = 'var(--sage, #A8BF96)';
        btn.style.borderColor = 'var(--sage, #A8BF96)';
        btn.style.pointerEvents = 'none';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.pointerEvents = previousPointerEvents;
        }, 2500);
    });
}

// Toggle Wishlist
async function toggleWishlist(btn) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const index = wishlist.findIndex(item => item.id == currentProduct.id);

    if (index === -1) {
        wishlist.push(currentProduct);
        showNotification('Added to wishlist!', 'success');
        updateFavoriteButtons(true);
    } else {
        wishlist.splice(index, 1);
        showNotification('Removed from favorites', 'info');
        updateFavoriteButtons(false);
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    syncUserArrayToFirestore('wishlist');
}

function updateFavoriteButtons(isFav) {
    const favoriteTriggers = document.body.querySelectorAll('.favorite-btn-trigger, #floatingFavorite, .product-main-img .btn-wishlist');
    const iconClass = isFav ? 'fas' : 'far';

    favoriteTriggers.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = `${iconClass} fa-heart`;
        }
        btn.classList.toggle('active', isFav);
    });
}

// Render related products
function renderRelatedProducts() {
    const grid = document.getElementById('relatedProducts');
    const relatedSection = document.querySelector('.related-products');
    if (!grid) return;

    // Get products from same category, excluding current product
    const currentCats = currentProduct.categories && Array.isArray(currentProduct.categories) ? currentProduct.categories : [currentProduct.category];
    const related = window.allProducts
        .filter(p => {
            const pCats = p.categories && Array.isArray(p.categories) ? p.categories : [p.category];
            const sharesCategory = pCats.some(c => currentCats.includes(c));
            return sharesCategory && p.id != currentProduct.id;
        })
        .slice(0, 4);

    // If there are no related products in the same category, hide the whole section
    if (related.length === 0) {
        if (relatedSection) relatedSection.style.display = 'none';
        return;
    } else {
        if (relatedSection) relatedSection.style.display = 'block';
    }

    grid.innerHTML = related.map((product, index) => {
        const coverImage = (product.images && product.images.length > 0) ? product.images[0].thumbnail || product.images[0].full : product.image;
        return `
        <div class="product-card" style="animation-delay: ${index * 0.1}s" data-product-id="${product.id}">
            <div class="card-img">
                <img src="${coverImage}" alt="${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800'">
            </div>
            <div class="product-info-minimal">
                <span class="category-tag">${(product.categories && Array.isArray(product.categories) ? product.categories : [product.category || '']).filter(Boolean).join(' • ')}</span>
                <h3>${product.name}</h3>
                <p class="price">GH₵${parseFloat(product.price).toFixed(2)}</p>
            </div>
        </div>
    `;
    }).join('');

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