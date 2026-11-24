const addHomeTab = () => {
  document.querySelectorAll('nav').forEach((menu) => {
    if (menu.dataset.homeTabAdded) return;
    const hasHome = [...menu.querySelectorAll('a')].some((link) => {
      const text = link.textContent.trim().toLowerCase();
      const href = link.getAttribute('href');
      return text === 'home' || href === '/';
    });
    if (hasHome) return;
    const about = [...menu.querySelectorAll('a')].find((link) => link.textContent.trim().toLowerCase() === 'about');
    if (!about) return;
    const home = document.createElement('a');
    home.href = '/';
    home.textContent = 'Home';
    home.setAttribute('aria-label', 'Home page');
    if (window.location.pathname === '/') home.classList.add('active');
    about.before(home);
    menu.dataset.homeTabAdded = 'true';
  });
};

addHomeTab();
new MutationObserver(addHomeTab).observe(document.documentElement, { childList: true, subtree: true });
