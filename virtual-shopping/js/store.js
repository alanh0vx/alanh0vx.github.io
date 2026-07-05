/* store.js — localStorage persistence + deterministic review/description generation.
 * Cart, orders and "money saved" are namespaced per logged-in user (guest fallback).
 * Reviews are generated from a seeded PRNG (stable across reloads), not stored.
 */
(function () {
  // ---- seeded PRNG ----
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

  // ---- review phrase pools (bilingual, bucketed by sentiment) ----
  const NAMES = ['陳大文', '李敏儀', '黃志強', '張嘉欣', '劉家俊', 'Karen L.', 'kelvin_88',
    'Sammi C.', '阿傑', 'Wing', '財叔', '小敏', 'Tom W.', '梁俊傑', '周敏華', 'HK_shopper',
    'Jacky', '阿May', 'Peter C.', '芷晴'];

  const TITLES = {
    hi: [{ en: 'Excellent!', zh: '非常滿意！' }, { en: 'Highly recommend', zh: '大力推薦' },
      { en: 'Better than expected', zh: '超出預期' }, { en: 'Great value', zh: '抵買！' },
      { en: 'Love it', zh: '好正' }],
    mid: [{ en: 'Pretty good', zh: '幾好' }, { en: 'Does the job', zh: '夠用' },
      { en: 'Okay overall', zh: '整體OK' }, { en: 'Fair for the price', zh: '價錢合理' }],
    lo: [{ en: 'A bit disappointed', zh: '有點失望' }, { en: 'Not as described', zh: '與描述不符' },
      { en: 'Could be better', zh: '可以更好' }, { en: 'Wouldn\'t buy again', zh: '唔會再買' }],
  };
  const BODIES = {
    hi: [
      { en: 'Exactly what I wanted. Fast delivery and great quality.', zh: '完全符合期望，送貨快，質素好。' },
      { en: 'Using it every day, super happy with the purchase.', zh: '每日都用，非常滿意這次購買。' },
      { en: 'Feels premium and works perfectly. Worth every dollar.', zh: '質感高級，運作完美，物超所值。' },
      { en: 'Bought one for my family too. Can\'t fault it.', zh: '幫屋企人都買多一個，無得彈。' },
      { en: 'Looks even better in person. Five stars.', zh: '實物仲靚過相，五粒星。' },
    ],
    mid: [
      { en: 'Works fine but nothing special. Decent for the price.', zh: '用得，無乜特別，呢個價錢算可以。' },
      { en: 'Good enough for daily use, packaging was so-so.', zh: '日常用足夠，包裝麻麻地。' },
      { en: 'Met expectations, delivery took a few days.', zh: '符合預期，送貨慢咗幾日。' },
      { en: 'Solid product, would have liked more colour options.', zh: '產品OK，希望有多啲顏色選擇。' },
    ],
    lo: [
      { en: 'Quality felt cheaper than I hoped.', zh: '質感比想像中差。' },
      { en: 'Stopped working after a short while.', zh: '用咗一陣就出問題。' },
      { en: 'The size was different from the photos.', zh: '尺寸同相片有出入。' },
      { en: 'Customer service was slow to respond.', zh: '客服回覆得好慢。' },
    ],
  };

  function biasedStar(rating, rng) {
    const w = []; let tot = 0;
    for (let s = 1; s <= 5; s++) {
      const d = s - rating;
      const wt = Math.exp(-(d * d) / (2 * 0.7 * 0.7));
      w.push(wt); tot += wt;
    }
    let r = rng() * tot;
    for (let s = 1; s <= 5; s++) { r -= w[s - 1]; if (r <= 0) return s; }
    return 5;
  }

  function dateFromDaysAgo(d) {
    const dt = new Date(Date.now() - d * 86400000);
    return dt.toISOString().slice(0, 10);
  }

  const Store = {
    lang: localStorage.getItem('vs:lang') || 'zh',
    user: localStorage.getItem('vs:user') || null,
    theme: localStorage.getItem('vs:theme') || 'hktv',

    setLang(l) { this.lang = l; localStorage.setItem('vs:lang', l); },
    setTheme(th) { this.theme = th; localStorage.setItem('vs:theme', th); },

    ns(base) { return 'vs:' + base + ':' + (this.user || 'guest'); },

    // ---- cart ----
    getCart() { try { return JSON.parse(localStorage.getItem(this.ns('cart')) || '{}'); } catch (e) { return {}; } },
    saveCart(c) { localStorage.setItem(this.ns('cart'), JSON.stringify(c)); },
    addToCart(id, q) { const c = this.getCart(); c[id] = (c[id] || 0) + (q || 1); this.saveCart(c); },
    setQty(id, q) { const c = this.getCart(); if (q <= 0) delete c[id]; else c[id] = q; this.saveCart(c); },
    removeFromCart(id) { const c = this.getCart(); delete c[id]; this.saveCart(c); },
    clearCart() { this.saveCart({}); },
    cartCount() { return Object.values(this.getCart()).reduce((a, b) => a + b, 0); },
    cartItems() {
      const c = this.getCart();
      return Object.keys(c).map((id) => ({ product: window.getProduct(id), qty: c[id] }))
        .filter((x) => x.product);
    },
    cartSubtotal() { return this.cartItems().reduce((a, x) => a + x.product.price * x.qty, 0); },

    // ---- orders + money saved ----
    getOrders() { try { return JSON.parse(localStorage.getItem(this.ns('orders')) || '[]'); } catch (e) { return []; } },
    saved() { return parseFloat(localStorage.getItem(this.ns('saved')) || '0'); },
    placeOrder() {
      const items = this.cartItems();
      if (!items.length) return null;
      const total = this.cartSubtotal();
      const order = {
        id: 'VS' + Date.now(),
        date: new Date().toISOString(),
        total,
        items: items.map((x) => ({
          id: x.product.id, qty: x.qty, price: x.product.price,
          title: x.product.title, sheet: x.product.sheet, cell: x.product.cell,
          category: x.product.category,
        })),
      };
      const orders = this.getOrders();
      orders.unshift(order);
      localStorage.setItem(this.ns('orders'), JSON.stringify(orders));
      localStorage.setItem(this.ns('saved'), String(this.saved() + total));
      this.clearCart();
      return order;
    },

    // ---- recently viewed (per user, most recent first, max 12) ----
    recent() { try { return JSON.parse(localStorage.getItem(this.ns('recent')) || '[]'); } catch (e) { return []; } },
    pushRecent(id) {
      if (!window.getProduct(id)) return;
      const r = this.recent().filter((x) => x !== id);
      r.unshift(id);
      localStorage.setItem(this.ns('recent'), JSON.stringify(r.slice(0, 12)));
    },

    // ---- shipping address (cosmetic, per user) ----
    getAddr() { try { return JSON.parse(localStorage.getItem(this.ns('addr')) || '{}'); } catch (e) { return {}; } },
    saveAddr(a) { localStorage.setItem(this.ns('addr'), JSON.stringify(a)); },

    // ---- auth (cosmetic) ----
    login(name) { this.user = name; localStorage.setItem('vs:user', name); },
    logout() { this.user = null; localStorage.removeItem('vs:user'); },

    // ---- deterministic content ----
    reviews(p) {
      const rng = mulberry32(hashStr(p.id));
      const n = 6 + Math.floor(rng() * 7); // 6..12
      const list = [];
      for (let i = 0; i < n; i++) {
        const stars = biasedStar(p.rating, rng);
        const bucket = stars >= 4 ? 'hi' : stars === 3 ? 'mid' : 'lo';
        list.push({
          stars,
          title: pick(TITLES[bucket], rng),
          body: pick(BODIES[bucket], rng),
          name: pick(NAMES, rng),
          date: dateFromDaysAgo(1 + Math.floor(rng() * 700)),
          verified: rng() > 0.2,
        });
      }
      list.sort((a, b) => (a.date < b.date ? 1 : -1));
      return list;
    },

    // 5★..1★ percentage bars derived from the product's average (reflects ratingCount).
    ratingDist(rating) {
      const w = []; let tot = 0;
      for (let s = 1; s <= 5; s++) {
        const d = s - rating;
        w.push(Math.exp(-(d * d) / (2 * 0.6 * 0.6)));
        tot += w[s - 1];
      }
      return [5, 4, 3, 2, 1].map((s) => Math.round((w[s - 1] / tot) * 100));
    },

    description(p) {
      const INTRO = {
        en: ['Designed for everyday use.', 'A customer favourite.', 'Premium quality at a great price.', 'Top-rated in its category.'],
        zh: ['專為日常使用而設。', '人氣熱賣之選。', '優質之選，價格實惠。', '同類產品中評價最高。'],
      };
      const FEAT = {
        en: ['durable and reliable', 'lightweight and easy to use', 'loved by thousands of customers', 'made with carefully selected materials', 'a sleek, modern design'],
        zh: ['耐用可靠', '輕巧易用', '深受數千名顧客好評', '採用嚴選用料', '時尚簡約設計'],
      };
      const rng = mulberry32(hashStr(p.id + 'd'));
      const i1 = Math.floor(rng() * INTRO.en.length);
      const f1 = Math.floor(rng() * FEAT.en.length);
      let f2 = Math.floor(rng() * FEAT.en.length);
      if (f2 === f1) f2 = (f2 + 1) % FEAT.en.length;
      const L = this.lang;
      if (L === 'zh') {
        return window.t(p.title) + '。' + INTRO.zh[i1] + FEAT.zh[f1] + '，' + FEAT.zh[f2] + '。';
      }
      return window.t(p.title) + '. ' + INTRO.en[i1] + ' It is ' + FEAT.en[f1] + ' and ' + FEAT.en[f2] + '.';
    },
  };

  window.Store = Store;
  window.t = function (o) {
    if (o == null) return '';
    if (typeof o === 'string') return o;
    return o[Store.lang] || o.en || o.zh || '';
  };
})();
