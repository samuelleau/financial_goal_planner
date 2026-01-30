// Main JavaScript for FinGoal homepage
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Animate floating cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards for animation
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Typing Animation for Hero Title
    const typingText = document.querySelector('.typing-text');
    if (typingText) {
        const fullText = 'Your AI-Powered Financial Future';
        const gradientStartIndex = 16; // Start of "Financial Future"
        let i = 0;
        
        // Clear any existing text
        typingText.innerHTML = '';
        
        const typeWriter = () => {
            if (i < fullText.length) {
                i++;
                const typedText = fullText.substring(0, i);
                
                // Split text into regular and gradient parts
                if (i <= gradientStartIndex) {
                    typingText.innerHTML = typedText;
                } else {
                    const regularPart = fullText.substring(0, gradientStartIndex);
                    const gradientPart = fullText.substring(gradientStartIndex, i);
                    typingText.innerHTML = regularPart + '<span class="gradient-text">' + gradientPart + '</span>';
                }
                
                setTimeout(typeWriter, 100);
            }
        };
        
        // Start typing after a short delay
        setTimeout(typeWriter, 500);
    }



    // Mobile menu toggle (if needed in future)
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-links');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Add parallax effect to hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Animate stats on scroll (for future use)
    const animateStats = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.dataset.target);
                    const increment = target / 100;
                    let current = 0;
                    
                    const updateStat = () => {
                        if (current < target) {
                            current += increment;
                            stat.textContent = Math.ceil(current);
                            setTimeout(updateStat, 20);
                        } else {
                            stat.textContent = target;
                        }
                    };
                    
                    updateStat();
                });
            }
        });
    };

    // Check if user has visited before
    const hasVisited = localStorage.getItem('fingoal_visited');
    if (!hasVisited) {
        // First time visitor - could show welcome modal or tutorial
        localStorage.setItem('fingoal_visited', 'true');
        
        // Add welcome animation
        document.body.classList.add('first-visit');
        
        setTimeout(() => {
            document.body.classList.remove('first-visit');
        }, 2000);
    }

    // Add loading animation
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });

    // Preload critical pages
    const criticalPages = ['chat.html', 'dashboard.html'];
    criticalPages.forEach(page => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
    });

    // Add error handling for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    });

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`Page load time: ${loadTime}ms`);
        });
    }
});

// Utility functions
const utils = {
    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Local storage helpers
    storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Error saving to localStorage:', e);
            }
        },
        
        get: (key) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return null;
            }
        },
        
        remove: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('Error removing from localStorage:', e);
            }
        }
    }
};

// Export utils for use in other scripts
window.FinGoalUtils = utils;
