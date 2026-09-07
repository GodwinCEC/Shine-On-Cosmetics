function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function initFaqs() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all others
            faqItems.forEach(i => i.classList.remove('active'));
            
            // Toggle current if it wasn't already active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

async function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const statusEl = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // UI Loading state
            submitBtn.disabled = true;
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
            statusEl.style.display = 'none';

            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value.trim(),
                createdAt: new Date().toISOString(),
                status: 'new'
            };

            try {
                const { db } = await import('./firebase-config.js');
                const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

                await addDoc(collection(db, "contacts"), formData);

                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Message sent successfully! We\'ll get back to you soon.';
                statusEl.className = "form-status success";
                statusEl.style.display = "flex";
                
                contactForm.reset();
                if (window.showNotification) window.showNotification("Message sent! ✨", "success");
            } catch (error) {
                console.error("Error submitting contact form:", error);
                statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error sending message. Please try again later.';
                statusEl.className = "form-status error";
                statusEl.style.display = "flex";
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
}

async function initSettings() {
    try {
        const { db } = await import('./firebase-config.js');
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        const settingsDoc = await getDoc(doc(db, "app_settings", "global"));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.socials) updateContactSocials(data.socials);
            if (data.contact) updateContactDetails(data.contact);
        }
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

function updateContactSocials(socials) {
    if (!socials) return;
    const container = document.querySelector('.social-icons');
    if (!container) return;

    const platforms = [
        { key: 'instagram', label: 'Instagram' },
        { key: 'whatsapp', label: 'WhatsApp' },
        { key: 'tiktok', label: 'TikTok' }
    ];

    platforms.forEach(p => {
        const data = socials[p.key];
        const el = container.querySelector(`[aria-label="${p.label}"]`);
        if (!el) return;

        if (data && data.visible !== false) {
            el.style.display = 'grid';
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
}

function updateContactDetails(contact) {
    if (!contact) return;
    
    // Update Email
    if (contact.email) {
        const emailCards = document.querySelectorAll('a.info-item[href^="mailto:"]');
        emailCards.forEach(card => {
            card.href = `mailto:${contact.email}`;
            const span = card.querySelector('.info-text span');
            if (span) span.textContent = contact.email;
        });
        
        // Also update any other simple email links (e.g. footer)
        document.querySelectorAll('a:not(.info-item)[href^="mailto:"]').forEach(link => {
            link.href = `mailto:${contact.email}`;
            link.textContent = contact.email;
        });
    }

    // Update Phone
    if (contact.phone) {
        const phoneCards = document.querySelectorAll('a.info-item[href^="tel:"]');
        phoneCards.forEach(card => {
            card.href = `tel:${contact.phone}`;
            const span = card.querySelector('.info-text span');
            if (span) span.textContent = contact.phone;
        });
    }

    // Update WhatsApp (the clickable card)
    if (contact.whatsapp || contact.phone) {
        const waPhone = contact.whatsapp || contact.phone;
        const waCards = document.querySelectorAll('a.info-item[href^="https://wa.me/"]');
        waCards.forEach(card => {
            const formatted = waPhone.replace(/\+/g, '').replace(/\s+/g, '');
            card.href = `https://wa.me/${formatted}`;
            const span = card.querySelector('.info-text span');
            if (span && (span.textContent.includes('055') || span.textContent.includes('233'))) {
                span.textContent = waPhone;
            }
        });
    }

    // Update Address (Visit Us is the 4th item)
    if (contact.address) {
        const addressEl = document.querySelector('.contact-info-grid .info-item:nth-child(4) .info-text p');
        if (addressEl) addressEl.textContent = contact.address;
    }
}

function initTicker() {
    const ticks = ['Pocket Friendly', 'New arrivals weekly', 'Cruelty-free & vegan', 'Internationally Sourced', 'Glow naturally'];
    const track = document.getElementById('tickerTrack');
    if (track) {
        const items = [...ticks, ...ticks].map(t => `
          <span class="ticker-item">${t}<span class="ticker-dot"></span></span>
        `).join('');
        track.innerHTML = items;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initTicker();
    initFaqs();
    initRevealAnimations();
    initContactForm();
});
