(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const fancy = finePointer && !reduceMotion;

  /* ---------- Particles (click sparks + confetti) ---------- */
  const colors = ['#8b5cf6', '#ec4899', '#38bdf8', '#fbbf24', '#34d399'];
  const burst = (x, y, count, spread, confetti) => {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      const color = colors[Math.floor(Math.random() * colors.length)];
      el.className = confetti ? 'particle confetti' : 'particle';
      if (confetti) el.style.background = color;
      else { el.textContent = '✦'; el.style.color = color; }
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist = spread * (0.35 + Math.random() * 0.65);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist + (confetti ? spread * 0.6 : 0);
      el.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 720 - 360}deg) scale(0.3)`, opacity: 0 }
      ], {
        duration: (confetti ? 1000 : 550) + Math.random() * 500,
        easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)'
      }).onfinish = () => el.remove();
    }
  };
  const burstFrom = (el, count, spread) => {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, count, spread, true);
  };

  document.addEventListener('pointerdown', (e) => burst(e.clientX, e.clientY, 6, 46, false));

  /* ---------- Theme (circular reveal where supported) ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const switchTheme = () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  };
  themeToggle.addEventListener('click', () => {
    if (!document.startViewTransition || reduceMotion) return switchTheme();
    const r = themeToggle.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(switchTheme).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 600, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#nav')) setMenu(false);
  });

  /* ---------- Section squiggles + doodles ---------- */
  document.querySelectorAll('.section-head h2').forEach((h2) => {
    h2.insertAdjacentHTML('afterend',
      '<svg class="squiggle" viewBox="0 0 130 12" aria-hidden="true"><path pathLength="1" d="M2 7q8-8 16 0t16 0 16 0 16 0 16 0 16 0 16 0 14 0"/></svg>');
  });

  const shapes = {
    star: '<path d="m12 2 2.9 6.600 7.100.7-5.400 4.800 1.600 7L12 17.300l-6.200 3.800 1.600-7L2 9.300l7.100-.7Z"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    ring: '<circle cx="12" cy="12" r="8"/>',
    zig: '<path d="m2 12 4-6 4 12 4-12 4 12 4-6"/>',
    tri: '<path d="M12 4 21 19H3Z"/>'
  };
  // [shape, position, parallax speed, float instead of spin]
  const doodlePlan = {
    about: [['star', 'right:4%;top:8%', 0.12], ['zig', 'left:2%;bottom:6%', -0.08, true]],
    education: [['ring', 'right:8%;top:14%', -0.1, true]],
    skills: [['plus', 'left:3%;top:10%', 0.1], ['tri', 'right:3%;bottom:8%', -0.12]],
    projects: [['star', 'left:46%;top:6%', -0.08], ['ring', 'right:2%;top:40%', 0.14, true]],
    roadmap: [['zig', 'right:6%;top:9%', 0.1, true], ['plus', 'left:2%;bottom:5%', -0.1]]
  };
  const doodles = [];
  Object.entries(doodlePlan).forEach(([id, list]) => {
    const section = document.getElementById(id);
    if (!section) return;
    list.forEach(([shape, pos, speed, float]) => {
      const el = document.createElement('span');
      el.className = float ? 'doodle float' : 'doodle';
      el.style.cssText = pos;
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = `<svg viewBox="0 0 24 24">${shapes[shape]}</svg>`;
      section.prepend(el);
      doodles.push({ el, section, speed });
    });
  });

  /* ---------- Scroll: progress, nav hide, rocket, parallax ---------- */
  const progress = document.querySelector('.progress');
  const nav = document.getElementById('nav');
  const toTop = document.getElementById('toTop');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    const menuOpen = navLinks.classList.contains('open');
    nav.classList.toggle('hidden', !menuOpen && y > lastY && y > 320);
    toTop.classList.toggle('show', y > 500);

    if (!reduceMotion) {
      doodles.forEach(({ el, section, speed }) => {
        const r = section.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        el.style.transform = `translate3d(0, ${(r.top + r.height / 2 - innerHeight / 2) * speed}px, 0)`;
      });
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => {
    toTop.classList.add('launch');
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => toTop.classList.remove('launch'), 1100);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Active nav link ---------- */
  const links = [...navLinks.querySelectorAll('a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Typing effect ---------- */
  const typer = document.getElementById('typer');
  const roles = ['a CSE student.', 'an aspiring developer.', 'a curious learner.', 'a problem solver.'];
  const startTyping = () => {
    if (reduceMotion) { typer.textContent = roles[0]; return; }
    let r = 0, i = 0, deleting = false;
    const tick = () => {
      const word = roles[r];
      i += deleting ? -1 : 1;
      typer.textContent = word.slice(0, i);

      let delay = deleting ? 40 : 80;
      if (!deleting && i === word.length) { delay = 1700; deleting = true; }
      else if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; delay = 350; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 900);
  };

  /* ---------- Loader ---------- */
  const finishLoading = () => {
    if (root.classList.contains('loaded')) return;
    root.classList.add('loaded');
    startTyping();
  };
  window.addEventListener('load', () => setTimeout(finishLoading, 700));
  setTimeout(finishLoading, 3000);

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector('.cursor-glow');
  if (fancy) {
    let x = 0, y = 0, tx = 0, ty = 0, running = false;
    const follow = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) requestAnimationFrame(follow);
      else running = false;
    };
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('on');
      if (!running) { running = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener('mouseleave', () => glow.classList.remove('on'));
  }

  /* ---------- 3D tilt cards + magnetic buttons ---------- */
  if (fancy) {
    document.querySelectorAll('.card:not(.contact), .fact').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transition = 'transform 0.12s ease-out, border-color 0.3s ease, background-color 0.3s ease';
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-6px)`;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = '';
        el.style.transform = '';
      });
    });

    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Character + confetti ---------- */
  const avatar = document.getElementById('avatar');
  avatar.addEventListener('click', () => {
    burstFrom(avatar, 40, 220);
    avatar.classList.remove('cheer');
    void avatar.offsetWidth; // restart the jump animation
    avatar.classList.add('cheer');
  });
  document.getElementById('mailBtn').addEventListener('click', (e) => burstFrom(e.currentTarget, 30, 180));

  /* ---------- Cat: eyes follow the pointer ---------- */
  const cat = document.getElementById('cat');
  const pupils = [...cat.querySelectorAll('.pupil')];
  window.addEventListener('pointermove', (e) => {
    pupils.forEach((p) => {
      const r = p.previousElementSibling.getBoundingClientRect();
      const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
      p.style.transform = `translate(${Math.cos(a) * 3}px, ${Math.sin(a) * 3}px)`;
    });
  }, { passive: true });
  let talkTimer;
  const talk = () => {
    cat.classList.add('talk');
    clearTimeout(talkTimer);
    talkTimer = setTimeout(() => cat.classList.remove('talk'), 2200);
  };
  cat.addEventListener('pointerenter', talk);
  cat.addEventListener('click', talk);

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
