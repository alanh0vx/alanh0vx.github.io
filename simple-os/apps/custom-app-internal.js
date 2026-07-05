// Custom App Builder - Internal
os.registerApp({
    id: 'custom-app-internal',
    name: 'Internal App Builder',
    icon: '🔧',
    category: 'custom',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.loadCustomApps();
        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    loadCustomApps() {
        const saved = localStorage.getItem('custom_internal_apps');
        this.customApps = saved ? JSON.parse(saved) : [];
    },

    saveCustomApps() {
        localStorage.setItem('custom_internal_apps', JSON.stringify(this.customApps));
    },

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;'
        };
        return text.replace(/[&<>"'/]/g, m => map[m]);
    },

    sanitizeCode(code) {
        // Remove script tags and dangerous patterns
        const dangerous = [
            /<script[^>]*>[\s\S]*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /Function\s*\(/gi
        ];

        let sanitized = code;
        dangerous.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });

        return sanitized;
    },

    render(content) {
        content.innerHTML = `
            <div class="custom-app-builder">
                <div class="builder-header">
                    <h2>⚡ Internal App Builder</h2>
                    <p>Create your own internal apps with HTML and CSS</p>
                </div>

                <div class="builder-container">
                    <div class="builder-form">
                        <h3>Create New App</h3>

                        <div class="form-group">
                            <label>App Name:</label>
                            <input type="text" id="app-name" placeholder="My Custom App" maxlength="50">
                        </div>

                        <div class="form-group">
                            <label>App Icon (emoji):</label>
                            <input type="text" id="app-icon" placeholder="🎨" maxlength="2">
                        </div>

                        <div class="form-group">
                            <label>HTML Content:</label>
                            <textarea id="app-html" rows="8" placeholder="<h1>Hello World!</h1>
<p>Your custom app content here</p>"></textarea>
                            <small>⚠️ JavaScript is disabled for security. Use HTML and CSS only.</small>
                        </div>

                        <div class="form-group">
                            <label>CSS Styles (optional):</label>
                            <textarea id="app-css" rows="6" placeholder=".my-class {
    color: #ff6b35;
    padding: 20px;
}"></textarea>
                        </div>

                        <button onclick="os.apps['custom-app-internal'].createApp()" class="create-btn">
                            ✨ Create App
                        </button>
                    </div>

                    <div class="builder-apps">
                        <h3>Your Custom Apps</h3>
                        <div id="custom-apps-list">
                            ${this.renderAppsList()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderAppsList() {
        if (this.customApps.length === 0) {
            return '<p class="empty-message">No custom apps yet. Create one!</p>';
        }

        return this.customApps.map((app, index) => `
            <div class="custom-app-item">
                <div class="app-info">
                    <span class="app-icon-display">${this.escapeHtml(app.icon)}</span>
                    <span class="app-name-display">${this.escapeHtml(app.name)}</span>
                </div>
                <div class="app-actions">
                    <button onclick="os.apps['custom-app-internal'].launchCustomApp(${index})" class="launch-btn">
                        ▶️ Launch
                    </button>
                    <button onclick="os.apps['custom-app-internal'].deleteApp(${index})" class="delete-btn">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    createApp() {
        const name = document.getElementById('app-name').value.trim();
        const icon = document.getElementById('app-icon').value.trim();
        const html = document.getElementById('app-html').value.trim();
        const css = document.getElementById('app-css').value.trim();

        if (!name) {
            os.ui.toast('Enter an app name', { type: 'error' });
            return;
        }

        if (!icon) {
            os.ui.toast('Enter an app icon (emoji)', { type: 'error' });
            return;
        }

        if (!html) {
            os.ui.toast('Enter HTML content', { type: 'error' });
            return;
        }

        // Sanitize inputs
        const sanitizedHtml = this.sanitizeCode(html);
        const sanitizedCss = this.sanitizeCode(css);

        const customApp = {
            name: this.escapeHtml(name),
            icon: this.escapeHtml(icon),
            html: sanitizedHtml,
            css: sanitizedCss,
            created: new Date().toISOString()
        };

        this.customApps.push(customApp);
        this.saveCustomApps();

        // Clear form
        document.getElementById('app-name').value = '';
        document.getElementById('app-icon').value = '';
        document.getElementById('app-html').value = '';
        document.getElementById('app-css').value = '';

        // Refresh list
        document.getElementById('custom-apps-list').innerHTML = this.renderAppsList();

        os.ui.toast(`App "${name}" created`, { type: 'success' });
    },

    launchCustomApp(index) {
        const app = this.customApps[index];
        if (!app) return;

        // Create a temporary window to display the custom app
        const windowId = os.createWindow({
            id: `custom-app-${Date.now()}`,
            name: app.name,
            icon: app.icon,
            category: 'custom'
        });

        const content = os.getWindowContent(windowId);
        content.innerHTML = `
            <style>
                .custom-app-content {
                    padding: 20px;
                    height: 100%;
                    overflow: auto;
                }
                ${app.css}
            </style>
            <div class="custom-app-content">
                ${app.html}
            </div>
        `;
    },

    async deleteApp(index) {
        const app = this.customApps[index];
        if (!await os.ui.confirm(`Delete "${app.name}"?`, { title: 'Delete App', danger: true })) {
            return;
        }

        this.customApps.splice(index, 1);
        this.saveCustomApps();

        // Refresh list
        document.getElementById('custom-apps-list').innerHTML = this.renderAppsList();
    }
});
