// Education page functionality
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.edu-nav-btn');
    const sections = document.querySelectorAll('.education-section');

    // Section navigation
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.dataset.section;
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
            
            // Smooth scroll to section
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll animations
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

    // Observe lesson cards for animation
    const lessonCards = document.querySelectorAll('.lesson-card');
    lessonCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add hover effects to lesson cards
    lessonCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Progress tracking for action plan
    const actionItems = document.querySelectorAll('.plan-week li');
    actionItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('completed');
            updateProgress();
        });
    });

    function updateProgress() {
        const totalItems = actionItems.length;
        const completedItems = document.querySelectorAll('.plan-week li.completed').length;
        const progress = (completedItems / totalItems) * 100;
        
        // You could add a progress bar here if desired
        console.log(`Progress: ${progress.toFixed(1)}%`);
    }

    // Add interactive elements
    const tipItems = document.querySelectorAll('.lesson-tip');
    tipItems.forEach(tip => {
        tip.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const activeButton = document.querySelector('.edu-nav-btn.active');
            const buttons = Array.from(navButtons);
            const currentIndex = buttons.indexOf(activeButton);
            
            let newIndex;
            if (e.key === 'ArrowLeft') {
                newIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
            } else {
                newIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
            }
            
            buttons[newIndex].click();
        }
    });

    // Add copy functionality for important tips
    const copyButtons = document.querySelectorAll('.copy-tip');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const text = this.previousElementSibling.textContent;
            navigator.clipboard.writeText(text).then(() => {
                this.textContent = 'Copied!';
                setTimeout(() => {
                    this.textContent = 'Copy';
                }, 2000);
            });
        });
    });

    // Track user engagement
    let timeSpent = 0;
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', function() {
        timeSpent = Date.now() - startTime;
        localStorage.setItem('education_time_spent', timeSpent);
    });

    // Load previous progress if any
    const savedProgress = localStorage.getItem('education_progress');
    if (savedProgress) {
        const completedItems = JSON.parse(savedProgress);
        completedItems.forEach(index => {
            if (actionItems[index]) {
                actionItems[index].classList.add('completed');
            }
        });
    }

    // Save progress
    function saveProgress() {
        const completedIndices = [];
        actionItems.forEach((item, index) => {
            if (item.classList.contains('completed')) {
                completedIndices.push(index);
            }
        });
        localStorage.setItem('education_progress', JSON.stringify(completedIndices));
    }

    // Auto-save progress
    actionItems.forEach(item => {
        item.addEventListener('click', saveProgress);
    });
});

// Utility functions for education
const EducationUtils = {
    // Calculate compound interest
    calculateCompoundInterest: (principal, rate, time, compound = 12) => {
        return principal * Math.pow((1 + rate / compound), compound * time);
    },

    // Calculate FIRE number
    calculateFIRE: (annualExpenses, withdrawalRate = 0.04) => {
        return annualExpenses / withdrawalRate;
    },

    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Calculate debt payoff time
    calculateDebtPayoff: (balance, rate, payment) => {
        const monthlyRate = rate / 12 / 100;
        const months = -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate);
        return Math.ceil(months);
    }
};

// Export for use in other scripts
window.EducationUtils = EducationUtils;
