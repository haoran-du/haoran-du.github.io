// Run before the stylesheet so saved and time-based themes appear on first paint.
(() => {
  const key = 'haoran-theme';
  const valid = (value) => ['auto', 'light', 'dark'].includes(value) ? value : 'auto';
  const readMode = () => {
    try { return valid(localStorage.getItem(key)); } catch { return 'auto'; }
  };
  let mode = readMode();
  const apply = () => {
    const hour = new Date().getHours();
    const theme = mode === 'auto' ? (hour >= 7 && hour < 19 ? 'light' : 'dark') : mode;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themeMode = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#162a46' : '#f8f6f2');
    const select = document.getElementById('theme-mode');
    if (select) select.value = mode;
  };
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('theme-mode');
    if (!select) return;
    document.querySelector('.theme-switch').hidden = false;
    apply();
    select.addEventListener('change', () => {
      mode = valid(select.value);
      try { localStorage.setItem(key, mode); } catch { /* Keep the choice for this page when storage is unavailable. */ }
      apply();
    });
  });
  // Recheck local time after sleep, tab restoration, or a time-zone change.
  setInterval(() => { if (mode === 'auto') apply(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });
  window.addEventListener('pageshow', () => { mode = readMode(); apply(); });
  window.addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) { mode = readMode(); apply(); }
  });
})();
