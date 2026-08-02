/* ============================================================
   XTOPIA Brand Portal — Downloads / Asset Library
   Renders from window.XT_DL (js/downloads-data.js).

   Cards are built into the DOM once, then search / filter / sort
   only toggle visibility and CSS `order` — no re-rendering, so
   lazy-loaded previews are never discarded.
   ============================================================ */
(function () {
  const DATA = window.XT_DL;
  const root = document.getElementById('dl-root');
  if (!DATA || !root) return;

  const { cats, assets } = DATA;
  const VIEW_KEY = 'xt-dl-view';

  /* ── helpers ─────────────────────────────────────────────── */
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(b < 10485760 ? 1 : 0) + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
  }
  function fmtDate(iso) {
    const p = iso.split('-');
    return MONTHS[+p[1] - 1] + ' ' + p[0];
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  /* Pick a preview backdrop that keeps the artwork legible.
     Dark artwork is checked first so "black outline" is not mistaken
     for the white-outline lockup. */
  function surface(a) {
    if (!a.prev) return 'dark';
    const s = a.p + ' ' + a.n;
    if (/black|dark/i.test(s)) return 'light';
    if (/white|cream|outline/i.test(s)) return 'dark';
    return 'light';
  }

  const ICONS = {
    dl:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 5 5-5M4 21h16"/></svg>',
    eye:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3.2"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 6.5L21 6"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/></svg>',
    x:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    ok:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>',
    empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M8.5 11h5"/></svg>',
  };

  /* ── build the cards once ────────────────────────────────── */
  const nodes = [];   // { el, cat, a, hay }

  cats.forEach(cat => {
    const list = assets.filter(a => a.c === cat.name);
    if (!list.length) return;

    const block = document.createElement('div');
    block.className = 'dl-cat';
    block.innerHTML =
      '<div class="dl-cat-head">' +
        '<span class="dl-cat-name">' + esc(cat.name) + '</span>' +
        '<span class="dl-cat-count" data-count>' + list.length + ' assets</span>' +
        '<span class="dl-cat-desc">' + esc(cat.desc) + '</span>' +
      '</div>' +
      '<div class="dl-items"></div>';

    const wrap = block.querySelector('.dl-items');
    wrap.dataset.view = 'grid';

    list.forEach(a => {
      const card = document.createElement('article');
      card.className = 'dl-card';

      const media = a.prev
        ? '<img src="' + encodeURI(a.p) + '" alt="' + esc(a.n) + '" loading="lazy" decoding="async">'
        : '<div class="dl-glyph">' + ICONS.file + '<span>' + esc(a.e) + '</span></div>';

      /* Request-only assets get a mailto action instead of a download link. */
      const actions = a.req
        ? '<a class="dl-act dl-act--primary" href="mailto:brand@xtopia.life?subject=' +
            encodeURIComponent('Asset request — ' + a.n) +
            '" aria-label="Request ' + esc(a.n) + ' by email">' + ICONS.mail + '<span>Request</span></a>'
        : (a.prev
            ? '<button class="dl-act" type="button" data-preview aria-label="Preview ' + esc(a.n) + '">' +
                ICONS.eye + '<span>Preview</span></button>'
            : '') +
          '<a class="dl-act dl-act--primary" href="' + encodeURI(a.p) + '" download data-dl' +
            ' aria-label="Download ' + esc(a.n) + '">' + ICONS.dl + '<span>Download</span></a>' +
          '<button class="dl-act dl-act--icon" type="button" data-copy aria-label="Copy link to ' +
            esc(a.n) + '">' + ICONS.link + '</button>';

      const dims = a.w ? '<span class="dl-dot">·</span>' + a.w + '×' + a.h : '';
      const flag = a.req ? '<span class="dl-req">On request</span>' : '';

      card.innerHTML =
        '<div class="dl-preview dl-preview--' + surface(a) + '">' + media +
          '<div class="dl-actions">' + actions + '</div>' +
        '</div>' +
        '<div class="dl-info">' +
          '<span class="dl-name">' + esc(a.n) + '</span>' +
          '<span class="dl-meta">' +
            '<span class="dl-fmt">' + esc(a.e) + '</span>' + flag +
            fmtSize(a.s) + dims +
            '<span class="dl-dot">·</span>' + fmtDate(a.u) +
          '</span>' +
        '</div>';

      card._asset = a;
      wrap.appendChild(card);

      nodes.push({
        el: card, cat: block, a,
        hay: (a.n + ' ' + a.e + ' ' + a.c + ' ' + a.p).toLowerCase(),
      });
    });

    root.appendChild(block);
  });

  /* ── controls ────────────────────────────────────────────── */
  const search   = document.getElementById('dl-search');
  const clearBtn = document.getElementById('dl-search-clear');
  const chipWrap = document.getElementById('dl-chips');
  const sortSel  = document.getElementById('dl-sort');
  const empty    = document.getElementById('dl-empty');
  const viewBtns = [...document.querySelectorAll('.dl-view-btn')];

  /* Chips are generated from the data — categories, then formats. */
  const formats = [...new Set(assets.map(a => a.e))].sort();
  const chipDefs = [{ k: 'all', label: 'All', n: assets.length }]
    .concat(cats.map(c => ({
      k: 'c:' + c.name, label: c.name,
      n: assets.filter(a => a.c === c.name).length,
    })))
    .concat(formats.map(f => ({
      k: 'e:' + f, label: f,
      n: assets.filter(a => a.e === f).length,
    })));

  chipWrap.innerHTML = chipDefs.map((c, i) =>
    '<button class="dl-chip" type="button" data-k="' + esc(c.k) + '" aria-pressed="' +
    (i === 0) + '">' + esc(c.label) + '<span class="dl-chip-n">' + c.n + '</span></button>'
  ).join('');
  const chips = [...chipWrap.querySelectorAll('.dl-chip')];

  let state = { q: '', filter: 'all', sort: 'az' };
  let lastKey = null;   // memoise: skip work when nothing changed

  const SORTS = {
    az:      (x, y) => x.a.n.localeCompare(y.a.n),
    newest:  (x, y) => y.a.u.localeCompare(x.a.u) || x.a.n.localeCompare(y.a.n),
    oldest:  (x, y) => x.a.u.localeCompare(y.a.u) || x.a.n.localeCompare(y.a.n),
    largest: (x, y) => y.a.s - x.a.s,
    smallest:(x, y) => x.a.s - y.a.s,
  };

  function apply() {
    const key = state.q + '|' + state.filter + '|' + state.sort;
    if (key === lastKey) return;
    lastKey = key;

    const q = state.q.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    const f = state.filter;

    let shown = 0;
    const perCat = new Map();

    nodes.forEach(n => {
      let ok = true;
      if (f !== 'all') {
        ok = f.startsWith('c:') ? n.a.c === f.slice(2) : n.a.e === f.slice(2);
      }
      if (ok && terms.length) ok = terms.every(t => n.hay.includes(t));

      n.el.hidden = !ok;
      if (ok) {
        shown++;
        perCat.set(n.cat, (perCat.get(n.cat) || 0) + 1);
      }
    });

    /* Reorder in place via CSS `order` rather than moving DOM nodes. */
    const visible = nodes.filter(n => !n.el.hidden).sort(SORTS[state.sort]);
    visible.forEach((n, i) => { n.el.style.order = i; });

    /* Hide empty categories and refresh their counts. */
    document.querySelectorAll('.dl-cat').forEach(c => {
      const n = perCat.get(c) || 0;
      c.hidden = n === 0;
      const badge = c.querySelector('[data-count]');
      if (badge) badge.textContent = n + (n === 1 ? ' asset' : ' assets');
    });

    empty.classList.toggle('on', shown === 0);
    clearBtn.classList.toggle('on', state.q !== '');
  }

  /* Search — instant, no submit. */
  search.addEventListener('input', () => { state.q = search.value; apply(); });
  search.addEventListener('keydown', e => {
    if (e.key === 'Escape' && search.value) { search.value = ''; state.q = ''; apply(); }
  });
  clearBtn.addEventListener('click', () => {
    search.value = ''; state.q = ''; apply(); search.focus();
  });

  /* Filter chips — single active filter. */
  chipWrap.addEventListener('click', e => {
    const chip = e.target.closest('.dl-chip');
    if (!chip) return;
    state.filter = chip.dataset.k;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    apply();
  });

  sortSel.addEventListener('change', () => { state.sort = sortSel.value; apply(); });

  /* View mode — persisted. */
  function setView(v) {
    document.querySelectorAll('.dl-items').forEach(w => { w.dataset.view = v; });
    viewBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    try { localStorage.setItem(VIEW_KEY, v); } catch (_) {}
  }
  viewBtns.forEach(b => b.addEventListener('click', () => setView(b.dataset.v)));
  let saved = 'grid';
  try { saved = localStorage.getItem(VIEW_KEY) || 'grid'; } catch (_) {}
  setView(saved === 'list' ? 'list' : 'grid');

  document.getElementById('dl-reset').addEventListener('click', () => {
    search.value = '';
    state = { q: '', filter: 'all', sort: sortSel.value };
    chips.forEach((c, i) => c.setAttribute('aria-pressed', String(i === 0)));
    apply();
    search.focus();
  });

  /* ── toast ───────────────────────────────────────────────── */
  const toast = document.getElementById('dl-toast');
  const toastMsg = toast.querySelector('span');
  let toastT;
  function say(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('on'), 2600);
  }

  /* ── modal ───────────────────────────────────────────────── */
  const modal = document.getElementById('dl-modal');
  const mStage = modal.querySelector('.dl-modal-stage');
  const mImg   = modal.querySelector('.dl-modal-stage img');
  const mName  = modal.querySelector('.dl-modal-name');
  const mMeta  = modal.querySelector('.dl-modal-meta');
  const mGet   = modal.querySelector('[data-modal-dl]');
  let lastFocus = null;

  function openModal(a) {
    lastFocus = document.activeElement;
    mImg.src = encodeURI(a.p);
    mImg.alt = a.n;
    mName.textContent = a.n;
    mMeta.textContent = [a.e, fmtSize(a.s), a.w ? a.w + ' × ' + a.h : null,
                         a.c, 'Updated ' + fmtDate(a.u)].filter(Boolean).join('  ·  ');
    mGet.href = encodeURI(a.p);
    mGet.setAttribute('download', '');
    mStage.classList.remove('zoom');
    modal.classList.add('on');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.dl-modal-close').focus();
  }
  function closeModal() {
    modal.classList.remove('on');
    document.body.style.overflow = '';
    mImg.src = '';
    if (lastFocus) lastFocus.focus();
  }

  modal.querySelector('.dl-modal-close').addEventListener('click', closeModal);
  modal.querySelector('.dl-modal-bg').addEventListener('click', closeModal);
  mStage.addEventListener('click', e => {
    if (e.target === mImg) mStage.classList.toggle('zoom');
  });
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('on')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') {
      /* Simple focus trap across the modal's interactive elements. */
      const f = [...modal.querySelectorAll('button, a[href]')].filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  mGet.addEventListener('click', () => say('Download started'));

  /* ── card actions (delegated) ────────────────────────────── */
  root.addEventListener('click', e => {
    const card = e.target.closest('.dl-card');
    if (!card) return;
    const a = card._asset;

    if (e.target.closest('[data-preview]')) { openModal(a); return; }
    if (e.target.closest('[data-dl]'))      { say('Download started'); return; }

    const copy = e.target.closest('[data-copy]');
    if (copy) {
      const url = new URL(a.p, location.href).href;
      const done = () => say('Link copied');
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(done, () => say('Copy failed'));
      } else {
        const t = document.createElement('textarea');
        t.value = url; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); done(); } catch (_) { say('Copy failed'); }
        document.body.removeChild(t);
      }
    }
  });

  /* ── stats ───────────────────────────────────────────────── */
  const totalBytes = assets.reduce((s, a) => s + a.s, 0);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('dl-n-assets', assets.length);
  set('dl-n-cats',   cats.length);
  set('dl-n-fmts',   formats.length);
  set('dl-n-size',   fmtSize(totalBytes));

  apply();
})();
