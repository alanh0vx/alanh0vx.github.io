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
        alert('File saved!');
    },

    saveAs() {
        const textarea = document.getElementById('notepad-content');
        const content = textarea.value;
        const filename = prompt('Enter filename:');

        if (!filename) return;

        // Save to root directory
        os.fileSystem['/'].children[filename] = { type: 'file', content };
        os.saveFileSystem();

        this.currentPath = `/${filename}`;
        const filenameEl = document.getElementById('notepad-filename');
        if (filenameEl) {
            filenameEl.textContent = `File: ${this.currentPath}`;
        }

        alert('File saved!');
    },

    clear() {
        if (!confirm('Clear all text?')) return;
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
