document.addEventListener('DOMContentLoaded', function () {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function () {
            nav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (event) {
        if (!nav.contains(event.target) && !mobileMenuBtn.contains(event.target) && nav.classList.contains('active')) {
            nav.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });

    // Header Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
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
                // Close mobile menu if open
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    mobileMenuBtn.classList.remove('active');
                }
            }
        });
    });

    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    // Initialize Trust Bar Swiper
    if (document.querySelector('.trust-swiper')) {
        new Swiper('.trust-swiper', {
            slidesPerView: 3,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 2000,
                disableOnInteraction: false,
            },
            breakpoints: {
                640: {
                    slidesPerView: 4,
                    spaceBetween: 40,
                },
                768: {
                    slidesPerView: 5,
                    spaceBetween: 50,
                },
                1024: {
                    slidesPerView: 6,
                    spaceBetween: 60,
                },
            }
        });
    }

    // Initialize Fleet Swiper
    if (document.querySelector('.fleet-swiper')) {
        new Swiper('.fleet-swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                },
                1024: {
                    slidesPerView: 3,
                },
            }
        });
    }
});
