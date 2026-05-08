(function () {
    'use strict';

    // ---------- Header con sombra al hacer scroll ----------
    const header = document.querySelector('.header');
    const onScroll = () => {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---------- Menú móvil ----------
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');

    const closeMenu = () => {
        if (!menuToggle || !mainNav) return;
        menuToggle.setAttribute('aria-expanded', 'false');
        mainNav.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', String(!isOpen));
            mainNav.classList.toggle('is-open', !isOpen);
            document.body.style.overflow = !isOpen ? 'hidden' : '';
        });

        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeMenu();
        });
    }

    // ---------- Scroll spy: resalta link activo ----------
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

    if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
        const setActive = (id) => {
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                link.classList.toggle('active', href === `#${id}`);
            });
        };

        const spy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

        sections.forEach(section => spy.observe(section));
    }

    // ---------- Animación de aparición (reveal on scroll) ----------
    const revealTargets = document.querySelectorAll(
        '.service-card, .process-step, .about-grid, .faq-item, .cta-banner, .section-header'
    );

    revealTargets.forEach(el => el.classList.add('reveal'));

    if ('IntersectionObserver' in window) {
        const revealObs = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        revealTargets.forEach(el => revealObs.observe(el));
    } else {
        revealTargets.forEach(el => el.classList.add('is-visible'));
    }

    // ---------- FAQ: cerrar otros al abrir uno (un único abierto) ----------
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                faqItems.forEach(other => {
                    if (other !== item) other.open = false;
                });
            }
        });
    });

})();
