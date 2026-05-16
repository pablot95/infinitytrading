(function () {
  'use strict';

  const nav = document.getElementById('nav');
  const toggle = document.querySelector('.nav__toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.nav__mobile-link, .nav__mobile a');
  const canvas = document.getElementById('heroCanvas');
  const revealEls = document.querySelectorAll('.reveal');

  function initNav() {
    let lastScroll = 0;

    window.addEventListener('scroll', function () {
      const current = window.scrollY;
      if (current > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      lastScroll = current;
    }, { passive: true });

    toggle.addEventListener('click', function () {
      const isOpen = toggle.classList.contains('active');
      toggle.classList.toggle('active');
      toggle.setAttribute('aria-expanded', String(!isOpen));
      if (isOpen) {
        mobileMenu.hidden = true;
        document.body.style.overflow = '';
      } else {
        mobileMenu.hidden = false;
        document.body.style.overflow = 'hidden';
      }
    });

    mobileLinks.forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.hidden) {
        closeMobileMenu();
      }
    });
  }

  function closeMobileMenu() {
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    mobileMenu.hidden = true;
    document.body.style.overflow = '';
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        const navHeight = nav.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  function initReveal() {
    if (!window.IntersectionObserver) {
      revealEls.forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initCanvas() {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height, raf;
    let time = 0;

    const candles = [];
    const NUM_CANDLES = 32;

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      buildCandles();
    }

    function buildCandles() {
      candles.length = 0;
      const spacing = width / (NUM_CANDLES + 1);
      let price = height * 0.5;

      for (let i = 0; i < NUM_CANDLES; i++) {
        const move = (Math.random() - 0.48) * height * 0.06;
        const open = price;
        price += move;
        const close = price;
        const high = Math.max(open, close) + Math.random() * height * 0.02;
        const low = Math.min(open, close) - Math.random() * height * 0.02;
        const bullish = close >= open;

        candles.push({
          x: spacing * (i + 1),
          open,
          close,
          high,
          low,
          bullish,
          opacity: 0,
          targetOpacity: 0.12 + Math.random() * 0.12
        });
      }
    }

    function drawGrid() {
      const rows = 6;
      const cols = 8;
      ctx.strokeStyle = 'rgba(18, 107, 255, 0.04)';
      ctx.lineWidth = 0.5;

      for (let i = 0; i <= rows; i++) {
        const y = (height / rows) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      for (let i = 0; i <= cols; i++) {
        const x = (width / cols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    function drawCandles(t) {
      candles.forEach(function (c, i) {
        const delay = i * 3;
        if (t < delay) return;

        c.opacity = Math.min(c.opacity + 0.008, c.targetOpacity);

        const candleWidth = Math.max(4, (width / NUM_CANDLES) * 0.4);
        const color = c.bullish
          ? 'rgba(18, 107, 255, ' + c.opacity + ')'
          : 'rgba(255, 0, 60, ' + c.opacity + ')';

        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(c.x, c.high);
        ctx.lineTo(c.x, c.low);
        ctx.stroke();

        ctx.fillStyle = color;
        const bodyTop = Math.min(c.open, c.close);
        const bodyH = Math.max(2, Math.abs(c.close - c.open));
        ctx.fillRect(c.x - candleWidth / 2, bodyTop, candleWidth, bodyH);
      });
    }

    function drawPriceLine(t) {
      const points = 120;
      const amplitude = height * 0.12;
      const centerY = height * 0.45;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(18, 107, 255, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(18, 107, 255, 0.4)';
      ctx.shadowBlur = 6;

      for (let i = 0; i <= points; i++) {
        const x = (width / points) * i;
        const y = centerY
          + Math.sin(i * 0.18 + t * 0.012) * amplitude * 0.6
          + Math.sin(i * 0.07 + t * 0.007) * amplitude * 0.4
          + Math.cos(i * 0.31 + t * 0.018) * amplitude * 0.25;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      time++;
      drawGrid();
      drawCandles(time);
      drawPriceLine(time);
      raf = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', function () {
      cancelAnimationFrame(raf);
      resize();
      tick();
    });

    tick();
  }

  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', function () {
      const scrolled = window.scrollY;
      if (scrolled > window.innerHeight) return;
      const glow = hero.querySelector('.hero__glow');
      if (glow) {
        glow.style.transform = 'translateX(-50%) translateY(' + scrolled * 0.15 + 'px)';
      }
    }, { passive: true });
  }

  function initMagneticButtons() {
    document.querySelectorAll('.btn--primary.btn--xl, .btn--primary.btn--lg').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + x * 0.12 + 'px, ' + y * 0.12 + 'px) translateY(-1px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link');

    window.addEventListener('scroll', function () {
      let current = '';
      sections.forEach(function (section) {
        const top = section.offsetTop - nav.offsetHeight - 60;
        if (window.scrollY >= top) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(function (link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
          link.classList.add('active');
        }
      });
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initSmoothScroll();
    initReveal();
    initCanvas();
    initHeroParallax();
    initMagneticButtons();
    initActiveNavLink();
  });
}());
