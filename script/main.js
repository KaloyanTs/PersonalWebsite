// Main client-side behavior: intersection animations and contact form helpers.
(function () {
    'use strict';

    function initObservers() {
        const observerOptions = { threshold: 0.2 };
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements used across the site if present
        const heroTitle = document.querySelector('.hero-title');
        const heroDesc = document.querySelector('.hero-desc');
        const heroBtn = document.querySelector('.hero-btn');
        [heroTitle, heroDesc, heroBtn].forEach(el => el && observer.observe(el));

        document.querySelectorAll('.section-title').forEach(el => observer.observe(el));
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
        document.querySelectorAll('.math-item').forEach(el => observer.observe(el));
        document.querySelectorAll('.note-item').forEach(el => observer.observe(el));
        document.querySelectorAll('.about-images img').forEach(el => observer.observe(el));
    }

    function initContactHelpers() {
        // Simple status indicator when the contact form is submitted.
        const form = document.getElementById('contact-form');
        const statusEl = document.getElementById('formStatus');
        if (!form) return;

        form.addEventListener('submit', () => {
            if (statusEl) statusEl.textContent = 'Sending message...';
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initObservers();
        initContactHelpers();
    });
})();

// Legacy helpers for `index_old.html` kept in `indexScript.js`.
