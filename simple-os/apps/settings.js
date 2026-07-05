// Settings App
os.registerApp({
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    category: 'system',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.settings = this.loadSettings();
        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    loadSettings() {
        const defaults = {
            theme: 'purple',
            wallpaper: 'gradient',
            fontSize: 'medium',
            appearance: 'system'
        };
        return { ...defaults, ...os.safeGet('simpleOS_settings', {}) };
    },

    saveSettings() {
        localStorage.setItem('simpleOS_settings', JSON.stringify(this.settings));
        this.applySettings();
    },

    render(content) {
        content.innerHTML = `
            <div class="settings">
                <div class="settings-sidebar">
                    <div class="settings-nav-item active" onclick="os.apps['settings'].showSection('appearance')">
                        🎨 Appearance
                    </div>
                    <div class="settings-nav-item" onclick="os.apps['settings'].showSection('storage')">
                        💾 Storage
                    </div>
                    <div class="settings-nav-item" onclick="os.apps['settings'].showSection('about')">
                        ℹ️ About
                    </div>
                </div>
                <div class="settings-content" id="settings-content">
                    ${this.renderAppearance()}
                </div>
            </div>
        `;
    },

    showSection(section) {
        const navItems = document.querySelectorAll('.settings-nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        event.target.classList.add('active');

        const contentEl = document.getElementById('settings-content');

        switch (section) {
            case 'appearance':
                contentEl.innerHTML = this.renderAppearance();
                break;
            case 'storage':
                contentEl.innerHTML = this.renderStorage();
                break;
            case 'about':
                contentEl.innerHTML = this.renderAbout();
                break;
        }
    },

    renderAppearance() {
        return `
            <div class="settings-section">
                <h2>Appearance</h2>

                <div class="settings-group">
                    <label>Appearance</label>
                    <select id="appearance-select" onchange="os.apps['settings'].changeAppearance(this.value)">
                        <option value="system" ${this.settings.appearance === 'system' ? 'selected' : ''}>System</option>
                        <option value="light" ${this.settings.appearance === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${this.settings.appearance === 'dark' ? 'selected' : ''}>Dark</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label>Theme Color</label>
                    <select id="theme-select" onchange="os.apps['settings'].changeTheme(this.value)">
                        <option value="purple" ${this.settings.theme === 'purple' ? 'selected' : ''}>Purple</option>
                        <option value="blue" ${this.settings.theme === 'blue' ? 'selected' : ''}>Blue</option>
                        <option value="green" ${this.settings.theme === 'green' ? 'selected' : ''}>Green</option>
                        <option value="red" ${this.settings.theme === 'red' ? 'selected' : ''}>Red</option>
                        <option value="orange" ${this.settings.theme === 'orange' ? 'selected' : ''}>Orange</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label>Wallpaper Style</label>
                    <select id="wallpaper-select" onchange="os.apps['settings'].changeWallpaper(this.value)">
                        <option value="gradient" ${this.settings.wallpaper === 'gradient' ? 'selected' : ''}>Gradient</option>
                        <option value="solid" ${this.settings.wallpaper === 'solid' ? 'selected' : ''}>Solid Color</option>
                        <option value="dark" ${this.settings.wallpaper === 'dark' ? 'selected' : ''}>Dark</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label>Font Size</label>
                    <select id="fontsize-select" onchange="os.apps['settings'].changeFontSize(this.value)">
                        <option value="small" ${this.settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                        <option value="medium" ${this.settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="large" ${this.settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                    </select>
                </div>
            </div>
        `;
    },

    renderStorage() {
        const fsSize = JSON.stringify(os.fileSystem).length;
        const totalStorage = 5 * 1024 * 1024; // 5MB typical localStorage limit
        const usedPercent = ((fsSize / totalStorage) * 100).toFixed(2);

        return `
            <div class="settings-section">
                <h2>Storage</h2>

                <div class="settings-group">
                    <label>File System Storage</label>
                    <div class="storage-bar">
                        <div class="storage-bar-fill" style="width: ${usedPercent}%"></div>
                    </div>
                    <p>${(fsSize / 1024).toFixed(2)} KB used of ${(totalStorage / 1024 / 1024).toFixed(0)} MB</p>
                </div>

                <div class="settings-group">
                    <button onclick="os.apps['settings'].clearStorage()" class="danger-btn">
                        🗑️ Clear All Data
                    </button>
                    <p style="color: #e74c3c; font-size: 12px; margin-top: 5px;">
                        Warning: This will delete all files and reset the OS
                    </p>
                </div>

                <div class="settings-group">
                    <button onclick="os.apps['settings'].exportData()">
                        📤 Export Data
                    </button>
                    <button onclick="os.apps['settings'].importData()">
                        📥 Import Data
                    </button>
                </div>
            </div>
        `;
    },

    renderAbout() {
        return `
            <div class="settings-section">
                <h2>About SimpleOS</h2>

                <div class="about-info">
                    <h3>SimpleOS v1.0</h3>
                    <p>A web-based operating system built with vanilla JavaScript</p>

                    <h4 style="margin-top: 20px;">Installed Apps</h4>
                    <ul>
                        ${Object.values(os.apps).map(app => `<li>${app.icon} ${app.name}</li>`).join('')}
                    </ul>

                    <h4 style="margin-top: 20px;">System Information</h4>
                    <ul>
                        <li><strong>Browser:</strong> ${navigator.userAgent.split(' ').pop()}</li>
                        <li><strong>Platform:</strong> ${navigator.platform}</li>
                        <li><strong>Screen:</strong> ${window.screen.width}x${window.screen.height}</li>
                    </ul>
                </div>
            </div>
        `;
    },

    changeAppearance(appearance) {
        this.settings.appearance = appearance;
        this.saveSettings();
    },

    changeTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
    },

    changeWallpaper(wallpaper) {
        this.settings.wallpaper = wallpaper;
        this.saveSettings();
    },

    changeFontSize(fontSize) {
        this.settings.fontSize = fontSize;
        this.saveSettings();
    },

    applySettings() {
        const body = document.body;
        const root = document.documentElement;

        // Theme color drives the accent design tokens, so window chrome,
        // buttons and highlights all follow the chosen theme
        const accents = {
            purple: ['#667eea', '#764ba2'],
            blue: ['#2193b0', '#6dd5ed'],
            green: ['#11998e', '#38ef7d'],
            red: ['#eb3349', '#f45c43'],
            orange: ['#f46b45', '#eea849']
        };
        const [accent1, accent2] = accents[this.settings.theme] || accents.purple;
        root.style.setProperty('--accent-1', accent1);
        root.style.setProperty('--accent-2', accent2);

        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) themeColorMeta.setAttribute('content', accent1);

        // Light / dark appearance via data-theme (system = no attribute)
        if (this.settings.appearance === 'light' || this.settings.appearance === 'dark') {
            body.dataset.theme = this.settings.appearance;
        } else {
            delete body.dataset.theme;
        }

        // Wallpaper
        const wallpapers = {
            gradient: 'var(--gradient-accent)',
            solid: accent2,
            dark: '#1a1a2e'
        };
        body.style.background = wallpapers[this.settings.wallpaper] || wallpapers.gradient;

        // Font size
        const fontSizes = {
            small: '13px',
            medium: '14px',
            large: '16px'
        };
        body.style.fontSize = fontSizes[this.settings.fontSize];
    },

    async clearStorage() {
        if (!await os.ui.confirm('Clear all data? This cannot be undone.', { title: 'Clear All Data', danger: true, confirmLabel: 'Clear Data' })) return;

        localStorage.removeItem('simpleOS_fileSystem');
        localStorage.removeItem('simpleOS_settings');
        location.reload();
    },

    exportData() {
        const data = {
            fileSystem: os.fileSystem,
            settings: this.settings
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'simpleos-backup.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);

                    if (data.fileSystem) {
                        os.fileSystem = data.fileSystem;
                        os.saveFileSystem();
                    }

                    if (data.settings) {
                        this.settings = data.settings;
                        this.saveSettings();
                    }

                    os.ui.toast('Data imported — reloading…', { type: 'success' });
                    setTimeout(() => location.reload(), 800);
                } catch (error) {
                    os.ui.alert('Error importing data: ' + error.message, { title: 'Import Failed' });
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }
});

// Apply settings on startup
setTimeout(() => {
    if (os.apps['settings']) {
        // Load settings first
        os.apps['settings'].settings = os.apps['settings'].loadSettings();
        os.apps['settings'].applySettings();
    }
}, 100);
