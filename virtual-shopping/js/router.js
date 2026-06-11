/* router.js — tiny hash router. Parses #/path?query and hands it to a callback. */
(function () {
  const Router = {
    start(cb) {
      this.cb = cb;
      window.addEventListener('hashchange', () => this.resolve());
      this.resolve();
    },
    resolve() {
      const raw = location.hash.replace(/^#/, '') || '/';
      const qi = raw.indexOf('?');
      const path = qi === -1 ? raw : raw.slice(0, qi);
      const query = {};
      if (qi !== -1) {
        raw.slice(qi + 1).split('&').forEach((kv) => {
          const eq = kv.indexOf('=');
          const k = decodeURIComponent(eq === -1 ? kv : kv.slice(0, eq));
          const v = decodeURIComponent(eq === -1 ? '' : kv.slice(eq + 1));
          query[k] = v;
        });
      }
      if (this.cb) this.cb(path, query);
    },
    go(path) { location.hash = path; },
    replace(path) {
      history.replaceState(null, '', location.pathname + location.search + '#' + path);
      this.resolve();
    },
  };
  window.Router = Router;
})();
