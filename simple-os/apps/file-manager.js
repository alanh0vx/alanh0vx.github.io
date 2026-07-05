// File Manager App
os.registerApp({
    id: 'file-manager',
    name: 'File Manager',
    icon: '📁',
    category: 'utilities',

    onLaunch(windowId) {
        const content = os.getWindowContent(windowId);
        this.currentPath = '/';
        this.windowId = windowId;
        this.render(content);
    },

    render(content) {
        const pathParts = this.currentPath.split('/').filter(p => p);
        const currentFolder = this.getFolder(this.currentPath);

        content.innerHTML = `
            <div class="file-manager">
                <div class="file-manager-toolbar">
                    <button onclick="os.apps['file-manager'].goUp()">⬆️ Up</button>
                    <input type="text" id="fm-path" value="${this.currentPath}" readonly>
                    <button onclick="os.apps['file-manager'].newFolder()">📁 New Folder</button>
                    <button onclick="os.apps['file-manager'].newFile()">📄 New File</button>
                </div>
                <div class="file-manager-content" id="fm-items"></div>
            </div>
        `;

        this.renderItems(currentFolder);
    },

    renderItems(folder) {
        const container = document.getElementById('fm-items');
        container.innerHTML = '';

        if (!folder || !folder.children) return;

        for (const [name, item] of Object.entries(folder.children)) {
            const itemEl = document.createElement('div');
            itemEl.className = 'file-item';
            itemEl.innerHTML = `
                <div class="file-item-icon">${item.type === 'folder' ? '📁' : '📄'}</div>
                <div class="file-item-name">${os.ui.escapeHtml(name)}</div>
                <button class="file-item-actions" title="Actions">⋯</button>
            `;

            const open = () => {
                if (item.type === 'folder') {
                    this.openFolder(name);
                } else {
                    this.openFile(name, item);
                }
            };

            itemEl.ondblclick = open;

            // Phones/tablets: single tap opens (double-tap is awkward on touch)
            itemEl.onclick = (e) => {
                if (e.target.classList.contains('file-item-actions')) return;
                if (os.deviceMode !== 'desktop') open();
            };

            itemEl.querySelector('.file-item-actions').onclick = (e) => {
                e.stopPropagation();
                this.showItemMenu(e.clientX, e.clientY, name, open);
            };

            itemEl.oncontextmenu = (e) => {
                e.preventDefault();
                this.showItemMenu(e.clientX, e.clientY, name, open);
            };

            container.appendChild(itemEl);
        }
    },

    async showItemMenu(x, y, name, open) {
        const action = await os.ui.menu([
            { label: '📂 Open', value: 'open' },
            { label: '🗑️ Delete', value: 'delete', danger: true }
        ], { x, y });

        if (action === 'open') open();
        if (action === 'delete') this.deleteItem(name);
    },

    getFolder(path) {
        const parts = path.split('/').filter(p => p);
        let current = os.fileSystem['/'];

        for (const part of parts) {
            if (!current.children || !current.children[part]) return null;
            current = current.children[part];
        }

        return current;
    },

    openFolder(name) {
        this.currentPath = this.currentPath === '/' ? `/${name}` : `${this.currentPath}/${name}`;
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    goUp() {
        if (this.currentPath === '/') return;
        const parts = this.currentPath.split('/').filter(p => p);
        parts.pop();
        this.currentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    async newFolder() {
        const name = await os.ui.prompt('Folder name:', { title: 'New Folder' });
        if (!name) return;

        const folder = this.getFolder(this.currentPath);
        if (folder.children[name]) {
            os.ui.toast('Item already exists', { type: 'error' });
            return;
        }

        folder.children[name] = { type: 'folder', children: {} };
        os.saveFileSystem();
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    async newFile() {
        const name = await os.ui.prompt('File name:', { title: 'New File' });
        if (!name) return;

        const folder = this.getFolder(this.currentPath);
        if (folder.children[name]) {
            os.ui.toast('Item already exists', { type: 'error' });
            return;
        }

        folder.children[name] = { type: 'file', content: '' };
        os.saveFileSystem();
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    openFile(name, item) {
        // Launch notepad with this file
        const fullPath = this.currentPath === '/' ? `/${name}` : `${this.currentPath}/${name}`;
        os.launchApp('notepad');

        // Wait for notepad to load and then open the file
        setTimeout(() => {
            const notepadWindows = os.windows.filter(w => w.app.id === 'notepad');
            if (notepadWindows.length > 0) {
                const latestNotepad = notepadWindows[notepadWindows.length - 1];
                os.apps['notepad'].loadFile(fullPath, item.content);
            }
        }, 100);
    },

    async deleteItem(name) {
        if (!await os.ui.confirm(`Delete "${name}"?`, { title: 'Delete', danger: true })) return;

        const folder = this.getFolder(this.currentPath);
        delete folder.children[name];
        os.saveFileSystem();
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    }
});
