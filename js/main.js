/* ============================================================
   XTOPIA Brand Portal — Main JS
   ============================================================ */

function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  html.setAttribute('data-theme', isLight ? 'dark' : 'light');
  document.getElementById('tt-dark').innerHTML  = isLight ? '<b>Dark</b>' : 'Dark';
  document.getElementById('tt-light').innerHTML = isLight ? 'Light' : '<b>Light</b>';
  /* Switch motion videos between dark/light versions */
  const goingLight = !isLight;
  document.querySelectorAll('.vid-dark').forEach(v => {
    if (goingLight) { v.pause(); } else { v.currentTime = 0; v.play(); }
  });
  document.querySelectorAll('.vid-light').forEach(v => {
    if (goingLight) { v.currentTime = 0; v.play(); } else { v.pause(); }
  });
}

function replayMotionVid(name) {
  const stage = document.getElementById('stage-' + name);
  if (!stage) return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const vid = stage.querySelector(isLight ? '.vid-light' : '.vid-dark');
  if (vid) { vid.currentTime = 0; vid.play(); }
}

/* Active nav highlight on scroll */
(function () {
  const links    = document.querySelectorAll('.sidebar nav a');
  const sections = [...links].map(l => document.querySelector(l.getAttribute('href')));

  window.addEventListener('scroll', () => {
    let idx = 0;
    sections.forEach((s, i) => {
      if (s && s.getBoundingClientRect().top < 140) idx = i;
    });
    links.forEach(l => l.classList.remove('active'));
    if (links[idx]) links[idx].classList.add('active');
  });

  /* Close mobile sidebar when a nav link is clicked */
  links.forEach(l =>
    l.addEventListener('click', () =>
      document.querySelector('.sidebar').classList.remove('open')
    )
  );
})();

/* Mobile menu toggle */
document.querySelector('.menu-btn')?.addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});

/* ============================================================
   Animation System — IntersectionObserver
   ============================================================ */
(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Mark all sections with section-header-reveal ── */
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.add('section-header-reveal');
  });

  /* ── 2. Generic reveal / stagger observer ── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll(
    '.reveal, .reveal-fade, .reveal-left, .stagger-children, .section-header-reveal, .wm-hero-pills'
  ).forEach(el => revealObs.observe(el));

  /* ── 3. Construction rules staggered slide-in ── */
  const constRulesWrap = document.querySelector('.wm-const-rules');
  if (constRulesWrap) {
    const rules = constRulesWrap.querySelectorAll('.wm-const-rule');
    const rulesObs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      rules.forEach((r, i) => {
        setTimeout(() => r.classList.add('rule-visible'), i * 90);
      });
      rulesObs.disconnect();
    }, { threshold: 0.25 });
    rulesObs.observe(constRulesWrap);
  }

  /* ── 4. Timing bars — animate from 0 to their stored width ── */
  const timingBars = document.querySelectorAll('.timing-bar-fill');
  timingBars.forEach(bar => {
    /* Store the inline width then reset to 0 */
    const naturalWidth = bar.style.width || bar.getAttribute('data-width') || '0%';
    bar.dataset.targetWidth = naturalWidth;
    if (!reducedMotion) bar.style.width = '0%';
  });

  const barsObs = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    timingBars.forEach((bar, i) => {
      setTimeout(() => {
        bar.style.width = bar.dataset.targetWidth;
      }, 200 + i * 120);
    });
    barsObs.disconnect();
  }, { threshold: 0.3 });

  const timingSection = document.querySelector('.motion-timing');
  if (timingSection) barsObs.observe(timingSection);

  /* ── 5. Stats strip: count-up animation ── */
  const statsObs = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    document.querySelectorAll('.stat .n').forEach((el, i) => {
      setTimeout(() => {
        el.style.animation = 'xt-scale-in .5s cubic-bezier(0.34,1.56,0.64,1) both';
      }, i * 60);
    });
    statsObs.disconnect();
  }, { threshold: 0.4 });
  const statsStrip = document.querySelector('.stats-strip');
  if (statsStrip) statsObs.observe(statsStrip);

  /* ── 6. BIU card subtle tilt on mousemove ── */
  document.querySelectorAll('.biu-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (reducedMotion) return;
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width  / 2);
      const dy    = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `translateY(-5px) perspective(700px) rotateX(${-dy * 2.5}deg) rotateY(${dx * 2.5}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── 7. Letterform cells: interactive draw effect ── */
  document.querySelectorAll('.lf-cell').forEach(cell => {
    cell.setAttribute('tabindex', '0');
  });

  /* ── 8. Wordmark hero — highlight blueprint lines on hover ── */
  const heroLeft = document.querySelector('.wm-hero-left');
  if (heroLeft) {
    heroLeft.addEventListener('mouseenter', () => {
      heroLeft.classList.add('hovered');
    });
    heroLeft.addEventListener('mouseleave', () => {
      heroLeft.classList.remove('hovered');
    });
  }

  /* ── 9. Nash-style spotlight: cursor → --mx / --my per card ── */
  if (!reducedMotion) {
    const spotCards = document.querySelectorAll('.wm-bcard, .biu-card, .motion-card');
    spotCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (((e.clientX - rect.left) / rect.width)  * 100).toFixed(1) + '%';
        const y = (((e.clientY - rect.top)  / rect.height) * 100).toFixed(1) + '%';
        card.style.setProperty('--mx', x);
        card.style.setProperty('--my', y);
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      });
    });
  }

})();
