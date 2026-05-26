// ── User identity (device-based, no login required) ──
export function getUserId() {
  let id = localStorage.getItem('bikeUserId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('bikeUserId', id);
  }
  return id;
}

// ── Rider level ──
export function getRiderLevel() {
  return localStorage.getItem('riderLevel') || 'beginner';
}
export function setRiderLevel(level) {
  localStorage.setItem('riderLevel', level);
}

// ── Premium ──
export function isPremium() {
  return localStorage.getItem('isPremium') === 'true';
}
export function setPremium(val) {
  localStorage.setItem('isPremium', val ? 'true' : 'false');
}

// ── Language ──
export function getLang() {
  return localStorage.getItem('lang') || 'en';
}
export function setLang(lang) {
  localStorage.setItem('lang', lang);
  applyLanguage(lang);
}

const strings = {
  en: {
    home: 'Home', challenge: 'Challenge', routes: 'Routes',
    tracker: 'Tracker', more: 'More',
    daily_tip: 'Daily Tip', good_morning: 'Good morning, Rider!',
    level_beginner: 'Beginner', level_intermediate: 'Intermediate', level_advanced: 'Advanced',
    unlock_premium: 'Unlock Premium ₱79',
  },
  tl: {
    home: 'Tahanan', challenge: 'Hamon', routes: 'Ruta',
    tracker: 'Talaan', more: 'Higit pa',
    daily_tip: 'Payo Ngayon', good_morning: 'Magandang umaga, Mangangahoy!',
    level_beginner: 'Baguhan', level_intermediate: 'Katamtaman', level_advanced: 'Beterano',
    unlock_premium: 'I-unlock ang Premium ₱79',
  }
};

export function applyLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (strings[lang]?.[key]) el.textContent = strings[lang][key];
  });
}

// ── Bottom nav ──
const navItems = [
  { icon: 'fa-house',            label: { en: 'Home',      tl: 'Tahanan'  }, href: 'dashboard.html', key: 'home' },
  { icon: 'fa-fire',             label: { en: 'Challenge', tl: 'Hamon'    }, href: 'challenge.html', key: 'challenge' },
  { icon: 'fa-map-location-dot', label: { en: 'Routes',   tl: 'Ruta'     }, href: 'routes.html',    key: 'routes' },
  { icon: 'fa-chart-line',       label: { en: 'Tracker',  tl: 'Talaan'   }, href: 'tracker.html',   key: 'tracker' },
  { icon: 'fa-ellipsis',         label: { en: 'More',     tl: 'Higit pa' }, href: 'javascript:void(0)', onclick: 'openMoreMenu()', key: 'more' },
];

export function renderBottomNav(activeKey) {
  const lang = getLang();
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  nav.innerHTML = navItems.map(item => `
    <a class="nav-item ${item.key === activeKey ? 'active' : ''}"
       href="${item.href}"
       ${item.onclick ? `onclick="${item.onclick}"` : ''}>
      <span class="nav-icon-wrap"><i class="fa-solid ${item.icon}"></i></span>
      <span>${item.label[lang]}</span>
    </a>
  `).join('');
}

// ── More Menu Drawer ──
function injectMoreMenu() {
  if (document.getElementById('more-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'more-overlay';
  overlay.addEventListener('click', () => closeMoreMenu());
  document.body.appendChild(overlay);

  const drawer = document.createElement('div');
  drawer.id = 'more-drawer';
  drawer.innerHTML = `
    <div class="more-handle"></div>
    <div class="more-header">
      <span>Explore More</span>
    </div>
    <div class="more-links">
      <a href="safety.html" class="more-link">
        <div class="more-link-icon" style="background:linear-gradient(135deg,#c0392b,#e74c3c)">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <div class="more-link-text">
          <span>Safety Gear</span>
          <small>Gear guide &amp; road rules</small>
        </div>
        <i class="fa-solid fa-chevron-right more-arrow"></i>
      </a>
      <a href="warmup.html" class="more-link">
        <div class="more-link-icon" style="background:linear-gradient(135deg,#00897b,#4db6ac)">
          <i class="fa-solid fa-person-running"></i>
        </div>
        <div class="more-link-text">
          <span>Warm-Up &amp; Cool-Down</span>
          <small>Pre &amp; post-ride routines</small>
        </div>
        <i class="fa-solid fa-chevron-right more-arrow"></i>
      </a>
      <a href="diet.html" class="more-link">
        <div class="more-link-icon" style="background:linear-gradient(135deg,#558b2f,#9ccc65)">
          <i class="fa-solid fa-apple-whole"></i>
        </div>
        <div class="more-link-text">
          <span>Diet &amp; Nutrition</span>
          <small>Filipino cycling fuel guide</small>
        </div>
        <i class="fa-solid fa-chevron-right more-arrow"></i>
      </a>
      <a href="carbon.html" class="more-link">
        <div class="more-link-icon" style="background:linear-gradient(135deg,#1b5e20,#43a047)">
          <i class="fa-solid fa-leaf"></i>
        </div>
        <div class="more-link-text">
          <span>Carbon Tracker</span>
          <small>Track your CO&#8322; savings</small>
        </div>
        <i class="fa-solid fa-chevron-right more-arrow"></i>
      </a>
      <a href="motivation.html" class="more-link">
        <div class="more-link-icon" style="background:linear-gradient(135deg,#8e44ad,#c39bd3)">
          <i class="fa-solid fa-star"></i>
        </div>
        <div class="more-link-text">
          <span>Motivation</span>
          <small>Daily tips &amp; community</small>
        </div>
        <i class="fa-solid fa-chevron-right more-arrow"></i>
      </a>
      <a href="premium.html" class="more-link premium-more-link">
        <div class="more-link-icon" style="background:linear-gradient(135deg,#f4722b,#ff9a5c)">
          <i class="fa-solid fa-crown"></i>
        </div>
        <div class="more-link-text">
          <span>Unlock Premium</span>
          <small>&#8369;79 one-time — All features unlocked</small>
        </div>
        <i class="fa-solid fa-chevron-right more-arrow"></i>
      </a>
    </div>
  `;
  document.body.appendChild(drawer);

  // Swipe down to close
  let startY = 0;
  drawer.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  drawer.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - startY > 60) closeMoreMenu();
  }, { passive: true });
}

window.openMoreMenu = function () {
  const overlay = document.getElementById('more-overlay');
  const drawer  = document.getElementById('more-drawer');
  if (!overlay || !drawer) return;
  overlay.classList.add('active');
  drawer.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeMoreMenu = function () {
  const overlay = document.getElementById('more-overlay');
  const drawer  = document.getElementById('more-drawer');
  if (!overlay || !drawer) return;
  overlay.classList.remove('active');
  drawer.classList.remove('open');
  document.body.style.overflow = '';
};

// ── Rider badge label ──
export function getRiderBadgeLabel() {
  const level = getRiderLevel();
  const lang  = getLang();
  const map   = {
    beginner:     { en: 'Beginner',     tl: 'Baguhan'    },
    intermediate: { en: 'Intermediate', tl: 'Katamtaman' },
    advanced:     { en: 'Advanced',     tl: 'Beterano'   },
  };
  return map[level]?.[lang] ?? level;
}

// ── Daily tip picker (deterministic by day of year) ──
export async function getDailyTip() {
  try {
    const resp = await fetch('assets/data/tips.json');
    const tips = await resp.json();
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const level     = getRiderLevel();
    const filtered  = tips.filter(t => !t.level || t.level === level || t.level === 'all');
    return filtered[dayOfYear % filtered.length];
  } catch {
    return { tip: 'Stay hydrated — drink water every 20 minutes on the road.', level: 'all' };
  }
}

// ── Page init ──
export function initPage(activeNavKey) {
  applyLanguage(getLang());
  renderBottomNav(activeNavKey);
  injectMoreMenu();

  const badge = document.getElementById('rider-badge');
  if (badge) badge.textContent = getRiderBadgeLabel();

  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    const current = getLang();
    langBtn.textContent = current === 'en' ? 'TL' : 'EN';
    langBtn.addEventListener('click', () => {
      const next = getLang() === 'en' ? 'tl' : 'en';
      setLang(next);
      langBtn.textContent = next === 'en' ? 'TL' : 'EN';
    });
  }
}
