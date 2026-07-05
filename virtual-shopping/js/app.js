/* app.js — boot, chrome (mobile bar / desktop header + nav strip), route dispatch,
 * delegated events, layout-mode plumbing.
 * body[data-layout] is the single source of truth for mobile vs desktop; crossing
 * the 1024px breakpoint only re-renders the chrome, never #app (views emit
 * superset markup and CSS picks per layout).
 */
(function () {
  const t = window.t;
  const UI = window.UI;
  const Store = window.Store;
  const Views = window.Views;
  const Router = window.Router;
  const esc = Views.esc;

  const App = {
    sort: 'pop',
    pdQty: 1,
    active: 'home',
    searchTimer: null,
    draftTheme: null,
    draftLang: null,
    filters: { price: '', minRating: 0, dealsOnly: false },
    lastKey: null,
    keepScroll: false,
  };

  const el = (id) => document.getElementById(id);

  // ---- layout mode ----
  const mqDesktop = window.matchMedia('(min-width: 1024px)');
  function isDesktop() { return document.body.getAttribute('data-layout') === 'desktop'; }
  function syncLayout() {
    const mode = mqDesktop.matches ? 'desktop' : 'mobile';
    if (document.body.getAttribute('data-layout') === mode) return;
    document.body.setAttribute('data-layout', mode);
    renderHeader();
    renderNav();
  }

  // ---- chrome ----
  const THEME_DOT = { taobao: '#ff5000', amazon: '#ff9900', hktv: '#84bd00' };
  const THEME_COLOR = { taobao: '#ff5000', amazon: '#131921', hktv: '#84bd00' };

  function toolButtons() {
    return '<button class="icon-btn theme-quick" data-action="cycle-theme" title="' + t(UI.storeTheme) + '">' +
        '<span class="theme-dot" style="background:' + (THEME_DOT[Store.theme] || '#888') + '"></span></button>' +
      '<a class="icon-btn" href="#/settings" title="' + t(UI.settings) + '">⚙️</a>' +
      '<button class="icon-btn" data-action="exit" title="' + t(UI.exitShop) + '">✕</button>';
  }

  function mobileHeader() {
    const user = Store.user
      ? '<a class="user-pill" href="#/me" title="' + esc(Store.user) + '">👤 <span>' + esc(Store.user) + '</span></a>'
      : '<a class="user-pill user-pill--guest" href="#/me">👤 <span>' + t(UI.login) + '</span></a>';
    return '<div class="topbar-inner">' +
      '<a class="logo" href="#/">' + t(UI.brand) + '</a>' +
      '<div class="searchwrap"><span class="search-ico">🔍</span>' +
        '<input id="search-input" type="search" placeholder="' + t(UI.searchPlaceholder) + '" autocomplete="off"></div>' +
      user +
      '<button class="lang-btn" data-action="toggle-lang">' + (Store.lang === 'zh' ? 'EN' : '中') + '</button>' +
      toolButtons() +
    '</div>';
  }

  function desktopHeader() {
    const cats = window.CATEGORIES;
    const deptOpts = '<option value="">' + t(UI.deptAll) + '</option>' +
      cats.map((c) => '<option value="' + c.id + '">' + t(c.name) + '</option>').join('');

    const accountMenu = Store.user
      ? '<div class="dt-menu"><div class="dt-menu-head">' + t(UI.hello) + ', ' + esc(Store.user) + '</div>' +
          '<a href="#/me">👤 ' + t(UI.navMe) + '</a>' +
          '<a href="#/orders">📦 ' + t(UI.myOrders) + '</a>' +
          '<a href="#/settings">⚙️ ' + t(UI.settings) + '</a>' +
          '<button data-action="logout">↩︎ ' + t(UI.logout) + '</button></div>'
      : '<div class="dt-menu"><div class="dt-menu-head">' + t(UI.helloSignIn) + '</div>' +
          '<a href="#/me">👤 ' + t(UI.login) + '</a>' +
          '<a href="#/settings">⚙️ ' + t(UI.settings) + '</a></div>';
    const accountLabel = Store.user
      ? '<span>' + t(UI.hello) + ',</span><b>' + esc(Store.user) + '</b>'
      : '<span>' + t(UI.helloSignIn) + '</span><b>' + t(UI.account) + '</b>';

    const count = Store.cartCount();
    const navLinks = cats.slice(0, 6).map((c) =>
      '<a href="#/category/' + c.id + '">' + t(c.name) + '</a>').join('');
    const deptMenu = '<div class="dt-menu">' + cats.map((c) =>
      '<a href="#/category/' + c.id + '"><span>' + c.icon + '</span>' + t(c.name) + '</a>').join('') + '</div>';

    return '<div class="dt-bar">' +
      '<a class="logo" href="#/">' + t(UI.brand) + '</a>' +
      '<form class="dt-search" id="search-form">' +
        '<select id="search-dept" title="' + t(UI.allDepartments) + '">' + deptOpts + '</select>' +
        '<input id="search-input" type="search" placeholder="' + t(UI.searchPlaceholder) + '" autocomplete="off">' +
        '<button type="submit" class="dt-search-btn" title="' + t(UI.searchBtn) + '">🔍</button>' +
      '</form>' +
      '<div class="dt-tools">' +
        '<button class="lang-btn" data-action="toggle-lang">' + (Store.lang === 'zh' ? 'EN' : '中') + '</button>' +
        '<div class="dt-account"><a class="dt-link" href="#/me">' + accountLabel + '</a>' + accountMenu + '</div>' +
        '<a class="dt-cart" href="#/cart"><span class="dt-cart-ico">🛒' +
          '<span class="badge cart-badge"' + (count ? '' : ' style="display:none"') + '>' + count + '</span></span>' +
          '<span>' + t(UI.navCart) + '</span></a>' +
        toolButtons() +
      '</div>' +
    '</div>' +
    '<div class="dt-navstrip"><div class="dt-navstrip-inner">' +
      '<span class="dt-alldept" tabindex="0">☰ ' + t(UI.allDepartments) + deptMenu + '</span>' +
      navLinks +
      '<span class="dt-navstrip-spacer"></span>' +
      '<a href="#/orders">📦 ' + t(UI.myOrders) + '</a>' +
    '</div></div>';
  }

  function renderHeader() {
    const prevSearch = el('search-input') ? el('search-input').value : '';
    const prevDept = el('search-dept') ? el('search-dept').value : '';
    el('topbar').innerHTML = isDesktop() ? desktopHeader() : mobileHeader();
    if (prevSearch && el('search-input')) el('search-input').value = prevSearch;
    if (prevDept && el('search-dept')) el('search-dept').value = prevDept;
  }
  const THEME_ORDER = ['hktv', 'taobao', 'amazon'];

  const NAV = [
    ['home', '#/', '🏠', UI.navHome],
    ['cats', '#/categories', '🗂️', UI.navCats],
    ['cart', '#/cart', '🛒', UI.navCart],
    ['orders', '#/orders', '📦', UI.navOrders],
    ['me', '#/me', '👤', UI.navMe],
  ];
  function renderNav() {
    const count = Store.cartCount();
    el('bottomnav').innerHTML = NAV.map((n) => {
      const badge = (n[0] === 'cart' && count) ? '<span class="badge">' + count + '</span>' : '';
      let label = t(n[3]);
      if (n[0] === 'me' && Store.user) label = esc(Store.user);
      return '<a class="navitem" data-nav="' + n[0] + '" href="' + n[1] + '">' +
        '<span class="nav-ico">' + n[2] + badge + '</span>' +
        '<span class="nav-label">' + label + '</span></a>';
    }).join('');
    setActive(App.active);
  }
  function setActive(key) {
    App.active = key;
    document.querySelectorAll('.navitem').forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('data-nav') === key);
    });
  }
  function updateBadge() {
    renderNav();
    const b = document.querySelector('.dt-cart .cart-badge');
    if (b) {
      const c = Store.cartCount();
      b.textContent = c;
      b.style.display = c ? 'flex' : 'none';
    }
  }

  // ---- routing ----
  function defaultFilters() { return { price: '', minRating: 0, dealsOnly: false }; }

  function route(path, query) {
    const seg = path.split('/').filter(Boolean);
    // Filters reset when the underlying page changes; sort/filter rerenders keep them.
    const key = path + '|' + (query.q || '') + '|' + (query.cat || '');
    if (key !== App.lastKey) App.filters = defaultFilters();
    App.lastKey = key;

    let html;
    let active = '';
    switch (seg[0]) {
      case undefined: html = Views.home(); active = 'home'; break;
      case 'categories': html = Views.categories(); active = 'cats'; break;
      case 'category': html = Views.category(seg[1], App.sort, App.filters); active = 'cats'; break;
      case 'product':
        App.pdQty = 1;
        Store.pushRecent(seg[1]);
        html = Views.product(seg[1]);
        break;
      case 'search': html = Views.search(query.q || '', App.sort, App.filters, query.cat || ''); break;
      case 'cart': html = Views.cart(); active = 'cart'; break;
      case 'checkout': html = Views.checkout(); active = 'cart'; break;
      case 'orders': html = Views.orders(); active = 'orders'; break;
      case 'me': html = Views.me(); active = 'me'; break;
      case 'settings':
        App.draftTheme = Store.theme;
        App.draftLang = Store.lang;
        html = Views.settings({ theme: App.draftTheme, lang: App.draftLang });
        active = 'me';
        break;
      default: html = Views.home(); active = 'home';
    }
    const keep = App.keepScroll;
    App.keepScroll = false;
    const y = window.scrollY;
    el('app').innerHTML = html;
    window.scrollTo(0, keep ? y : 0);
    setActive(active);
    updateBadge();
  }

  // Re-run the current route (e.g. after a sort/filter change) without jumping to top.
  function rerender() {
    App.keepScroll = true;
    Router.resolve();
  }

  // ---- toast ----
  let toastTimer = null;
  function toast(msg) {
    const tEl = el('toast');
    tEl.textContent = msg;
    tEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => tEl.classList.remove('show'), 1600);
  }

  // ---- order-placed celebration ----
  function showOrderPlaced(order) {
    const saved = Store.saved();
    const colors = ['#ff5000', '#ffb300', '#23c552', '#3a86ff', '#ff4d6d'];
    let conf = '';
    for (let i = 0; i < 28; i++) {
      conf += '<span class="confetti" style="left:' + ((i * 3.6) % 100) +
        '%;animation-delay:' + ((i % 7) * 0.12) + 's;background:' + colors[i % 5] + '"></span>';
    }
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = '<div class="confetti-layer">' + conf + '</div>' +
      '<div class="placed-card"><div class="placed-ico">🎉</div>' +
      '<h2>' + t(UI.orderPlaced) + '</h2>' +
      '<div class="placed-saved">' + t(UI.youSaved) + ' <b>HK$' + Views.fmtPrice(order.total) + '</b></div>' +
      '<div class="muted">' + t(UI.savedTotal) + ': HK$' + Views.fmtPrice(saved) + '</div>' +
      '<button class="btn btn-buy btn-block" data-action="goto-orders">' + t(UI.viewOrders) + '</button>' +
      '<button class="btn btn-line btn-block" data-action="close-overlay">' + t(UI.continueShopping) + '</button></div>';
    document.body.appendChild(ov);
  }
  function closeOverlay() {
    const ov = document.querySelector('.overlay');
    if (ov) ov.remove();
  }

  // ---- product-page quantity (mobile stepper + desktop select stay in sync) ----
  function setPdQty(q) {
    App.pdQty = Math.max(1, q);
    document.querySelectorAll('.pd-qty-val').forEach((n) => { n.textContent = App.pdQty; });
    document.querySelectorAll('[data-action="pd-qty-select"]').forEach((s) => {
      s.value = String(Math.min(App.pdQty, 10));
    });
  }

  // ---- delegated events ----
  function onClick(e) {
    const act = e.target.closest('[data-action]');
    if (!act) return;
    const action = act.getAttribute('data-action');
    const id = act.getAttribute('data-id');

    switch (action) {
      case 'toggle-lang':
        Store.setLang(Store.lang === 'zh' ? 'en' : 'zh');
        applyLang(); renderHeader(); renderNav(); Router.resolve();
        break;
      case 'set-theme':
        App.draftTheme = act.getAttribute('data-theme'); renderSettings();
        break;
      case 'set-lang':
        App.draftLang = act.getAttribute('data-lang'); renderSettings();
        break;
      case 'save-settings':
        Store.setTheme(App.draftTheme); Store.setLang(App.draftLang);
        applyTheme(); applyLang(); renderHeader(); renderNav(); toast(t(UI.savedMsg)); Router.resolve();
        break;
      case 'cycle-theme': {
        const i = THEME_ORDER.indexOf(Store.theme);
        Store.setTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length]);
        applyTheme(); renderHeader(); renderNav(); Router.resolve();
        break;
      }
      case 'exit':
        window.close();
        setTimeout(() => { location.href = '../'; }, 150);
        break;
      case 'sort':
        break; // handled in onChange
      case 'pd-inc': setPdQty(App.pdQty + 1); break;
      case 'pd-dec': setPdQty(App.pdQty - 1); break;
      case 'add':
        Store.addToCart(id, App.pdQty); updateBadge(); toast(t(UI.added)); break;
      case 'buy':
        Store.addToCart(id, App.pdQty); updateBadge(); Router.go('/checkout'); break;
      case 'scroll-reviews': {
        const r = document.getElementById('reviews');
        if (r) r.scrollIntoView({ behavior: 'smooth' });
        break;
      }
      case 'back':
        if (history.length > 1) history.back(); else Router.go('/'); break;
      case 'cart-inc': Store.addToCart(id, 1); rerender(); break;
      case 'cart-dec': {
        const c = Store.getCart();
        Store.setQty(id, (c[id] || 1) - 1); rerender(); break;
      }
      case 'cart-remove': Store.removeFromCart(id); rerender(); break;
      case 'filter-clear':
        App.filters = defaultFilters(); rerender(); break;
      case 'place': {
        if (el('co-name')) {
          Store.saveAddr({
            name: el('co-name').value.trim(),
            line: el('co-line') ? el('co-line').value.trim() : '',
            district: el('co-district') ? el('co-district').value : '',
          });
        }
        const order = Store.placeOrder();
        if (order) { updateBadge(); showOrderPlaced(order); }
        break;
      }
      case 'goto-orders': closeOverlay(); Router.go('/orders'); break;
      case 'close-overlay': closeOverlay(); Router.go('/'); break;
      case 'login': {
        const v = (el('login-name').value || '').trim();
        if (v) { Store.login(v); renderHeader(); renderNav(); Router.resolve(); }
        break;
      }
      case 'logout': Store.logout(); renderHeader(); renderNav(); Router.resolve(); break;
      default: break;
    }
  }

  function onChange(e) {
    const sortSel = e.target.closest('[data-action="sort"]');
    if (sortSel) { App.sort = sortSel.value; rerender(); return; }

    const qtySel = e.target.closest('[data-action="pd-qty-select"]');
    if (qtySel) { setPdQty(parseInt(qtySel.value, 10) || 1); return; }

    const f = e.target.closest('[data-filter]');
    if (f) {
      const k = f.getAttribute('data-filter');
      if (k === 'price') App.filters.price = f.value;
      else if (k === 'rating') App.filters.minRating = f.checked ? 4 : 0;
      else if (k === 'deals') App.filters.dealsOnly = f.checked;
      rerender();
    }
  }

  function gotoSearch(v) {
    App.sort = 'pop';
    const dept = el('search-dept') ? el('search-dept').value : '';
    Router.replace('/search?q=' + encodeURIComponent(v) + (dept ? '&cat=' + encodeURIComponent(dept) : ''));
  }
  function onInput(e) {
    if (e.target.id !== 'search-input') return;
    clearTimeout(App.searchTimer);
    const v = e.target.value;
    App.searchTimer = setTimeout(() => gotoSearch(v), 250);
  }
  function onKeydown(e) {
    if (e.target.id === 'search-input' && e.key === 'Enter') {
      clearTimeout(App.searchTimer);
      gotoSearch(e.target.value);
      if (!isDesktop()) e.target.blur();
    }
  }
  function onSubmit(e) {
    if (e.target.id !== 'search-form') return;
    e.preventDefault();
    clearTimeout(App.searchTimer);
    gotoSearch(el('search-input') ? el('search-input').value : '');
  }

  function applyTheme() {
    document.body.setAttribute('data-theme', Store.theme);
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', THEME_COLOR[Store.theme] || '#84bd00');
  }
  function applyLang() {
    document.documentElement.lang = Store.lang === 'zh' ? 'zh-HK' : 'en';
  }
  function renderSettings() {
    el('app').innerHTML = Views.settings({ theme: App.draftTheme, lang: App.draftLang });
  }

  // ---- boot ----
  function boot() {
    applyTheme();
    applyLang();
    syncLayout();
    renderHeader();
    renderNav();
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('submit', onSubmit);
    if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', syncLayout);
    else mqDesktop.addListener(syncLayout);
    Router.start(route);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.App = App;
})();
