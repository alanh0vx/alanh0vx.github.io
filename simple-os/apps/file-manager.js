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
                <div class="file-item-name">${name}</div>
            `;

            itemEl.ondblclick = () => {
                if (item.type === 'folder') {
                    this.openFolder(name);
                } else {
                    this.openFile(name, item);
                }
            };

            itemEl.oncontextmenu = (e) => {
                e.preventDefault();
                this.showContextMenu(e, name);
            };

            container.appendChild(itemEl);
        }
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

    newFolder() {
        const name = prompt('Folder name:');
        if (!name) return;

        const folder = this.getFolder(this.currentPath);
        if (folder.children[name]) {
            alert('Item already exists!');
            return;
        }

        folder.children[name] = { type: 'folder', children: {} };
        os.saveFileSystem();
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    newFile() {
        const name = prompt('File name:');
        if (!name) return;

        const folder = this.getFolder(this.currentPath);
        if (folder.children[name]) {
            alert('Item already exists!');
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

    showContextMenu(e, name) {
        const existing = document.getElementById('context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.className = 'context-menu';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.innerHTML = `
            <div class="context-menu-item" onclick="os.apps['file-manager'].deleteItem('${name}')">Delete</div>
        `;
        document.body.appendChild(menu);

        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            });
        }, 10);
    },

    deleteItem(name) {
        if (!confirm(`Delete ${name}?`)) return;

        const folder = this.getFolder(this.currentPath);
        delete folder.children[name];
        os.saveFileSystem();
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    }
});
