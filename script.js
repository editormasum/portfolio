/* ====================================================================
   MASUM — VIDEO EDITOR PORTFOLIO
   All Interactive Behaviors — Bug-free, File:// Compatible
   ==================================================================== */

(function () {
    'use strict';

    // Wait for DOM
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        setupAnimatedSquares();
        setupCursorGlow();
        setupNav();
        setupReveal();
        setupStatBars();
        setupTabs();
        setupShowreel();
        setupVideoCards();
        setupSmoothScroll();
        setupParallax();
        triggerHeroAnimations();
    }

    /* ──────────── ANIMATED SQUARES BACKGROUND ──────────── */
    function setupAnimatedSquares() {
        var canvas = document.getElementById('bgSquares');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var squares = [];
        var count = 20; // Optimized count for performance

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        // Create squares with random properties
        for (var i = 0; i < count; i++) {
            squares.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 20 + Math.random() * 80,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.003,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.2 - 0.1,
                opacity: 0.015 + Math.random() * 0.04,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.005 + Math.random() * 0.01,
                borderOnly: Math.random() > 0.4,
                color: Math.random() > 0.8 ? 'rgba(245,158,11,' : 'rgba(16,185,129,'
            });
        }

        function draw() {
            if (document.body.classList.contains('video-playing')) {
                requestAnimationFrame(draw);
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (var i = 0; i < squares.length; i++) {
                var s = squares[i];

                s.x += s.vx;
                s.y += s.vy;
                s.rotation += s.rotSpeed;
                s.pulsePhase += s.pulseSpeed;

                var pulsedOpacity = s.opacity * (0.5 + 0.5 * Math.sin(s.pulsePhase));

                if (s.x < -s.size) s.x = canvas.width + s.size;
                if (s.x > canvas.width + s.size) s.x = -s.size;
                if (s.y < -s.size) s.y = canvas.height + s.size;
                if (s.y > canvas.height + s.size) s.y = -s.size;

                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.rotation);
                var r = s.size * 0.12; 

                if (s.borderOnly) {
                    ctx.strokeStyle = s.color + pulsedOpacity + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.roundRect(-s.size / 2, -s.size / 2, s.size, s.size, r);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = s.color + pulsedOpacity + ')';
                    ctx.beginPath();
                    ctx.roundRect(-s.size / 2, -s.size / 2, s.size, s.size, r);
                    ctx.fill();
                }
                ctx.restore();
            }
            requestAnimationFrame(draw);
        }
        draw();
    }


    /* ──────────── CURSOR GLOW ──────────── */
    function setupCursorGlow() {
        var glow = document.getElementById('cursorGlow');
        if (!glow) return;
        var mx = 0, my = 0, gx = 0, gy = 0;

        document.addEventListener('mousemove', function (e) {
            mx = e.clientX;
            my = e.clientY;
            if (!glow.classList.contains('on')) glow.classList.add('on');
        });
        document.addEventListener('mouseleave', function () {
            glow.classList.remove('on');
        });

        (function loop() {
            if (!document.body.classList.contains('video-playing')) {
                gx += (mx - gx) * 0.07;
                gy += (my - gy) * 0.07;
                glow.style.transform = 'translate3d(' + gx + 'px, ' + gy + 'px, 0) translate(-50%, -50%)';
            }
            requestAnimationFrame(loop);
        })();
    }

    /* ──────────── NAVIGATION ──────────── */
    function setupNav() {
        var nav = document.getElementById('nav');
        var toggle = document.getElementById('navToggle');
        var menu = document.getElementById('navMenu');
        var links = document.querySelectorAll('.nav__link');

        // Scroll detection
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) nav.classList.add('nav--scroll');
            else nav.classList.remove('nav--scroll');
        }, { passive: true });

        // Mobile toggle
        toggle.addEventListener('click', function () {
            toggle.classList.toggle('open');
            menu.classList.toggle('open');
            document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
        });

        // Close on link click
        links.forEach(function (link) {
            link.addEventListener('click', function () {
                toggle.classList.remove('open');
                menu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });

        // Active link highlighting
        var sections = document.querySelectorAll('section[id]');
        window.addEventListener('scroll', function () {
            var sy = window.scrollY + 160;
            sections.forEach(function (s) {
                var top = s.offsetTop, bot = top + s.offsetHeight, id = s.id;
                links.forEach(function (l) {
                    if (!l.classList.contains('nav__cta')) {
                        if (l.getAttribute('href') === '#' + id) {
                            if (sy >= top && sy < bot) l.classList.add('active');
                            else l.classList.remove('active');
                        }
                    }
                });
            });
        }, { passive: true });
    }

    /* ──────────── SCROLL REVEAL ──────────── */
    function setupReveal() {
        var els = document.querySelectorAll('.anim-r');
        if (!els.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('on');
                    observer.unobserve(e.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

        els.forEach(function (el) { observer.observe(el); });
    }

    /* ──────────── STAT BARS ──────────── */
    function setupStatBars() {
        var fills = document.querySelectorAll('.stat__fill');
        if (!fills.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    var w = e.target.getAttribute('data-w');
                    setTimeout(function () { e.target.style.width = w + '%'; }, 250);
                    observer.unobserve(e.target);
                }
            });
        }, { threshold: 0.4 });

        fills.forEach(function (f) { observer.observe(f); });
    }

    /* ──────────── PORTFOLIO TABS ──────────── */
    function setupTabs() {
        var tabs = document.querySelectorAll('.tab');
        var grids = document.querySelectorAll('.grid');

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var target = tab.getAttribute('data-t');

                tabs.forEach(function (t) { t.classList.remove('tab--on'); });
                tab.classList.add('tab--on');

                grids.forEach(function (g) {
                    g.classList.remove('grid--on');
                    // Match grid id: gridReels, gridLong
                    var gridId = 'grid' + target.charAt(0).toUpperCase() + target.slice(1);
                    if (g.id === gridId) {
                        g.classList.add('grid--on');
                        // Re-trigger reveals inside the new grid
                        g.querySelectorAll('.anim-r:not(.on)').forEach(function (el, i) {
                            setTimeout(function () { el.classList.add('on'); }, i * 70);
                        });
                    }
                });
            });
        });
    }

    /* ──────────── SHOWREEL (Thumbnail → Embed) ──────────── */
    function setupShowreel() {
        var frame = document.getElementById('showreelFrame');
        if (!frame) return;

        frame.addEventListener('click', function () {
            var videoId = frame.getAttribute('data-video-id');
            if (!videoId) return;

            // Replace thumbnail with embedded iframe directly
            var iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&modestbranding=1';
            iframe.title = 'Showreel Video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';

            // Remove thumbnail and play button, insert iframe
            var thumb = frame.querySelector('.showreel__thumb');
            var playBtn = frame.querySelector('.showreel__play-btn');
            if (thumb) thumb.style.display = 'none';
            if (playBtn) playBtn.style.display = 'none';
            frame.appendChild(iframe);
            
            document.body.classList.add('video-playing');
        });
    }

    /* ──────────── VIDEO CARDS (Portfolio) ──────────── */
    function setupVideoCards() {
        document.querySelectorAll('.card[data-vid]').forEach(function (card) {
            card.addEventListener('click', function (e) {
                e.preventDefault();
                var videoId = card.getAttribute('data-vid');
                if (!videoId || card.classList.contains('is-playing')) return;
                
                card.classList.add('is-playing');
                document.body.classList.add('video-playing');
                
                var iframe = document.createElement('iframe');
                iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&modestbranding=1';
                iframe.title = 'Video Player';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.allowFullscreen = true;
                iframe.referrerPolicy = 'strict-origin-when-cross-origin';
                
                var thumb = card.querySelector('.card__thumb');
                thumb.innerHTML = '';
                thumb.appendChild(iframe);
            });
        });
    }

    /* ──────────── SMOOTH SCROLL ──────────── */
    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var href = a.getAttribute('href');
                if (href === '#') return;
                var target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    var navH = document.getElementById('nav').offsetHeight;
                    var pos = target.getBoundingClientRect().top + window.scrollY - navH - 16;
                    window.scrollTo({ top: pos, behavior: 'smooth' });
                }
            });
        });
    }

    /* ──────────── PARALLAX AMBIENT GLOWS ──────────── */
    function setupParallax() {
        var glows = document.querySelectorAll('.hero__glow');
        if (!glows.length) return;

        window.addEventListener('scroll', function () {
            var sy = window.scrollY;
            if (sy < window.innerHeight) {
                glows.forEach(function (g, i) {
                    g.style.transform = 'translateY(' + (sy * (i + 1) * 0.12) + 'px)';
                });
            }
        }, { passive: true });
    }

    /* ──────────── HERO STAGGER ──────────── */
    function triggerHeroAnimations() {
        setTimeout(function () {
            var heroAnims = document.querySelectorAll('.hero .anim');
            heroAnims.forEach(function (el) {
                var d = parseInt(el.getAttribute('data-d') || '0', 10) * 110;
                setTimeout(function () { el.classList.add('on'); }, d);
            });
        }, 150);
    }

})();
