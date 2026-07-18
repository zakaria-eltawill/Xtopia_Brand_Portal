/* ============================================================
   XTOPIA Brand Portal — Main JS
   ============================================================ */

function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  html.setAttribute('data-theme', isLight ? 'dark' : 'light');
  document.getElementById('tt-dark').innerHTML  = isLight ? '<b>Dark</b>' : 'Dark';
  document.getElementById('tt-light').innerHTML = isLight ? 'Light' : '<b>Light</b>';
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
