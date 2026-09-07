const footerHTML = `
<footer class="footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-brand">
                <a href="index.html" class="logo">Shine On</a>
                <p class="brand-bio">
                    Basic and affordable care at your doorstep. 
                </p>
            </div>
            
            <nav class="footer-nav">
                <ul class="footer-links">
                    <li><a href="shop.html">Shop</a></li>
                    <li><a href="cart.html">Cart</a></li>
                    <li><a href="dashboard.html">Wishlist</a></li>
                    <li><a href="contact.html">Contact</a></li>
                    <li><a href="auth.html" id="footer-auth-link">Sign In</a></li>
                </ul>
            </nav>

            <div class="footer-socials">
                <a href="https://www.instagram.com/n.akua_sasu" class="social-btn" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                <a href="https://www.tiktok.com/@nanaakuasasu" class="social-btn" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
                <a href="https://wa.me/233552291858" class="social-btn" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>© <span id="year"></span> Shine On Cosmetics. All rights reserved.</p>
            <div class="developer-credit">
                <span>Developed by </span>
                <a href="https://godwinmawuli.com" target="_blank" rel="noopener noreferrer">
                    <span class="dev-name">Godwin Mawulikplim</span> <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        </div>
    </div>
</footer>
`;

function initFooter() {
    const placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) return;

    placeholder.innerHTML = footerHTML;

    // Update Year
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    updateFooterAuthUI();
    
    // Auto-sync with Firestore if we aren't on the Home page (which handles its own sync)
    if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        syncFooterToFirestore();
    }
}

async function syncFooterToFirestore() {
    try {
        // Handle path resolution for different page locations
        const isSubdir = window.location.pathname.includes('/admin');
        const configPath = isSubdir ? '../js/firebase-config.js' : './js/firebase-config.js';
        
        const { db } = await import(configPath);
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        const settingsDoc = await getDoc(doc(db, "app_settings", "global"));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.socials) {
                updateFooterSocials(data.socials);
            }
        }
    } catch (e) {
        console.warn("Footer sync background task failed (expected on some local loads):", e);
    }
}

function updateFooterAuthUI() {
    const authLink = document.getElementById('footer-auth-link');
    if (!authLink) return;

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
        authLink.textContent = 'Account';
        authLink.href = 'dashboard.html';
    } else {
        authLink.textContent = 'Sign In';
        authLink.href = 'auth.html';
    }
}

function updateFooterSocials(socials) {
    if (!socials) return;
    const container = document.querySelector('.footer-socials');
    if (!container) return;

    const platforms = [
        { key: 'instagram', label: 'Instagram' },
        { key: 'tiktok', label: 'TikTok' },
        { key: 'whatsapp', label: 'WhatsApp' }
    ];

    let visibleCount = 0;
    platforms.forEach(p => {
        const data = socials[p.key];
        const el = container.querySelector(`[aria-label="${p.label}"]`);
        if (!el) return;

        if (data && data.visible !== false) {
            el.style.display = 'grid'; // Matches .social-btn display in CSS
            visibleCount++;
            if (p.key === 'whatsapp') {
                const phone = data.url || '233552291858';
                el.href = `https://wa.me/${phone.replace(/\+/g, '').replace(/\s+/g, '')}`;
            } else if (data.url) {
                el.href = data.url;
            }
        } else {
            el.style.display = 'none';
        }
    });

    // Hide the entire container if no socials are visible to keep the layout clean
    container.style.display = visibleCount > 0 ? 'flex' : 'none';
}

// Global exposure
window.updateFooterAuthUI = updateFooterAuthUI;
window.updateFooterSocials = updateFooterSocials;

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooter);
} else {
    initFooter();
}