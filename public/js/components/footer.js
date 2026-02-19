const footerHTML = `
<footer class="footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-section">
                <h3 class="logo footer-logo">SHINE ON</h3>
                <p>Curating minimalist beauty rituals for the modern, editorial soul. Pure ingredients, stunning results, ethical practices.</p>
                <div class="footer-social" style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <a href="#" aria-label="Instagram" style="font-size: 1.5rem; opacity: 0.6; transition: opacity 0.3s;">📷</a>
                    <a href="#" aria-label="Pinterest" style="font-size: 1.5rem; opacity: 0.6; transition: opacity 0.3s;">📌</a>
                    <a href="#" aria-label="TikTok" style="font-size: 1.5rem; opacity: 0.6; transition: opacity 0.3s;">🎵</a>
                </div>
            </div>
            
            <div class="footer-section">
                <h4 class="footer-title">The Rituals</h4>
                <ul class="footer-links">
                    <li><a href="/shop?cat=Skin" class="footer-link">Skincare</a></li>
                    <li><a href="/shop?cat=Glow" class="footer-link">The Glow</a></li>
                    <li><a href="/shop?cat=Scents" class="footer-link">Editorial Scents</a></li>
                    <li><a href="/shop?cat=Essentials" class="footer-link">The Essentials</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h4 class="footer-title">Company</h4>
                <ul class="footer-links">
                    <li><a href="/about" class="footer-link">Our Story</a></li>
                    <li><a href="#" class="footer-link">Sustainability</a></li>
                    <li><a href="#" class="footer-link">Press</a></li>
                    <li><a href="#" class="footer-link">Careers</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h4 class="footer-title">Support</h4>
                <ul class="footer-links">
                    <li><a href="#" class="footer-link">Contact Us</a></li>
                    <li><a href="#" class="footer-link">Shipping Info</a></li>
                    <li><a href="#" class="footer-link">Returns</a></li>
                    <li><a href="#" class="footer-link">FAQs</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h4 class="footer-title">Newsletter</h4>
                <p>Join the inner circle for exclusive editorial drops and early access.</p>
                <form class="newsletter-form" id="newsletterForm">
                    <input type="email" placeholder="Your email" required aria-label="Email address">
                    <button type="submit" class="btn btn-primary">Join</button>
                </form>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} Shine On Cosmetics. All rights reserved. Developed with ✨ by Godwin Mawulikplim.</p>
            <div style="margin-top: 1rem; display: flex; gap: 2rem; justify-content: center; font-size: 0.85rem;">
                <a href="#" style="opacity: 0.6;">Privacy Policy</a>
                <a href="#" style="opacity: 0.6;">Terms of Service</a>
                <a href="#" style="opacity: 0.6;">Accessibility</a>
            </div>
        </div>
    </div>
</footer>
`;

function initFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;

    footerPlaceholder.innerHTML = footerHTML;

    // Newsletter form handler
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value;

            // Simulate API call
            const button = form.querySelector('button');
            const originalText = button.textContent;
            button.textContent = 'Joining...';
            button.disabled = true;

            setTimeout(() => {
                // Show success message
                if (window.showNotification) {
                    window.showNotification('Welcome to the Shine On family! ✨', 'success');
                } else {
                    alert('Thank you for subscribing!');
                }

                form.reset();
                button.textContent = originalText;
                button.disabled = false;
            }, 1000);
        });
    }

    // Social link hover effects
    const socialLinks = document.querySelectorAll('.footer-social a');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function () {
            this.style.opacity = '1';
            this.style.transform = 'translateY(-3px)';
        });
        link.addEventListener('mouseleave', function () {
            this.style.opacity = '0.6';
            this.style.transform = 'translateY(0)';
        });
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initFooter);