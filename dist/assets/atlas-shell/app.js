const $ = (selector) => document.querySelector(selector);
const themeButton = $('#theme');
function syncTheme() { const dark = document.documentElement.dataset.theme === 'dark'; themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`); document.querySelector('meta[name="theme-color"]').content = dark ? '#101011' : '#fafafa'; }
function toggleTheme() { const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; try { localStorage.setItem('portfolio-theme', theme); } catch {} syncTheme(); }
syncTheme(); themeButton.addEventListener('click', toggleTheme);
document.querySelector(`nav [data-page="${document.body.dataset.page}"]`)?.setAttribute('aria-current', 'page');
const palette = $('#palette'), commandSearch = $('#command-search');
function filterCommands() { let count = 0; document.querySelectorAll('#command-list > *').forEach(item => { item.hidden = !item.textContent.toLowerCase().includes(commandSearch.value.trim().toLowerCase()); if (!item.hidden) count++; }); $('#command-empty').hidden = count > 0; }
function openPalette() { if (palette.open) return; commandSearch.value = ''; filterCommands(); palette.showModal(); commandSearch.focus(); }
$('#commands').addEventListener('click', openPalette); $('#close-palette').addEventListener('click', () => palette.close());
$('#command-theme').addEventListener('click', () => { toggleTheme(); palette.close(); });
commandSearch.addEventListener('input', filterCommands);
palette.addEventListener('click', event => { const r = palette.getBoundingClientRect(); if (event.target === palette && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) palette.close(); });
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); palette.open ? palette.close() : openPalette(); } if (!palette.open) return; const items = [...document.querySelectorAll('#command-list > *')].filter(el => !el.hidden); const index = items.indexOf(document.activeElement); if (['ArrowDown','ArrowUp'].includes(event.key) && items.length) { event.preventDefault(); items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); } if (event.key === 'Enter' && document.activeElement === commandSearch && items.length) { event.preventDefault(); items[0].click(); } });
$('#project-search')?.addEventListener('input', event => { const query = event.target.value.trim().toLowerCase(); let count = 0; document.querySelectorAll('.project').forEach(card => { card.hidden = !card.dataset.search.toLowerCase().includes(query); if (!card.hidden) count++; }); $('#no-projects').hidden = count > 0; });
const motionButton = $('#motion');
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
try { paused = localStorage.getItem('portfolio-motion') === 'paused' || paused; } catch {}
function syncMotion() { document.documentElement.dataset.motion = paused ? 'paused' : 'running'; motionButton.textContent = paused ? '▷' : 'Ⅱ'; motionButton.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations'); motionButton.title = paused ? 'Resume animations' : 'Pause animations'; }
syncMotion(); motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); try { localStorage.setItem('portfolio-motion', paused ? 'paused' : 'running'); } catch {} });

// One shared indicator, with a small directional nudge before navigation.
const navigation = $('header nav');
const activeTab = navigation.querySelector('[aria-current="page"]');
const indicator = document.createElement('span');
indicator.className = 'nav-indicator';
indicator.setAttribute('aria-hidden', 'true');
navigation.append(indicator);
function placeIndicator(tab = activeTab, nudge = 0) {
  indicator.style.width = `${tab.offsetWidth}px`;
  indicator.style.transform = `translateX(${tab.offsetLeft + nudge}px)`;
}
let previousTab;
try {
  const previous = JSON.parse(sessionStorage.getItem('portfolio-nav') || 'null');
  sessionStorage.removeItem('portfolio-nav');
  if (previous?.to === location.pathname && Date.now() - previous.time < 5000) {
    previousTab = [...navigation.querySelectorAll('a')].find(tab => tab.dataset.page === previous.from);
  }
} catch {}
placeIndicator(previousTab || activeTab);
navigation.classList.add('has-indicator');
requestAnimationFrame(() => requestAnimationFrame(() => {
  indicator.classList.add('ready');
  placeIndicator();
}));
navigation.querySelectorAll('a').forEach(tab => {
  const nudge = () => placeIndicator(activeTab, tab === activeTab ? 0 : Math.sign(tab.offsetLeft - activeTab.offsetLeft) * 7);
  tab.addEventListener('pointerenter', nudge);
  tab.addEventListener('focus', nudge);
  tab.addEventListener('blur', () => placeIndicator());
  tab.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    try { sessionStorage.setItem('portfolio-nav', JSON.stringify({ from: activeTab.dataset.page, to: new URL(tab.href).pathname, time: Date.now() })); } catch {}
    placeIndicator(tab);
  });
});
navigation.addEventListener('pointerleave', () => placeIndicator());
new ResizeObserver(() => {
  if (indicator.classList.contains('ready')) placeIndicator();
}).observe(navigation);
window.addEventListener('pageshow', event => { if (event.persisted) placeIndicator(); });

// Stagger each letter's color cycle like a wave across a keyboard.
const nameLink = $('header .name');
const nameText = nameLink.textContent;
nameLink.setAttribute('aria-label', nameText);
nameLink.replaceChildren(...[...nameText].map((letter, index) => {
  const span = document.createElement('span');
  span.textContent = letter;
  span.setAttribute('aria-hidden', 'true');
  span.style.setProperty('--letter', index);
  return span;
}));

// Match the rounded dotted perimeter to each card at every responsive size.
const orbitObserver = new ResizeObserver(entries => {
  for (const { target } of entries) {
    const rect = target.querySelector('.project-orbit rect');
    rect.setAttribute('width', Math.max(0, target.clientWidth - 4));
    rect.setAttribute('height', Math.max(0, target.clientHeight - 4));
  }
});
document.querySelectorAll('.project').forEach(card => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('project-orbit');
  svg.setAttribute('aria-hidden', 'true');
  const rect = document.createElementNS(svg.namespaceURI, 'rect');
  for (const [key, value] of Object.entries({ x: 2, y: 2, rx: 14 })) rect.setAttribute(key, value);
  svg.append(rect);
  card.append(svg);
  orbitObserver.observe(card);
});
