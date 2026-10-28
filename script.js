// Portfolio interactions — plain JavaScript, no libraries.
"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Particle field (hero background) ----------
   Sparse particles drift and link up when close, like a little graph/network.
   The cursor acts as a point charge: it attracts particles, and a click
   flips the sign so they're repelled instead. */
(function particleField() {
  const canvas = document.getElementById("field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ACCENT = [245, 154, 74];
  const COOL = [124, 200, 240];
  const LINK_DIST = 110;

  let w, h, dpr, particles = [];
  const mouse = { x: -9999, y: -9999, charge: 1, active: false };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // density scales with area, capped so phones stay smooth
    const count = Math.min(70, Math.floor((w * h) / 18000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.2 + 0.5,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const col = mouse.charge > 0 ? ACCENT : COOL;

    for (const p of particles) {
      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d2 = dx * dx + dy * dy + 400; // softening avoids the 1/r² blow-up
        if (d2 < 220 * 220) {
          const f = (mouse.charge * 40) / d2; // inverse-square force
          p.vx += f * dx;
          p.vy += f * dy;
        }
      }
      // gentle damping + random kick keeps the motion lively but bounded
      p.vx = p.vx * 0.985 + (Math.random() - 0.5) * 0.015;
      p.vy = p.vy * 0.985 + (Math.random() - 0.5) * 0.015;
      p.x += p.vx;
      p.y += p.vy;
      // wrap around the edges
      if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
      if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
    }

    // links between nearby particles
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${(1 - d / LINK_DIST) * 0.12})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // the particles themselves
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.45)`;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!reducedMotion) requestAnimationFrame(step);
  }

  const hero = canvas.parentElement;
  hero.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  hero.addEventListener("pointerleave", () => { mouse.active = false; });
  hero.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    mouse.charge *= -1;
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reducedMotion) step(); }, 150);
  });

  resize();
  step();
})();

/* ---------- Navigation: scrolled style, active link, mobile menu ---------- */
(function nav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a") && links.classList.contains("is-open")) toggle.click();
  });

  // highlight the link of the section currently in view
  const navLinks = [...links.querySelectorAll('a[href^="#"]')];
  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id));
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("section[id]").forEach((s) => spy.observe(s));
})();

/* ---------- Scroll reveal ---------- */
(function reveal() {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  document.querySelectorAll(".reveal").forEach((el, idx) => {
    el.style.transitionDelay = `${(idx % 3) * 60}ms`; // small stagger inside rows
    io.observe(el);
  });
})();

document.getElementById("year").textContent = new Date().getFullYear();
