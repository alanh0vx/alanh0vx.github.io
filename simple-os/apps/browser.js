// Web Browser App
os.registerApp({
    id: 'browser',
    name: 'Browser',
    icon: '🌐',
    category: 'utilities',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.currentUrl = '';
        this.history = [];
        this.historyIndex = -1;

        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    render(content) {
        content.innerHTML = `
            <div class="browser">
                <div class="browser-toolbar">
                    <button onclick="os.apps['browser'].back()" id="back-btn" disabled>◀</button>
                    <button onclick="os.apps['browser'].forward()" id="forward-btn" disabled>▶</button>
                    <button onclick="os.apps['browser'].reload()">⟳</button>
                    <input type="text" id="browser-url" placeholder="Enter URL or search..." onkeypress="if(event.key==='Enter') os.apps['browser'].navigate()">
                    <button onclick="os.apps['browser'].navigate()">Go</button>
                </div>
                <div id="browser-content" class="browser-content">
                    <div class="browser-home">
                        <h1>🌐 SimpleOS Browser</h1>
                        <p>Enter a URL in the address bar to browse the web.</p>
                        <div class="browser-notice">
                            <strong>⚠️ Note:</strong> Due to CORS (Cross-Origin Resource Sharing) restrictions,
                            most external websites cannot be loaded in this browser. This is a security limitation
                            of modern web browsers when embedding external content in iframes.
                        </div>
                        <div class="browser-quicklinks">
                            <h3>Quick Links</h3>
                            <button onclick="os.apps['browser'].navigateTo('https://www.google.com')">Google</button>
                            <button onclick="os.apps['browser'].navigateTo('https://www.wikipedia.org')">Wikipedia</button>
                            <button onclick="os.apps['browser'].navigateTo('https://github.com')">GitHub</button>
                            <p style="margin-top: 15px; font-size: 12px; color: #7f8c8d;">
                                <em>Note: Most sites will be blocked by CORS policy</em>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    navigate() {
        const urlInput = document.getElementById('browser-url');
        let url = urlInput.value.trim();

        if (!url) return;

        // Add https:// if no protocol specified
        if (!url.match(/^https?:\/\//)) {
            // Check if it looks like a domain
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                // Treat as search query
                url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
            }
        }

        this.navigateTo(url);
    },

    navigateTo(url) {
        this.currentUrl = url;

        // Add to history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(url);
        this.historyIndex++;

        this.updateButtons();
        this.loadUrl(url);

        const urlInput = document.getElementById('browser-url');
        if (urlInput) {
            urlInput.value = url;
        }
    },

    loadUrl(url) {
        const browserContent = document.getElementById('browser-content');
        browserContent.innerHTML = `
            <iframe src="${url}" class="browser-iframe" sandbox="allow-same-origin allow-scripts allow-forms"
                onerror="os.apps['browser'].showError()"></iframe>
            <div class="browser-error" id="browser-error" style="display: none;">
                <h2>⚠️ Cannot Load Page</h2>
                <p>This website cannot be displayed due to CORS (Cross-Origin Resource Sharing) restrictions.</p>
                <p>Most modern websites block being embedded in iframes for security reasons.</p>
            </div>
        `;

        // Check if iframe loads successfully
        const iframe = browserContent.querySelector('iframe');
        iframe.onload = () => {
            try {
                // Try to access iframe content - will throw error if CORS blocked
                iframe.contentWindow.document;
            } catch (e) {
                this.showError();
            }
        };
    },

    showError() {
        const errorEl = document.getElementById('browser-error');
        const iframe = document.querySelector('.browser-iframe');
        if (errorEl && iframe) {
            iframe.style.display = 'none';
            errorEl.style.display = 'block';
        }
    },

    back() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const url = this.history[this.historyIndex];
            this.currentUrl = url;
            this.loadUrl(url);

            const urlInput = document.getElementById('browser-url');
            if (urlInput) {
                urlInput.value = url;
            }

            this.updateButtons();
        }
    },

    forward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const url = this.history[this.historyIndex];
            this.currentUrl = url;
            this.loadUrl(url);

            const urlInput = document.getElementById('browser-url');
            if (urlInput) {
                urlInput.value = url;
            }

            this.updateButtons();
        }
    },

    reload() {
        if (this.currentUrl) {
            this.loadUrl(this.currentUrl);
        }
    },

    updateButtons() {
        const backBtn = document.getElementById('back-btn');
        const forwardBtn = document.getElementById('forward-btn');

        if (backBtn) {
            backBtn.disabled = this.historyIndex <= 0;
        }

        if (forwardBtn) {
            forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }
});
