/* views.js — pure render helpers. Each returns an HTML string; App sets it into #app.
 * No DOM mutation here except via the returned markup.
 */
(function () {
  const t = window.t;
  const UI = window.UI;

  // ---- formatting ----
  function fmtPrice(n) {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }
  function fmtCount(n) { return n.toLocaleString('en-US'); }
  function discount(p) { return p.listPrice > p.price ? Math.round((1 - p.price / p.listPrice) * 100) : 0; }

  function starsHtml(rating) {
    return '<span class="stars"><span class="stars-on" style="width:' +
      (rating / 5 * 100) + '%"></span></span>';
  }

  // Sprite thumb with a category-coloured fallback (glyph) shown until the sheet PNG exists.
  function thumbHtml(p, cls) {
    const col = p.cell % 4;
    const row = Math.floor(p.cell / 4);
    const x = col * (100 / 3);
    const y = row * (100 / 3);
    const cat = window.CAT_BY_ID[p.category] || { icon: '🛍️', color: '#eee' };
    return '<div class="thumb ' + (cls || '') + '" style="background:' + cat.color + '">' +
      '<span class="thumb-fb">' + cat.icon + '</span>' +
      '<div class="thumb-img" style="background-image:url(\'assets/products/' + p.sheet + '.jpeg\');' +
      'background-position:' + x + '% ' + y + '%"></div></div>';
  }

  function priceHtml(p) {
    const d = discount(p);
    return '<span class="price">HK$' + fmtPrice(p.price) + '</span>' +
      (d ? '<span class="list">HK$' + fmtPrice(p.listPrice) + '</span><span class="disc">-' + d + '%</span>' : '');
  }

  function productCard(p) {
    const d = discount(p);
    const badge = d ? '<span class="card-badge">-' + d + '%</span>' : '';
    return '<a class="card" href="#/product/' + p.id + '">' +
      badge + thumbHtml(p) +
      '<div class="card-body">' +
        '<div class="card-title">' + t(p.title) + '</div>' +
        '<div class="card-rating">' + starsHtml(p.rating) +
          '<span class="rcount">(' + fmtCount(p.ratingCount) + ')</span></div>' +
        '<div class="card-seller">' + t(p.seller) + '</div>' +
        '<div class="card-price">' + priceHtml(p) + '</div>' +
      '</div></a>';
  }

  function grid(list) {
    if (!list.length) return '<div class="empty"><div class="empty-ico">🔍</div><p>' + t(UI.noResults) + '</p></div>';
    return '<div class="grid">' + list.map(productCard).join('') + '</div>';
  }

  // ---- sorting ----
  function sortList(list, sort) {
    const a = list.slice();
    switch (sort) {
      case 'price-asc': return a.sort((x, y) => x.price - y.price);
      case 'price-desc': return a.sort((x, y) => y.price - x.price);
      case 'rating': return a.sort((x, y) => y.rating - x.rating);
      case 'discount': return a.sort((x, y) => discount(y) - discount(x));
      default: return a.sort((x, y) => y.ratingCount - x.ratingCount); // popularity
    }
  }
  function sortSelect(sort) {
    const opts = [
      ['pop', UI.sortPop], ['price-asc', UI.sortPriceAsc], ['price-desc', UI.sortPriceDesc],
      ['rating', UI.sortRating], ['discount', UI.sortDiscount],
    ];
    return '<div class="sortbar"><label>' + t(UI.sortBy) + '</label>' +
      '<select data-action="sort">' +
      opts.map((o) => '<option value="' + o[0] + '"' + (o[0] === sort ? ' selected' : '') + '>' + t(o[1]) + '</option>').join('') +
      '</select></div>';
  }

  // ---- views ----
  function home() {
    const chips = window.CATEGORIES.map((c) =>
      '<a class="chip" href="#/category/' + c.id + '"><span class="chip-ico">' + c.icon + '</span>' +
      '<span>' + t(c.name) + '</span></a>').join('');

    const deals = window.PRODUCTS.filter((p) => discount(p) > 0)
      .sort((a, b) => discount(b) - discount(a)).slice(0, 10);
    const dealRow = deals.map((p) =>
      '<a class="deal" href="#/product/' + p.id + '">' + thumbHtml(p, 'deal-thumb') +
      '<div class="deal-price">HK$' + fmtPrice(p.price) + '</div>' +
      '<div class="deal-disc">-' + discount(p) + '%</div></a>').join('');

    const rec = sortList(window.PRODUCTS, 'pop');

    return '<div class="hero"><div class="hero-title">' + t(UI.brand) + '</div>' +
        '<div class="hero-sub">' + t(UI.tagline) + '</div></div>' +
      '<div class="chips">' + chips + '</div>' +
      '<section class="strip"><div class="strip-head"><span class="strip-title">⚡ ' + t(UI.flashDeals) +
        '</span></div><div class="deal-row">' + dealRow + '</div></section>' +
      '<h2 class="sec-title">' + t(UI.recommended) + '</h2>' + grid(rec);
  }

  function categories() {
    const cards = window.CATEGORIES.map((c) =>
      '<a class="cat-card" href="#/category/' + c.id + '" style="background:' + c.color + '">' +
      '<span class="cat-ico">' + c.icon + '</span><span class="cat-name">' + t(c.name) + '</span></a>').join('');
    return '<h2 class="sec-title">' + t(UI.allCategories) + '</h2><div class="cat-grid">' + cards + '</div>';
  }

  function category(id, sort) {
    const cat = window.CAT_BY_ID[id];
    if (!cat) return categories();
    const list = sortList(window.PRODUCTS.filter((p) => p.category === id), sort);
    return crumb(cat) +
      '<div class="page-head"><h2 class="sec-title">' + cat.icon + ' ' + t(cat.name) + '</h2>' +
      '<span class="muted">' + list.length + ' ' + t(UI.items) + '</span></div>' +
      sortSelect(sort) + grid(list);
  }

  function search(q, sort) {
    const query = (q || '').trim().toLowerCase();
    let list = window.PRODUCTS;
    if (query) {
      list = window.PRODUCTS.filter((p) =>
        t(p.title).toLowerCase().includes(query) ||
        p.title.en.toLowerCase().includes(query) ||
        p.title.zh.includes(q.trim()) ||
        p.tags.some((tag) => tag.toLowerCase().includes(query)));
    }
    list = sortList(list, sort);
    return '<div class="page-head"><h2 class="sec-title">' + t(UI.resultsFor) +
      ' "' + (q || '') + '"</h2><span class="muted">' + list.length + ' ' + t(UI.items) + '</span></div>' +
      sortSelect(sort) + grid(list);
  }

  function reviewsBlock(p) {
    const dist = window.Store.ratingDist(p.rating); // [5★..1★] percents
    const bars = [5, 4, 3, 2, 1].map((s, i) =>
      '<div class="hist-row"><span class="hist-star">' + s + '★</span>' +
      '<span class="hist-bar"><span style="width:' + dist[i] + '%"></span></span>' +
      '<span class="hist-pct">' + dist[i] + '%</span></div>').join('');

    const list = window.Store.reviews(p).map((r) =>
      '<div class="review"><div class="review-top">' +
        '<span class="review-name">' + r.name + '</span>' +
        (r.verified ? '<span class="verified">✓ ' + t(UI.verified) + '</span>' : '') +
      '</div><div class="review-stars">' + starsHtml(r.stars) +
        '<span class="review-title">' + t(r.title) + '</span></div>' +
      '<div class="review-body">' + t(r.body) + '</div>' +
      '<div class="review-date">' + r.date + '</div></div>').join('');

    return '<section class="reviews"><h3 class="block-title">' + t(UI.reviewsTitle) + '</h3>' +
      '<div class="rating-summary"><div class="rating-big">' + p.rating.toFixed(1) +
        '<div>' + starsHtml(p.rating) + '</div>' +
        '<div class="muted">' + fmtCount(p.ratingCount) + ' ' + t(UI.ratingsCount) + '</div></div>' +
      '<div class="hist">' + bars + '</div></div>' +
      '<div class="review-list">' + list + '</div></section>';
  }

  function crumb(cat, leaf) {
    return '<nav class="crumb"><a href="#/">' + t(UI.navHome) + '</a>' +
      '<span class="crumb-sep">›</span>' +
      (leaf
        ? '<a href="#/category/' + cat.id + '">' + t(cat.name) + '</a>' +
          '<span class="crumb-sep">›</span><span class="crumb-cur">' + leaf + '</span>'
        : '<span class="crumb-cur">' + t(cat.name) + '</span>') +
      '</nav>';
  }

  function merchChips() {
    return '<div class="merch-chips">' +
      '<span class="mchip mchip-main">' + t(UI.merchOfficial) + '</span>' +
      '<span class="mchip">' + t(UI.merchFreeShip) + '</span>' +
      '<span class="mchip">' + t(UI.merchReturn) + '</span>' +
      '<span class="mchip">' + t(UI.merchFast) + '</span></div>';
  }

  function product(id) {
    const p = window.getProduct(id);
    if (!p) return '<div class="empty"><p>' + t(UI.noResults) + '</p></div>';
    const cat = window.CAT_BY_ID[p.category];
    return '<div class="pd">' +
      '<button class="back" data-action="back">‹</button>' +
      crumb(cat, t(p.title)) +
      thumbHtml(p, 'pd-thumb') +
      '<div class="pd-info">' +
        '<div class="pd-price">' + priceHtml(p) + '</div>' +
        '<h1 class="pd-title">' + t(p.title) + '</h1>' +
        '<div class="pd-rating" data-action="scroll-reviews">' + starsHtml(p.rating) +
          '<span class="rcount">' + p.rating.toFixed(1) + ' · ' + fmtCount(p.ratingCount) + ' ' + t(UI.ratingsCount) + '</span></div>' +
        '<div class="pd-seller">' + t(UI.seller) + ': <b>' + t(p.seller) + '</b></div>' +
        merchChips() +
      '</div>' +
      '<section class="pd-desc"><h3 class="block-title">' + t(UI.description) + '</h3>' +
        '<p>' + window.Store.description(p) + '</p>' +
        '<div class="tags">' + p.tags.map((x) => '<span class="tag">#' + x + '</span>').join('') + '</div></section>' +
      '<a id="reviews"></a>' + reviewsBlock(p) +
      '<div class="pd-bar">' +
        '<div class="qty"><button data-action="pd-dec">−</button>' +
          '<span id="pd-qty">1</span><button data-action="pd-inc">+</button></div>' +
        '<button class="btn btn-cart" data-action="add" data-id="' + p.id + '">' + t(UI.addToCart) + '</button>' +
        '<button class="btn btn-buy" data-action="buy" data-id="' + p.id + '">' + t(UI.buyNow) + '</button>' +
      '</div></div>';
  }

  function cart() {
    const items = window.Store.cartItems();
    if (!items.length) {
      return '<h2 class="sec-title">' + t(UI.navCart) + '</h2>' +
        '<div class="empty"><div class="empty-ico">🛒</div><p>' + t(UI.emptyCart) + '</p>' +
        '<p class="muted">' + t(UI.emptyCartHint) + '</p>' +
        '<a class="btn btn-buy" href="#/">' + t(UI.goShopping) + '</a></div>';
    }
    const rows = items.map((x) => {
      const p = x.product;
      return '<div class="crow">' + thumbHtml(p, 'crow-thumb') +
        '<div class="crow-info"><a class="crow-title" href="#/product/' + p.id + '">' + t(p.title) + '</a>' +
          '<div class="crow-price">HK$' + fmtPrice(p.price) + '</div>' +
          '<div class="crow-bottom"><div class="qty">' +
            '<button data-action="cart-dec" data-id="' + p.id + '">−</button>' +
            '<span>' + x.qty + '</span>' +
            '<button data-action="cart-inc" data-id="' + p.id + '">+</button></div>' +
          '<button class="link-btn" data-action="cart-remove" data-id="' + p.id + '">' + t(UI.remove) + '</button>' +
          '</div></div></div>';
    }).join('');
    const sub = window.Store.cartSubtotal();
    return '<h2 class="sec-title">' + t(UI.navCart) + '</h2>' +
      '<div class="cart-list">' + rows + '</div>' +
      '<div class="cart-foot"><div class="cart-sub"><span>' + t(UI.subtotal) + '</span>' +
        '<b>HK$' + fmtPrice(sub) + '</b></div>' +
      '<a class="btn btn-buy btn-block" href="#/checkout">' + t(UI.checkout) + ' (' + window.Store.cartCount() + ')</a></div>';
  }

  function checkout() {
    const items = window.Store.cartItems();
    if (!items.length) return cart();
    const rows = items.map((x) =>
      '<div class="co-row"><span>' + t(x.product.title) + ' ×' + x.qty + '</span>' +
      '<span>HK$' + fmtPrice(x.product.price * x.qty) + '</span></div>').join('');
    const sub = window.Store.cartSubtotal();
    return '<h2 class="sec-title">' + t(UI.checkout) + '</h2>' +
      '<div class="co-summary">' + rows +
        '<div class="co-row co-total"><span>' + t(UI.total) + '</span><b>HK$' + fmtPrice(sub) + '</b></div></div>' +
      '<div class="co-note">💸 ' + t(UI.freeCheckoutNote) + '</div>' +
      '<button class="btn btn-buy btn-block btn-place" data-action="place">' + t(UI.placeOrder) + '</button>';
  }

  function orders() {
    const list = window.Store.getOrders();
    const saved = window.Store.saved();
    const savedBanner = '<div class="saved-banner"><span>' + t(UI.savedTotal) + '</span>' +
      '<b>HK$' + fmtPrice(saved) + '</b></div>';
    if (!list.length) {
      return '<h2 class="sec-title">' + t(UI.myOrders) + '</h2>' + savedBanner +
        '<div class="empty"><div class="empty-ico">📦</div><p>' + t(UI.noOrders) + '</p>' +
        '<p class="muted">' + t(UI.noOrdersHint) + '</p>' +
        '<a class="btn btn-buy" href="#/">' + t(UI.goShopping) + '</a></div>';
    }
    const cards = list.map((o) => {
      const thumbs = o.items.slice(0, 5).map((it) =>
        thumbHtml({ category: it.category, sheet: it.sheet, cell: it.cell }, 'ord-thumb')).join('');
      const count = o.items.reduce((a, it) => a + it.qty, 0);
      return '<div class="ord"><div class="ord-head"><span class="muted">' + t(UI.orderId) + ' ' + o.id + '</span>' +
        '<span class="muted">' + o.date.slice(0, 10) + '</span></div>' +
        '<div class="ord-thumbs">' + thumbs + '</div>' +
        '<div class="ord-foot"><span>' + count + ' ' + t(UI.items) + '</span>' +
        '<span class="saved-chip">' + t(UI.youSaved) + ' HK$' + fmtPrice(o.total) + '</span></div></div>';
    }).join('');
    return '<h2 class="sec-title">' + t(UI.myOrders) + '</h2>' + savedBanner +
      '<div class="ord-list">' + cards + '</div>';
  }

  function me() {
    const u = window.Store.user;
    const saved = window.Store.saved();
    const settingsLink = '<a class="row-link" href="#/settings">⚙️ ' + t(UI.settings) + '</a>';
    if (!u) {
      return '<h2 class="sec-title">' + t(UI.navMe) + '</h2>' +
        '<div class="login-box"><div class="login-ico">👤</div>' +
        '<input id="login-name" type="text" placeholder="' + t(UI.loginName) + '" maxlength="20">' +
        '<button class="btn btn-buy btn-block" data-action="login">' + t(UI.login) + '</button>' +
        '<p class="muted">' + t(UI.tagline) + '</p></div>' +
        settingsLink;
    }
    return '<h2 class="sec-title">' + t(UI.navMe) + '</h2>' +
      '<div class="profile"><div class="login-ico">😎</div>' +
        '<div class="profile-name">' + t(UI.hello) + ', ' + u + '</div></div>' +
      '<div class="saved-banner big"><span>' + t(UI.savedTotal) + '</span><b>HK$' + fmtPrice(saved) + '</b></div>' +
      '<a class="row-link" href="#/orders">📦 ' + t(UI.myOrders) + '</a>' +
      '<a class="row-link" href="#/cart">🛒 ' + t(UI.navCart) + '</a>' +
      settingsLink +
      '<button class="btn btn-line btn-block" data-action="logout">' + t(UI.logout) + '</button>';
  }

  function settings(draft) {
    const curTheme = draft ? draft.theme : window.Store.theme;
    const curLang = draft ? draft.lang : window.Store.lang;
    const dirty = draft && (draft.theme !== window.Store.theme || draft.lang !== window.Store.lang);
    const themes = [
      ['taobao', UI.themeTaobao, '#ff5000', '#ff7a00'],
      ['amazon', UI.themeAmazon, '#131921', '#ffa41c'],
      ['hktv', UI.themeHktv, '#84bd00', '#5c8a00'],
    ];
    const themeCards = themes.map((th) =>
      '<button class="theme-card' + (th[0] === curTheme ? ' sel' : '') + '" data-action="set-theme" data-theme="' + th[0] + '">' +
        '<span class="theme-swatch" style="background:linear-gradient(120deg,' + th[2] + ',' + th[3] + ')"></span>' +
        '<span class="theme-name">' + t(th[1]) + '</span>' +
        (th[0] === curTheme ? '<span class="theme-check">✓</span>' : '') +
      '</button>').join('');

    const langs = [['zh', '繁體中文'], ['en', 'English']];
    const langBtns = langs.map((l) =>
      '<button class="seg' + (l[0] === curLang ? ' sel' : '') + '" data-action="set-lang" data-lang="' + l[0] + '">' +
      l[1] + '</button>').join('');

    return '<h2 class="sec-title">⚙️ ' + t(UI.settings) + '</h2>' +
      '<section class="set-block"><h3 class="block-title">' + t(UI.storeTheme) + '</h3>' +
        '<p class="muted">' + t(UI.themeDesc) + '</p>' +
        '<div class="theme-grid">' + themeCards + '</div></section>' +
      '<section class="set-block"><h3 class="block-title">' + t(UI.language) + '</h3>' +
        '<div class="seg-group">' + langBtns + '</div></section>' +
      '<div class="save-bar">' +
        '<span class="save-hint">' + (dirty ? t(UI.saveHint) : '') + '</span>' +
        '<button class="btn btn-buy save-btn' + (dirty ? ' dirty' : '') + '" data-action="save-settings">' + t(UI.save) + '</button>' +
      '</div>';
  }

  window.Views = {
    home, categories, category, search, product, cart, checkout, orders, me, settings,
    fmtPrice, discount,
  };
})();
