// Custom App Builder - External
os.registerApp({
    id: 'custom-app-external',
    name: 'External App Builder',
    icon: '🌐',
    category: 'custom',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.loadCustomApps();
        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    loadCustomApps() {
        const saved = localStorage.getItem('custom_external_apps');
        this.customApps = saved ? JSON.parse(saved) : [];
    },

    saveCustomApps() {
        localStorage.setItem('custom_external_apps', JSON.stringify(this.customApps));
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

    validateUrl(url) {
        try {
            const urlObj = new URL(url);
            // Only allow http and https protocols
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    },

    render(content) {
        content.innerHTML = `
            <div class="custom-app-builder">
                <div class="builder-header">
                    <h2>🌐 External App Builder</h2>
                    <p>Add external web apps that open in new tabs</p>
                </div>

                <div class="builder-container">
                    <div class="builder-form">
                        <h3>Add External App</h3>

                        <div class="form-group">
                            <label>App Name:</label>
                            <input type="text" id="ext-app-name" placeholder="My External App" maxlength="50">
                        </div>

                        <div class="form-group">
                            <label>App Icon (emoji):</label>
                            <input type="text" id="ext-app-icon" placeholder="🔗" maxlength="2">
                        </div>

                        <div class="form-group">
                            <label>App URL:</label>
                            <input type="url" id="ext-app-url" placeholder="https://example.com">
                            <small>⚠️ Must be a valid HTTP/HTTPS URL</small>
                        </div>

                        <div class="form-group">
                            <label>Description (optional):</label>
                            <textarea id="ext-app-desc" rows="3" placeholder="A brief description of your app..." maxlength="200"></textarea>
                        </div>

                        <button onclick="os.apps['custom-app-external'].createApp()" class="create-btn">
                            ✨ Add App
                        </button>
                    </div>

                    <div class="builder-apps">
                        <h3>Your External Apps</h3>
                        <div id="custom-ext-apps-list">
                            ${this.renderAppsList()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderAppsList() {
        if (this.customApps.length === 0) {
            return '<p class="empty-message">No external apps yet. Add one!</p>';
        }

        return this.customApps.map((app, index) => `
            <div class="custom-app-item">
                <div class="app-info">
                    <span class="app-icon-display">${this.escapeHtml(app.icon)}</span>
                    <div class="app-details">
                        <span class="app-name-display">${this.escapeHtml(app.name)}</span>
                        ${app.description ? `<small class="app-desc">${this.escapeHtml(app.description)}</small>` : ''}
                        <small class="app-url">${this.escapeHtml(app.url)}</small>
                    </div>
                </div>
                <div class="app-actions">
                    <button onclick="os.apps['custom-app-external'].launchCustomApp(${index})" class="launch-btn">
                        🚀 Open
                    </button>
                    <button onclick="os.apps['custom-app-external'].deleteApp(${index})" class="delete-btn">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    createApp() {
        const name = document.getElementById('ext-app-name').value.trim();
        const icon = document.getElementById('ext-app-icon').value.trim();
        const url = document.getElementById('ext-app-url').value.trim();
        const description = document.getElementById('ext-app-desc').value.trim();

        if (!name) {
            alert('Please enter an app name');
            return;
        }

        if (!icon) {
            alert('Please enter an app icon (emoji)');
            return;
        }

        if (!url) {
            alert('Please enter an app URL');
            return;
        }

        if (!this.validateUrl(url)) {
            alert('Please enter a valid HTTP or HTTPS URL');
            return;
        }

        const customApp = {
            name: this.escapeHtml(name),
            icon: this.escapeHtml(icon),
            url: url, // URLs are validated, not escaped
            description: description ? this.escapeHtml(description) : '',
            created: new Date().toISOString()
        };

        this.customApps.push(customApp);
        this.saveCustomApps();

        // Clear form
        document.getElementById('ext-app-name').value = '';
        document.getElementById('ext-app-icon').value = '';
        document.getElementById('ext-app-url').value = '';
        document.getElementById('ext-app-desc').value = '';

        // Refresh list
        document.getElementById('custom-ext-apps-list').innerHTML = this.renderAppsList();

        alert(`✨ App "${name}" added successfully!`);
    },

    launchCustomApp(index) {
        const app = this.customApps[index];
        if (!app) return;

        // Open in new tab
        window.open(app.url, '_blank');
    },

    deleteApp(index) {
        const app = this.customApps[index];
        if (!confirm(`Are you sure you want to delete "${app.name}"?`)) {
            return;
        }

        this.customApps.splice(index, 1);
        this.saveCustomApps();

        // Refresh list
        document.getElementById('custom-ext-apps-list').innerHTML = this.renderAppsList();
    }
});
