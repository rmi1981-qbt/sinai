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

    // Renderiza a galeria dinamicamente usando fotos-data.js
    const galleryContainer = document.getElementById('dynamic-gallery');
    if (galleryContainer && typeof FOTOS_CELULA !== 'undefined') {
        FOTOS_CELULA.forEach(fotoUrl => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            
            const img = document.createElement('img');
            img.src = `assets/images/fotos/${fotoUrl}`;
            img.alt = "Galeria Sinai";
            
            // Se a imagem tiver sido apagada da pasta, ela dará erro ao carregar.
            // Quando esse erro acontecer, removemos o quadrado dela do carrossel silenciosamente.
            img.onerror = function() {
                item.remove();
            };

            item.appendChild(img);
            
            // Adiciona o click do lightbox
            item.onclick = function() {
                openLightbox(img.src);
            };

            galleryContainer.appendChild(item);
        });

        // Configura Setas do Carrossel
        const wrapper = document.querySelector('.gallery-carousel-wrapper');
        const btnPrev = document.getElementById('carousel-prev');
        const btnNext = document.getElementById('carousel-next');

        if (wrapper && btnPrev && btnNext) {
            btnPrev.addEventListener('click', () => {
                wrapper.scrollBy({ left: -320, behavior: 'smooth' }); // Move 320px pra esquerda
            });
            btnNext.addEventListener('click', () => {
                wrapper.scrollBy({ left: 320, behavior: 'smooth' }); // Move 320px pra direita
            });
        }
    }

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
