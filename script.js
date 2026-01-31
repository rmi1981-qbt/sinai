document.addEventListener('DOMContentLoaded', () => {

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Select all elements to animate
    const animateElements = document.querySelectorAll('.fade-in, .slide-up, .slide-left, .slide-right');

    animateElements.forEach(el => {
        observer.observe(el);
    });

    // Smooth Scroll for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(2, 12, 27, 0.95)';
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
        } else {
            navbar.style.background = 'rgba(2, 12, 27, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

});

// Modal Logic
function openContactModal() {
    document.getElementById('contactModal').style.display = 'flex';
}

function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
}

// Lightbox Logic
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightbox.style.display = 'block';
    lightboxImg.src = src;
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('contactModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
