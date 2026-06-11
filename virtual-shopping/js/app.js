/* app.js — boot, chrome (header + bottom nav), route dispatch, delegated events. */
(function () {
  const t = window.t;
  const UI = window.UI;
  const Store = window.Store;
  const Views = window.Views;
  const Router = window.Router;

  const App = {
    sort: 'pop',
    pdQty: 1,
    active: 'home',
    searchTimer: null,
    draftTheme: null,
    draftLang: null,
  };

  const el = (id) => document.getElementById(id);

  // ---- chrome ----
  const THEME_DOT = { taobao: '#ff5000', amazon: '#ff9900', hktv: '#84bd00' };
  function renderHeader() {
    const user = Store.user
      ? '<a class="user-pill" href="#/me" title="' + Store.user + '">👤 <span>' + Store.user + '</span></a>'
      : '<a class="user-pill user-pill--guest" href="#/me">👤 <span>' + t(UI.login) + '</span></a>';
    el('topbar').innerHTML =
      '<div class="topbar-inner">' +
        '<a class="logo" href="#/">' + t(UI.brand) + '</a>' +
        '<div class="searchwrap"><span class="search-ico">🔍</span>' +
          '<input id="search-input" type="search" placeholder="' + t(UI.searchPlaceholder) + '" autocomplete="off"></div>' +
        user +
        '<button class="icon-btn theme-quick" data-action="cycle-theme" title="' + t(UI.storeTheme) + '">' +
          '<span class="theme-dot" style="background:' + (THEME_DOT[Store.theme] || '#888') + '"></span></button>' +
        '<a class="icon-btn" href="#/settings" title="' + t(UI.settings) + '">⚙️</a>' +
        '<button class="lang-btn" data-action="toggle-lang">' + (Store.lang === 'zh' ? 'EN' : '中') + '</button>' +
      '</div>';
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
      if (n[0] === 'me' && Store.user) label = Store.user;
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
  function updateBadge() { renderNav(); }

  // ---- routing ----
  function route(path, query) {
    const seg = path.split('/').filter(Boolean);
    let html;
    let active = '';
    switch (seg[0]) {
      case undefined: html = Views.home(); active = 'home'; break;
      case 'categories': html = Views.categories(); active = 'cats'; break;
      case 'category': html = Views.category(seg[1], App.sort); active = 'cats'; break;
      case 'product': App.pdQty = 1; html = Views.product(seg[1]); break;
      case 'search': html = Views.search(query.q || '', App.sort); break;
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
    el('app').innerHTML = html;
    window.scrollTo(0, 0);
    setActive(active);
    updateBadge();
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

  // ---- delegated events ----
  function onClick(e) {
    const act = e.target.closest('[data-action]');
    if (!act) return;
    const action = act.getAttribute('data-action');
    const id = act.getAttribute('data-id');

    switch (action) {
      case 'toggle-lang':
        Store.setLang(Store.lang === 'zh' ? 'en' : 'zh');
        renderHeader(); renderNav(); Router.resolve();
        break;
      case 'set-theme':
        App.draftTheme = act.getAttribute('data-theme'); renderSettings();
        break;
      case 'set-lang':
        App.draftLang = act.getAttribute('data-lang'); renderSettings();
        break;
      case 'save-settings':
        Store.setTheme(App.draftTheme); Store.setLang(App.draftLang);
        applyTheme(); renderHeader(); renderNav(); toast(t(UI.savedMsg)); Router.resolve();
        break;
      case 'cycle-theme': {
        const i = THEME_ORDER.indexOf(Store.theme);
        Store.setTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length]);
        applyTheme(); renderHeader(); renderNav(); Router.resolve();
        break;
      }
      case 'sort':
        break; // handled in onChange
      case 'pd-inc':
        App.pdQty += 1; el('pd-qty').textContent = App.pdQty; break;
      case 'pd-dec':
        if (App.pdQty > 1) { App.pdQty -= 1; el('pd-qty').textContent = App.pdQty; } break;
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
      case 'cart-inc': Store.addToCart(id, 1); Router.resolve(); break;
      case 'cart-dec': {
        const c = Store.getCart();
        Store.setQty(id, (c[id] || 1) - 1); Router.resolve(); break;
      }
      case 'cart-remove': Store.removeFromCart(id); Router.resolve(); break;
      case 'place': {
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
    const sel = e.target.closest('[data-action="sort"]');
    if (sel) { App.sort = sel.value; Router.resolve(); }
  }

  function onInput(e) {
    if (e.target.id !== 'search-input') return;
    clearTimeout(App.searchTimer);
    const v = e.target.value;
    App.searchTimer = setTimeout(() => {
      App.sort = 'pop';
      Router.replace('/search?q=' + encodeURIComponent(v));
    }, 250);
  }
  function onKeydown(e) {
    if (e.target.id === 'search-input' && e.key === 'Enter') {
      clearTimeout(App.searchTimer);
      App.sort = 'pop';
      Router.replace('/search?q=' + encodeURIComponent(e.target.value));
      e.target.blur();
    }
  }

  function applyTheme() {
    document.body.setAttribute('data-theme', Store.theme);
  }
  function renderSettings() {
    el('app').innerHTML = Views.settings({ theme: App.draftTheme, lang: App.draftLang });
  }

  // ---- boot ----
  function boot() {
    applyTheme();
    renderHeader();
    renderNav();
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKeydown);
    Router.start(route);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.App = App;
})();
