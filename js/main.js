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

/* ── Copy-hex buttons on the Color palette cards ── */
(function () {
  const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>';
  const COPY_ICON  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  document.querySelectorAll('.cb-copy').forEach(btn => {
    const hex = btn.dataset.hex;
    let revertTimer;

    function showCopied() {
      clearTimeout(revertTimer);
      btn.classList.add('copied');
      btn.querySelector('svg').outerHTML = CHECK_ICON;
      btn.setAttribute('aria-label', 'Copied ' + hex);
      revertTimer = setTimeout(() => {
        btn.classList.remove('copied');
        btn.querySelector('svg').outerHTML = COPY_ICON;
        btn.setAttribute('aria-label', 'Copy hex code ' + hex);
      }, 1600);
    }

    function fallbackCopy() {
      const t = document.createElement('textarea');
      t.value = hex; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); showCopied(); } catch (_) {}
      document.body.removeChild(t);
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navigator.clipboard && window.isSecureContext) {
        /* Permission can be denied even in a real browser (unfocused
           page, blocked by policy) — always fall back rather than
           leave the click with no feedback at all. */
        navigator.clipboard.writeText(hex).then(showCopied, fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  });
})();

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

  const revealTargets = document.querySelectorAll(
    '.reveal, .reveal-fade, .reveal-left, .stagger-children, .section-header-reveal, .wm-hero-pills'
  );
  revealTargets.forEach(el => revealObs.observe(el));

  /* Safety net: sections whose content loads asynchronously (Downloads
     renders 50+ cards after this observer already attached) can grow
     tall enough, or shift enough, that the one-shot IntersectionObserver
     callback is missed — landing on a hash link or a fast programmatic
     scroll are the common triggers. Without this, the eyebrow/title/lede
     stay at opacity:0 forever, since nothing else ever retries. This
     force-reveals anything already on-screen, independent of whether
     the primary observer fired. */
  function forceRevealOnScreen() {
    revealTargets.forEach(el => {
      if (el.classList.contains('visible')) return;
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        el.classList.add('visible');
      }
    });
  }
  window.addEventListener('load', forceRevealOnScreen);
  window.addEventListener('hashchange', () => setTimeout(forceRevealOnScreen, 350));
  window.addEventListener('scroll', forceRevealOnScreen, { passive: true });
  forceRevealOnScreen();

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
    const spotCards = document.querySelectorAll('.wm-bcard, .biu-card, .motion-card, .illus-item');
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
