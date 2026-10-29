// Navigation and research content are static HTML; these are optional enhancements.
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Preserve bookmarks to sections on the former single-page website.
if (document.body.dataset.page === 'home') {
  const legacy = { '#about': 'about.html', '#research': 'research.html', '#outputs': 'publications.html', '#contact': 'contact.html' };
  const followLegacyLink = () => {
    const destination = legacy[window.location.hash];
    if (destination) window.location.replace(destination);
  };
  followLegacyLink();
  window.addEventListener('hashchange', followLegacyLink);
}

const menu = document.querySelector('.menu-toggle');
const nav = document.getElementById('primary-nav');
if (menu && nav) {
  document.documentElement.classList.add('nav-enhanced');
  menu.hidden = false;
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const isOpen = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('is-open', !isOpen);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
}

const search = document.getElementById('publication-search');
const yearFilter = document.getElementById('publication-year');
if (search && yearFilter) {
  const papers = Array.from(document.querySelectorAll('.publication'));
  const count = document.getElementById('publication-count');
  const empty = document.getElementById('publication-empty');
  const filter = () => {
    const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    papers.forEach((paper) => {
      const matchesText = words.every((word) => paper.textContent.toLocaleLowerCase().includes(word));
      const matchesYear = yearFilter.value === 'all' || paper.dataset.year === yearFilter.value;
      paper.hidden = !(matchesText && matchesYear);
      if (!paper.hidden) visible += 1;
    });
    count.textContent = `${visible} of ${papers.length} publication${papers.length === 1 ? '' : 's'}`;
    empty.hidden = visible !== 0;
  };
  document.querySelector('.publication-controls').hidden = false;
  count.hidden = false;
  search.addEventListener('input', filter);
  yearFilter.addEventListener('change', filter);
  document.getElementById('publication-reset').addEventListener('click', () => {
    search.value = '';
    yearFilter.value = 'all';
    filter();
    search.focus();
  });
  filter();
}
