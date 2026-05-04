/* Общая навигация для страниц библиотеки и главного приложения. */

export function renderNav(currentPath) {
  const links = [
    { href: '/', label: 'Past Simple', brand: true },
    { href: '/tokens.html', label: 'Tokens' },
    { href: '/components.html', label: 'Components' },
  ];

  const nav = document.createElement('nav');
  nav.className = 'lib-nav';

  for (const link of links) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    a.className = link.brand ? 'lib-nav__brand' : 'lib-nav__link';
    if (currentPath === link.href) a.setAttribute('aria-current', 'page');
    nav.appendChild(a);
  }

  document.body.prepend(nav);
}
