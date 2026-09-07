const navbarHTML = `
<nav class="navbar" id="navbar">
  <div class="container nav-inner">
    <a href="index.html" class="logo">Shine On</a>
    <div class="nav-links">
      <a href="index.html" class="nav-link" data-link="home">Home</a>
      <a href="shop.html" class="nav-link" data-link="shop">Shop</a>
      <a href="contact.html" class="nav-link" data-link="contact">Contact</a>
      <span id="authPlaceDesktop" style="display: inline-flex; align-items: center;"></span>
      <a href="cart.html" class="nav-link" data-link="cart">
        <i class="fas fa-cart-shopping"></i>
        Cart <span class="cart-count-bracket"></span>
      </a>
    </div>
    <button class="hamburger" id="hamburger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="nav-scrim" id="navScrim"></div>
  <div class="mobile-menu" id="mobileMenu">
    <a href="index.html" class="nav-link" data-link="home">Home</a>
    <a href="shop.html" class="nav-link" data-link="shop">Shop</a>
    <a href="contact.html" class="nav-link" data-link="contact">Contact</a>
    <a href="cart.html" class="nav-link" data-link="cart">
      <i class="fas fa-cart-shopping"></i>
      Cart <span class="cart-count-bracket"></span>
    </a>
    <div id="authPlaceMobile"></div>
  </div>
</nav>
`;

function initNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    // Get options from data attributes
    const heroMode = placeholder.getAttribute('data-hero-mode') === 'true';
    const hideOnScroll = placeholder.getAttribute('data-hide-on-scroll') === 'true';
    const activeLink = placeholder.getAttribute('data-active');

    placeholder.innerHTML = navbarHTML;

    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const navScrim = document.getElementById('navScrim');

    // Handle Active Link
    if (activeLink) {
        const links = document.querySelectorAll(`[data-link="${activeLink}"]`);
        links.forEach(l => l.classList.add('active'));
    } else {
        // Fallback: auto-detect
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        const map = {
            'index.html': 'home',
            'shop.html': 'shop',
            'about.html': 'about',
            'cart.html': 'cart'
        };
        const activeKey = map[page];
        if (activeKey) {
            document.querySelectorAll(`[data-link="${activeKey}"]`).forEach(l => l.classList.add('active'));
        }
    }

    // Toggle Menu Function
    function toggleMenu(force) {
        const open = force !== undefined ? force : !mobileMenu.classList.contains('open');
        mobileMenu.classList.toggle('open', open);
        navScrim.classList.toggle('open', open);
        hamburger.classList.toggle('active', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }

    hamburger?.addEventListener('click', () => toggleMenu());
    navScrim?.addEventListener('click', () => toggleMenu(false));
    mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

    // Scroll Logic
    if (heroMode) {
        navbar.classList.add('hero-mode');
    }

    let lastScroll = 0;
    let scrollThreshold = 100;

    window.addEventListener('scroll', () => {
        const now = window.pageYOffset;

        // Hero-mode color switching
        if (heroMode) {
            if (now > 80) {
                navbar.classList.add('scrolled');
                navbar.classList.remove('hero-mode');
            } else {
                navbar.classList.remove('scrolled');
                navbar.classList.add('hero-mode');
            }
        } else {
            // Standard scroll shadow
            if (now > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        // Hide on Scroll Down logic
        if (hideOnScroll) {
            if (now > lastScroll && now > 400) {
                // Scrolling down
                navbar.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                navbar.style.transform = 'translateY(0)';
            }
        }

        lastScroll = now;
    }, { passive: true });

    updateCartDisplay();
    updateAuthUI();
}

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update Bracket version everywhere
    const countBrackets = document.querySelectorAll('.cart-count-bracket');
    countBrackets.forEach(el => {
        el.textContent = total > 0 ? `(${total})` : '';
    });
}

function updateAuthUI() {
    const mobileAuth = document.getElementById('authPlaceMobile');
    const desktopAuth = document.getElementById('authPlaceDesktop');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const authHTML = user
        ? `<a href="dashboard.html" class="nav-link">Me</a>`
        : `<a href="auth.html" class="nav-link">Login</a>`;

    if (mobileAuth) mobileAuth.innerHTML = authHTML;
    if (desktopAuth) desktopAuth.innerHTML = authHTML;
}

// Global exposure
window.updateCartDisplay = updateCartDisplay;
window.updateAuthUI = updateAuthUI;

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}