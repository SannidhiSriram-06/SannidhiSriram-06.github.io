document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');

    // Function to set theme
    const setTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (theme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    };

    // Initialize theme
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Default to dark mode as requested
        setTheme('dark');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // 2. Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const menuIcon = mobileMenuBtn.querySelector('i');

    const toggleMobileMenu = () => {
        const isActive = mobileMenuOverlay.classList.toggle('active');
        if (isActive) {
            menuIcon.classList.remove('ph-list');
            menuIcon.classList.add('ph-x');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            menuIcon.classList.remove('ph-x');
            menuIcon.classList.add('ph-list');
            document.body.style.overflow = 'auto';
        }
    };

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMobileMenu);
    });

    // 3. Intersection Observer for Fade-Up Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once visible if you only want it to fade in once
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => fadeObserver.observe(el));

    // 4. Highlight Active Nav Link on Scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    const scrollObserverOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active from all
                navLinks.forEach(link => link.classList.remove('active'));

                // Add active to current
                const currentId = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`.nav-links a[href="#${currentId}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, scrollObserverOptions);

    sections.forEach(section => scrollObserver.observe(section));

    // 5. Navbar styling on scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 6. Terminal Typing Effect for Hero Role
    const roleElement = document.querySelector('.hero-role');
    if (roleElement) {
        // Only get text nodes (ignore the span.cursor)
        let textContent = '';
        roleElement.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                textContent += node.textContent;
            }
        });

        const fullText = textContent.trim();
        const cursorHTML = '<span class="cursor">▎</span>';

        // Clear text immediately 
        roleElement.innerHTML = cursorHTML;

        let i = 0;
        const typeWriter = () => {
            if (i < fullText.length) {
                // Insert character before cursor
                roleElement.innerHTML = fullText.substring(0, i + 1) + cursorHTML;
                i++;
                // Randomize typing speed for realism (50ms to 100ms)
                setTimeout(typeWriter, Math.random() * 50 + 50);
            }
        };

        // Start typing after a short delay (e.g. 500ms)
        setTimeout(typeWriter, 500);
    }

    // 7. Animated Stat Counters
    const statNumbers = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.textContent, 10);
                if (isNaN(target)) return;
                el.textContent = '0';
                const duration = 1500;
                const startTime = performance.now();

                const animate = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // Ease-out cubic
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.round(eased * target);
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };
                requestAnimationFrame(animate);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));
});
