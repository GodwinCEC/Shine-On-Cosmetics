const navbarHTML = `
<nav class="navbar">
    <div class="container navbar-container">
        <a href="/" class="logo">SHINE ON</a>
        
        <div class="nav-links" id="navLinks">
            <a href="/" class="nav-link">Home</a>
            <a href="/about" class="nav-link">About</a>
            <a href="/shop" class="nav-link">Shop</a>
            <div id="authPlace"></div>
            <a href="/cart" class="nav-link cart-link">
                Cart <span id="cartCount" style="display: none;">0</span>
            </a>
        </div>

        <button class="hamburger" id="hamburger" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </div>
</nav>
`;

function initNavbar() {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (!navbarPlaceholder) return;

    navbarPlaceholder.innerHTML = navbarHTML;

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.querySelector('.navbar');

    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        const isActive = navLinks.classList.contains('active');
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
        document.body.style.overflow = isActive ? '' : 'hidden';
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Sticky navbar effect on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide navbar on scroll down, show on scroll up
        if (currentScroll > lastScroll && currentScroll > 500) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    }, { passive: true });

    // Set active link based on current page
    const currentPath = window.location.pathname;
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPath === linkPath ||
            (currentPath === '/' && linkPath.includes('index')) ||
            (currentPath.includes('pages') && linkPath.includes(currentPath.split('/').pop()))) {
            link.classList.add('active');
        }
    });

    updateAuthUI();
    updateCartDisplay();
}

function updateAuthUI() {
    const authPlace = document.getElementById('authPlace');
    if (!authPlace) return;

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (user) {
        authPlace.innerHTML = `
            <a href="/dashboard" class="nav-link">
                <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <span>Profile</span>
                </span>
            </a>
        `;
    } else {
        authPlace.innerHTML = `<a href="/auth" class="nav-link">Sign In</a>`;
    }
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = document.getElementById('cartCount');

    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline-flex' : 'none';
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initNavbar);

// Listen for storage changes (cart updates from other tabs/windows)
window.addEventListener('storage', (e) => {
    if (e.key === 'cart') {
        updateCartDisplay();
    }
    if (e.key === 'user') {
        updateAuthUI();
    }
});

// Make functions globally available
window.updateAuthUI = updateAuthUI;
window.updateCartDisplay = updateCartDisplay;