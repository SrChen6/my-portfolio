// Portfolio interactions — plain JavaScript, no libraries.
"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Particle field (hero background) ----------
   Particles drift and link up when close, like a little graph/network.
   The cursor acts as a point charge: it attracts particles, and a click
   flips the sign so they're repelled instead. */
(function particleField() {
  const canvas = document.getElementById("field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const ACCENT = [255, 122, 26];
  const COOL = [76, 201, 240];
  const LINK_DIST = 120;

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
    const count = Math.min(140, Math.floor((w * h) / 9000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.6 + 0.6,
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
          const f = (mouse.charge * 60) / d2; // inverse-square force
          p.vx += f * dx;
          p.vy += f * dy;
        }
      }
      // gentle damping + random kick keeps the motion lively but bounded
      p.vx = p.vx * 0.985 + (Math.random() - 0.5) * 0.02;
      p.vy = p.vy * 0.985 + (Math.random() - 0.5) * 0.02;
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
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${(1 - d / LINK_DIST) * 0.25})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // the particles themselves
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.85)`;
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

/* ---------- Typing effect for the role line ---------- */
(function typing() {
  const el = document.getElementById("typed");
  if (!el) return;
  const roles = [
    "physics engineering student",
    "data science student",
    "machine learning tinkerer",
    "electromagnetism enjoyer",
    "turning data into pictures",
  ];
  if (reducedMotion) { el.textContent = roles[0]; return; }

  let r = 0, i = 0, deleting = false;
  function tick() {
    const word = roles[r];
    i += deleting ? -1 : 1;
    el.textContent = word.slice(0, i);
    let delay = deleting ? 35 : 70;
    if (!deleting && i === word.length) { delay = 1600; deleting = true; }
    else if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; delay = 300; }
    setTimeout(tick, delay);
  }
  tick();
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

/* ---------- Scroll reveal, skill bars and counters ---------- */
(function reveal() {
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    if (reducedMotion) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 1200;
    const frame = (t) => {
      const k = Math.min(1, (t - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      el.classList.add("is-visible");
      el.querySelectorAll(".bars li").forEach((li) => {
        li.querySelector("i").style.setProperty("--level", li.dataset.level + "%");
      });
      el.querySelectorAll("[data-count]").forEach(animateCount);
      io.unobserve(el);
    }
  }, { threshold: 0.15 });

  document.querySelectorAll(".reveal").forEach((el, idx) => {
    el.style.transitionDelay = `${(idx % 3) * 80}ms`; // small stagger inside rows
    io.observe(el);
  });
})();

/* ---------- Project filters ---------- */
(function filters() {
  const chips = document.querySelectorAll(".chip");
  const cards = document.querySelectorAll("#projectGrid .card");
  chips.forEach((chip) => chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.toggle("is-active", c === chip));
    const f = chip.dataset.filter;
    cards.forEach((card) => {
      const show = f === "all" || card.dataset.tags.split(" ").includes(f);
      card.classList.toggle("is-hidden", !show);
    });
  }));
})();

/* ---------- Card spotlight + subtle 3D tilt ---------- */
(function cards() {
  const canHover = window.matchMedia("(hover: hover)").matches;
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      if (canHover && !reducedMotion) {
        const rx = ((y / rect.height) - 0.5) * -6;
        const ry = ((x / rect.width) - 0.5) * 6;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      }
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
})();

document.getElementById("year").textContent = new Date().getFullYear();
