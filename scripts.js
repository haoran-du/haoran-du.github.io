// Navigation and research content are static HTML; these are optional enhancements.
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Keep all posts readable without JavaScript; enhance the static list with a filter.
const blogFilter = document.getElementById('blog-filter');
const blogCategory = document.getElementById('blog-category');
const blogFilterStatus = document.getElementById('blog-filter-status');
const blogFilterEmpty = document.getElementById('blog-filter-empty');
const blogEntries = [...document.querySelectorAll('#blog-posts .blog-entry')];
if (blogFilter && blogCategory && blogFilterStatus && blogFilterEmpty && blogEntries.length) {
  const filterPosts = () => {
    let visible = 0;
    for (const entry of blogEntries) {
      entry.hidden = Boolean(blogCategory.value && entry.dataset.category !== blogCategory.value);
      if (!entry.hidden) visible++;
    }
    blogFilterEmpty.hidden = visible !== 0;
    blogFilterStatus.textContent = `Showing ${visible} of ${blogEntries.length} ${blogEntries.length === 1 ? 'post' : 'posts'}.`;
  };
  blogCategory.addEventListener('change', filterPosts);
  window.addEventListener('pageshow', filterPosts);
  filterPosts();
  blogFilter.hidden = false;
}

// Preserve bookmarks to sections on the former single-page website.
if (document.body.dataset.page === 'home') {
  const legacy = { '#about': 'index.html#background', '#research': 'research.html', '#outputs': 'publications.html', '#contact': 'contact.html' };
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
