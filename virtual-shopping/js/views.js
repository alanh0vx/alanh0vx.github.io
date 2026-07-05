/* views.js — pure render helpers. Each returns an HTML string; App sets it into #app.
 * No DOM mutation here except via the returned markup.
 * Views emit superset markup: mobile-only and desktop-only elements are both
 * rendered and CSS shows/hides them by body[data-layout], so crossing the
 * breakpoint never has to re-render #app.
 */
(function () {
  const t = window.t;
  const UI = window.UI;

  // ---- escaping (user-provided strings must go through this before innerHTML) ----
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

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

  // Sprite thumb with a category-coloured fallback (glyph) shown until the sheet loads.
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

  // Per-theme shipping label (deterministic: items over HK$99 "ship free").
  // All three variants are rendered; themes.css shows the one for the active theme.
  function shipHtml(p) {
    if (p.price < 99) return '';
    return '<div class="card-ship">' +
      '<span class="ship-amazon">' + t(UI.shipAmazon) + '</span>' +
      '<span class="ship-hktv">' + t(UI.shipHktv) + '</span>' +
      '<span class="ship-taobao">' + t(UI.shipTaobao) + '</span></div>';
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
        shipHtml(p) +
      '</div></a>';
  }

  function grid(list) {
    if (!list.length) return '<div class="empty"><div class="empty-ico">🔍</div><p>' + t(UI.noResults) + '</p></div>';
    return '<div class="grid">' + list.map(productCard).join('') + '</div>';
  }

  // ---- mini strips (related / recently viewed) ----
  function miniCard(p) {
    return '<a class="mini" href="#/product/' + p.id + '">' + thumbHtml(p, 'mini-thumb') +
      '<div class="mini-title">' + t(p.title) + '</div>' +
      '<div class="mini-price">HK$' + fmtPrice(p.price) + '</div></a>';
  }
  function miniStrip(title, list) {
    if (!list.length) return '';
    return '<section class="strip"><div class="strip-head"><span class="strip-title">' + title +
      '</span></div><div class="mini-row">' + list.map(miniCard).join('') + '</div></section>';
  }
  function relatedList(p) {
    return window.PRODUCTS
      .filter((x) => x.category === p.category && x.id !== p.id)
      .sort((a, b) => b.ratingCount - a.ratingCount)
      .slice(0, 8);
  }
  function recentList(excludeId) {
    return window.Store.recent()
      .filter((id) => id !== excludeId)
      .map((id) => window.getProduct(id))
      .filter(Boolean)
      .slice(0, 8);
  }

  // ---- sorting + filtering ----
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

  function applyFilters(list, f) {
    if (!f) return list;
    let out = list;
    if (f.price === 'lt100') out = out.filter((p) => p.price < 100);
    else if (f.price === '100-500') out = out.filter((p) => p.price >= 100 && p.price <= 500);
    else if (f.price === 'gt500') out = out.filter((p) => p.price > 500);
    if (f.minRating) out = out.filter((p) => p.rating >= f.minRating);
    if (f.dealsOnly) out = out.filter((p) => discount(p) > 0);
    return out;
  }

  function filtersHtml(f) {
    f = f || { price: '', minRating: 0, dealsOnly: false };
    const radio = (val, label) =>
      '<label><input type="radio" name="f-price" data-filter="price" value="' + val + '"' +
      ((f.price || '') === val ? ' checked' : '') + '> ' + label + '</label>';
    return '<aside class="filters">' +
      '<h3 class="f-heading">' + t(UI.filters) + '</h3>' +
      '<div class="f-group"><div class="f-title">' + t(UI.priceRange) + '</div>' +
        radio('', t(UI.priceAll)) +
        radio('lt100', t(UI.priceUnder100)) +
        radio('100-500', t(UI.price100to500)) +
        radio('gt500', t(UI.priceOver500)) +
      '</div>' +
      '<div class="f-group"><div class="f-title">' + t(UI.rating) + '</div>' +
        '<label><input type="checkbox" data-filter="rating"' + (f.minRating ? ' checked' : '') + '> ' + t(UI.ratingUp) + '</label>' +
      '</div>' +
      '<div class="f-group">' +
        '<label><input type="checkbox" data-filter="deals"' + (f.dealsOnly ? ' checked' : '') + '> ' + t(UI.dealsOnly) + '</label>' +
      '</div>' +
      '<button class="link-btn" data-action="filter-clear">' + t(UI.clearFilters) + '</button>' +
    '</aside>';
  }

  // Shared shell for category/search pages: filter sidebar (desktop) + sort + grid.
  function listing(cls, titleHtml, list, sort, filters) {
    const filtered = sortList(applyFilters(list, filters), sort);
    return '<div class="' + cls + '">' +
      '<div class="page-head"><h2 class="sec-title">' + titleHtml + '</h2>' +
        '<span class="muted">' + filtered.length + ' ' + t(UI.items) + '</span></div>' +
      '<div class="listing">' + filtersHtml(filters) +
        '<div class="listing-main">' + sortSelect(sort) + grid(filtered) + '</div>' +
      '</div></div>';
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
    const slide = (title, sub) =>
      '<div class="hero-slide"><div class="hero-title">' + title + '</div>' +
      '<div class="hero-sub">' + sub + '</div></div>';

    return '<div class="home">' +
      '<div class="hero">' +
        slide(t(UI.brand), t(UI.tagline)) +
        slide('⚡ ' + t(UI.heroDeals), t(UI.heroDealsSub)) +
        slide('💸 ' + t(UI.heroFree), t(UI.heroFreeSub)) +
      '</div>' +
      '<div class="chips">' + chips + '</div>' +
      '<section class="strip"><div class="strip-head"><span class="strip-title">⚡ ' + t(UI.flashDeals) +
        '</span></div><div class="deal-row">' + dealRow + '</div></section>' +
      miniStrip('🕘 ' + t(UI.recentlyViewed), recentList(null)) +
      '<h2 class="sec-title">' + t(UI.recommended) + '</h2>' + grid(rec) +
    '</div>';
  }

  function categories() {
    const cards = window.CATEGORIES.map((c) =>
      '<a class="cat-card" href="#/category/' + c.id + '" style="background:' + c.color + '">' +
      '<span class="cat-ico">' + c.icon + '</span><span class="cat-name">' + t(c.name) + '</span></a>').join('');
    return '<h2 class="sec-title">' + t(UI.allCategories) + '</h2><div class="cat-grid">' + cards + '</div>';
  }

  function category(id, sort, filters) {
    const cat = window.CAT_BY_ID[id];
    if (!cat) return categories();
    const list = window.PRODUCTS.filter((p) => p.category === id);
    return crumb(cat) +
      listing('category-page', cat.icon + ' ' + t(cat.name), list, sort, filters);
  }

  function search(q, sort, filters, catId) {
    const query = (q || '').trim().toLowerCase();
    let list = window.PRODUCTS;
    if (catId && window.CAT_BY_ID[catId]) list = list.filter((p) => p.category === catId);
    if (query) {
      list = list.filter((p) =>
        t(p.title).toLowerCase().includes(query) ||
        p.title.en.toLowerCase().includes(query) ||
        p.title.zh.includes(q.trim()) ||
        p.tags.some((tag) => tag.toLowerCase().includes(query)));
    }
    const catLabel = (catId && window.CAT_BY_ID[catId]) ? ' · ' + t(window.CAT_BY_ID[catId].name) : '';
    return listing('search-page',
      t(UI.resultsFor) + ' "' + esc(q || '') + '"' + catLabel, list, sort, filters);
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

  function buyboxHtml(p) {
    const qtyOpts = [];
    for (let i = 1; i <= 10; i++) qtyOpts.push('<option value="' + i + '">' + i + '</option>');
    return '<aside class="pd-buybox">' +
      '<div class="bb-price">' + priceHtml(p) + '</div>' +
      '<div class="bb-ship">✓ ' + t(UI.freeDelivery) + '</div>' +
      '<div class="bb-stock">' + t(UI.inStock) + '</div>' +
      '<div class="bb-qty"><label>' + t(UI.qty) + '</label>' +
        '<select data-action="pd-qty-select">' + qtyOpts.join('') + '</select></div>' +
      '<button class="btn btn-cart" data-action="add" data-id="' + p.id + '">' + t(UI.addToCart) + '</button>' +
      '<button class="btn btn-buy" data-action="buy" data-id="' + p.id + '">' + t(UI.buyNow) + '</button>' +
      '<div class="bb-note">💸 ' + t(UI.freeCheckoutNote) + '</div>' +
      '<div class="bb-seller">' + t(UI.seller) + ': <b>' + t(p.seller) + '</b></div>' +
    '</aside>';
  }

  function product(id) {
    const p = window.getProduct(id);
    if (!p) return '<div class="empty"><p>' + t(UI.noResults) + '</p></div>';
    const cat = window.CAT_BY_ID[p.category];
    return '<div class="pd">' +
      '<button class="back" data-action="back">‹</button>' +
      crumb(cat, t(p.title)) +
      '<div class="pd-main">' +
        '<div class="pd-media">' + thumbHtml(p, 'pd-thumb') + '</div>' +
        '<div class="pd-info">' +
          '<div class="pd-price">' + priceHtml(p) + '</div>' +
          '<h1 class="pd-title">' + t(p.title) + '</h1>' +
          '<div class="pd-rating" data-action="scroll-reviews">' + starsHtml(p.rating) +
            '<span class="rcount">' + p.rating.toFixed(1) + ' · ' + fmtCount(p.ratingCount) + ' ' + t(UI.ratingsCount) + '</span></div>' +
          '<div class="pd-seller">' + t(UI.seller) + ': <b>' + t(p.seller) + '</b></div>' +
          merchChips() +
          shipHtml(p) +
        '</div>' +
        buyboxHtml(p) +
      '</div>' +
      '<section class="pd-desc"><h3 class="block-title">' + t(UI.description) + '</h3>' +
        '<p>' + window.Store.description(p) + '</p>' +
        '<div class="tags">' + p.tags.map((x) => '<span class="tag">#' + x + '</span>').join('') + '</div></section>' +
      '<a id="reviews"></a>' + reviewsBlock(p) +
      miniStrip('🛍️ ' + t(UI.alsoBought), relatedList(p)) +
      miniStrip('🕘 ' + t(UI.recentlyViewed), recentList(p.id)) +
      '<div class="pd-bar">' +
        '<div class="qty"><button data-action="pd-dec">−</button>' +
          '<span class="pd-qty-val">1</span><button data-action="pd-inc">+</button></div>' +
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
          '</div></div>' +
        '<div class="crow-line">HK$' + fmtPrice(p.price * x.qty) + '</div></div>';
    }).join('');
    const sub = window.Store.cartSubtotal();
    const count = window.Store.cartCount();
    return '<h2 class="sec-title">' + t(UI.navCart) + '</h2>' +
      '<div class="cart-page">' +
        '<div class="cart-list">' + rows + '</div>' +
        '<aside class="cart-summary">' +
          '<div class="cs-sub"><span>' + t(UI.subtotal) + ' (' + count + ' ' + t(UI.items) + ')</span>' +
            '<b>HK$' + fmtPrice(sub) + '</b></div>' +
          '<div class="cs-note">💸 ' + t(UI.freeCheckoutNote) + '</div>' +
          '<a class="btn btn-buy btn-block" href="#/checkout">' + t(UI.proceedCheckout) + '</a>' +
        '</aside>' +
      '</div>' +
      '<div class="cart-foot"><div class="cart-sub"><span>' + t(UI.subtotal) + '</span>' +
        '<b>HK$' + fmtPrice(sub) + '</b></div>' +
      '<a class="btn btn-buy btn-block" href="#/checkout">' + t(UI.checkout) + ' (' + count + ')</a></div>';
  }

  function checkout() {
    const items = window.Store.cartItems();
    if (!items.length) return cart();
    const addr = window.Store.getAddr();
    const rows = items.map((x) =>
      '<div class="co-row"><span>' + t(x.product.title) + ' ×' + x.qty + '</span>' +
      '<span>HK$' + fmtPrice(x.product.price * x.qty) + '</span></div>').join('');
    const sub = window.Store.cartSubtotal();

    const districts = window.DISTRICTS.map((d, i) =>
      '<option value="' + i + '"' + (String(addr.district) === String(i) ? ' selected' : '') + '>' +
      t(d) + '</option>').join('');
    const payOpt = (val, ico, label, checked) =>
      '<label class="pay-opt"><input type="radio" name="co-pay" value="' + val + '"' +
      (checked ? ' checked' : '') + '> ' + ico + ' ' + label + '</label>';

    return '<h2 class="sec-title">' + t(UI.checkout) + '</h2>' +
      '<div class="co-grid">' +
        '<div class="co-main">' +
          '<section class="co-block"><h3 class="block-title">📦 ' + t(UI.shippingAddress) + '</h3>' +
            '<div class="co-fields">' +
              '<label class="co-field"><span class="f-label">' + t(UI.fullName) + '</span>' +
                '<input id="co-name" class="co-input" maxlength="30" value="' + esc(addr.name || '') + '"></label>' +
              '<label class="co-field"><span class="f-label">' + t(UI.district) + '</span>' +
                '<select id="co-district" class="co-select">' + districts + '</select></label>' +
              '<label class="co-field co-field--wide"><span class="f-label">' + t(UI.addressLine) + '</span>' +
                '<input id="co-line" class="co-input" maxlength="60" value="' + esc(addr.line || '') + '"></label>' +
            '</div>' +
          '</section>' +
          '<section class="co-block"><h3 class="block-title">💳 ' + t(UI.paymentMethod) + '</h3>' +
            payOpt('cool', '🛍️', t(UI.payCool), true) +
            payOpt('card', '💳', t(UI.payCard), false) +
            payOpt('fps', '⚡', t(UI.payFps), false) +
          '</section>' +
        '</div>' +
        '<div class="co-side">' +
          '<div class="co-summary"><h3 class="block-title">' + t(UI.orderSummary) + '</h3>' + rows +
            '<div class="co-row co-total"><span>' + t(UI.total) + '</span><b>HK$' + fmtPrice(sub) + '</b></div></div>' +
          '<div class="co-note">💸 ' + t(UI.freeCheckoutNote) + '</div>' +
          '<button class="btn btn-buy btn-block btn-place" data-action="place">' + t(UI.placeOrder) + '</button>' +
        '</div>' +
      '</div>';
  }

  function orders() {
    const list = window.Store.getOrders();
    const saved = window.Store.saved();
    const savedBanner = '<div class="saved-banner"><span>' + t(UI.savedTotal) + '</span>' +
      '<b>HK$' + fmtPrice(saved) + '</b></div>';
    if (!list.length) {
      return '<div class="narrow"><h2 class="sec-title">' + t(UI.myOrders) + '</h2>' + savedBanner +
        '<div class="empty"><div class="empty-ico">📦</div><p>' + t(UI.noOrders) + '</p>' +
        '<p class="muted">' + t(UI.noOrdersHint) + '</p>' +
        '<a class="btn btn-buy" href="#/">' + t(UI.goShopping) + '</a></div></div>';
    }
    const cards = list.map((o) => {
      const thumbs = o.items.slice(0, 5).map((it) =>
        thumbHtml({ category: it.category, sheet: it.sheet, cell: it.cell }, 'ord-thumb')).join('');
      const lines = o.items.map((it) =>
        '<div>' + t(it.title) + ' ×' + it.qty + '</div>').join('');
      const count = o.items.reduce((a, it) => a + it.qty, 0);
      return '<div class="ord"><div class="ord-head"><span class="muted">' + t(UI.orderId) + ' ' + o.id + '</span>' +
        '<span class="muted">' + o.date.slice(0, 10) + '</span></div>' +
        '<div class="ord-thumbs">' + thumbs + '</div>' +
        '<div class="ord-items">' + lines + '</div>' +
        '<div class="ord-foot"><span>' + count + ' ' + t(UI.items) + '</span>' +
        '<span class="saved-chip">' + t(UI.youSaved) + ' HK$' + fmtPrice(o.total) + '</span></div></div>';
    }).join('');
    return '<div class="narrow"><h2 class="sec-title">' + t(UI.myOrders) + '</h2>' + savedBanner +
      '<div class="ord-list">' + cards + '</div></div>';
  }

  function me() {
    const u = window.Store.user;
    const saved = window.Store.saved();
    const settingsLink = '<a class="row-link" href="#/settings">⚙️ ' + t(UI.settings) + '</a>';
    if (!u) {
      return '<div class="narrow"><h2 class="sec-title">' + t(UI.navMe) + '</h2>' +
        '<div class="login-box"><div class="login-ico">👤</div>' +
        '<input id="login-name" type="text" placeholder="' + t(UI.loginName) + '" maxlength="20">' +
        '<button class="btn btn-buy btn-block" data-action="login">' + t(UI.login) + '</button>' +
        '<p class="muted">' + t(UI.tagline) + '</p></div>' +
        settingsLink + '</div>';
    }
    return '<div class="narrow"><h2 class="sec-title">' + t(UI.navMe) + '</h2>' +
      '<div class="profile"><div class="login-ico">😎</div>' +
        '<div class="profile-name">' + t(UI.hello) + ', ' + esc(u) + '</div></div>' +
      '<div class="saved-banner big"><span>' + t(UI.savedTotal) + '</span><b>HK$' + fmtPrice(saved) + '</b></div>' +
      '<a class="row-link" href="#/orders">📦 ' + t(UI.myOrders) + '</a>' +
      '<a class="row-link" href="#/cart">🛒 ' + t(UI.navCart) + '</a>' +
      settingsLink +
      '<button class="btn btn-line btn-block" data-action="logout">' + t(UI.logout) + '</button></div>';
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

    return '<div class="narrow"><h2 class="sec-title">⚙️ ' + t(UI.settings) + '</h2>' +
      '<section class="set-block"><h3 class="block-title">' + t(UI.storeTheme) + '</h3>' +
        '<p class="muted">' + t(UI.themeDesc) + '</p>' +
        '<div class="theme-grid">' + themeCards + '</div></section>' +
      '<section class="set-block"><h3 class="block-title">' + t(UI.language) + '</h3>' +
        '<div class="seg-group">' + langBtns + '</div></section>' +
      '<div class="save-bar">' +
        '<span class="save-hint">' + (dirty ? t(UI.saveHint) : '') + '</span>' +
        '<button class="btn btn-buy save-btn' + (dirty ? ' dirty' : '') + '" data-action="save-settings">' + t(UI.save) + '</button>' +
      '</div></div>';
  }

  window.Views = {
    home, categories, category, search, product, cart, checkout, orders, me, settings,
    fmtPrice, discount, esc,
  };
})();
