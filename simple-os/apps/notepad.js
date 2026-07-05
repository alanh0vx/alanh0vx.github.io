// Notepad App
os.registerApp({
    id: 'notepad',
    name: 'Notepad',
    icon: '📝',
    category: 'productivity',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.currentFile = null;
        this.currentPath = null;
        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    render(content) {
        content.innerHTML = `
            <div class="notepad">
                <div class="notepad-toolbar">
                    <button onclick="os.apps['notepad'].save()">💾 Save</button>
                    <button onclick="os.apps['notepad'].saveAs()">💾 Save As</button>
                    <button onclick="os.apps['notepad'].clear()">🗑️ Clear</button>
                    <span id="notepad-filename" style="margin-left: 10px; font-size: 12px; color: #666;"></span>
                </div>
                <textarea id="notepad-content" class="notepad-textarea" placeholder="Start typing..."></textarea>
            </div>
        `;
    },

    loadFile(path, content) {
        this.currentPath = path;
        this.currentFile = content;
        const textarea = document.getElementById('notepad-content');
        const filename = document.getElementById('notepad-filename');

        if (textarea) {
            textarea.value = content;
            filename.textContent = `File: ${path}`;
        }
    },

    save() {
        const textarea = document.getElementById('notepad-content');
        const content = textarea.value;

        if (!this.currentPath) {
            this.saveAs();
            return;
        }

        // Update file in filesystem
        const parts = this.currentPath.split('/').filter(p => p);
        const filename = parts.pop();
        const folderPath = parts.length === 0 ? '/' : '/' + parts.join('/');

        let current = os.fileSystem['/'];
        for (const part of parts) {
            if (!current.children[part]) return;
            current = current.children[part];
        }

        current.children[filename] = { type: 'file', content };
        os.saveFileSystem();
        os.ui.toast('File saved', { type: 'success' });
    },

    async saveAs() {
        const textarea = document.getElementById('notepad-content');
        const content = textarea.value;
        const filename = await os.ui.prompt('Enter filename:', { title: 'Save As', placeholder: 'notes.txt' });

        if (!filename) return;

        // Save to root directory
        os.fileSystem['/'].children[filename] = { type: 'file', content };
        os.saveFileSystem();

        this.currentPath = `/${filename}`;
        const filenameEl = document.getElementById('notepad-filename');
        if (filenameEl) {
            filenameEl.textContent = `File: ${this.currentPath}`;
        }

        os.ui.toast('File saved', { type: 'success' });
    },

    async clear() {
        if (!await os.ui.confirm('Clear all text?', { title: 'Notepad', danger: true, confirmLabel: 'Clear' })) return;
        const textarea = document.getElementById('notepad-content');
        textarea.value = '';
        this.currentFile = null;
        this.currentPath = null;
        const filename = document.getElementById('notepad-filename');
        if (filename) {
            filename.textContent = '';
        }
    }
});
