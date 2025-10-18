// Terminal Emulator App
os.registerApp({
    id: 'terminal',
    name: 'Terminal',
    icon: '⌨️',
    category: 'utilities',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.history = [];
        this.historyIndex = -1;
        this.currentPath = '/';

        const content = os.getWindowContent(windowId);
        this.render(content);
        this.focusInput();
    },

    render(content) {
        content.innerHTML = `
            <div class="terminal" onclick="document.getElementById('terminal-input').focus()">
                <div id="terminal-output" class="terminal-output">
                    <div class="terminal-line">SimpleOS Terminal v1.0</div>
                    <div class="terminal-line">Type 'help' for available commands</div>
                    <div class="terminal-line"></div>
                </div>
                <div class="terminal-input-line">
                    <span class="terminal-prompt" id="terminal-prompt">user@simpleos:${this.currentPath}$</span>
                    <input type="text" id="terminal-input" class="terminal-input" autocomplete="off">
                </div>
            </div>
        `;

        const input = document.getElementById('terminal-input');
        input.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Auto-focus input when terminal is clicked
        content.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                input.focus();
            }
        });
    },

    focusInput() {
        setTimeout(() => {
            const input = document.getElementById('terminal-input');
            if (input) input.focus();
        }, 100);
    },

    handleKeyDown(e) {
        if (e.key === 'Enter') {
            const input = e.target;
            const command = input.value.trim();

            if (command) {
                this.history.push(command);
                this.historyIndex = this.history.length;
                this.executeCommand(command);
            } else {
                this.addOutput('');
            }

            input.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                e.target.value = this.history[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                e.target.value = this.history[this.historyIndex];
            } else {
                this.historyIndex = this.history.length;
                e.target.value = '';
            }
        }
    },

    executeCommand(command) {
        this.addOutput(`user@simpleos:${this.currentPath}$ ${command}`);

        const parts = command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        switch (cmd) {
            case 'help':
                this.addOutput('Available commands:');
                this.addOutput('  help          - Show this help message');
                this.addOutput('  clear         - Clear the terminal');
                this.addOutput('  ls            - List files and folders');
                this.addOutput('  cd [path]     - Change directory');
                this.addOutput('  pwd           - Print working directory');
                this.addOutput('  cat [file]    - Display file contents');
                this.addOutput('  mkdir [name]  - Create a new folder');
                this.addOutput('  touch [name]  - Create a new file');
                this.addOutput('  rm [name]     - Remove a file or folder');
                this.addOutput('  echo [text]   - Display text');
                this.addOutput('  date          - Show current date and time');
                this.addOutput('  whoami        - Show current user');
                break;

            case 'clear':
                const output = document.getElementById('terminal-output');
                output.innerHTML = '';
                break;

            case 'ls':
                this.cmdLs(args);
                break;

            case 'cd':
                this.cmdCd(args);
                break;

            case 'pwd':
                this.addOutput(this.currentPath);
                break;

            case 'cat':
                this.cmdCat(args);
                break;

            case 'mkdir':
                this.cmdMkdir(args);
                break;

            case 'touch':
                this.cmdTouch(args);
                break;

            case 'rm':
                this.cmdRm(args);
                break;

            case 'echo':
                this.addOutput(args.join(' '));
                break;

            case 'date':
                this.addOutput(new Date().toString());
                break;

            case 'whoami':
                this.addOutput('user');
                break;

            default:
                this.addOutput(`Command not found: ${cmd}`);
                this.addOutput(`Type 'help' for available commands`);
        }

        this.addOutput('');
    },

    cmdLs(args) {
        const folder = this.getFolder(this.currentPath);
        if (!folder || !folder.children) {
            this.addOutput('No files or folders');
            return;
        }

        const items = Object.entries(folder.children).map(([name, item]) => {
            return item.type === 'folder' ? name + '/' : name;
        });

        if (items.length === 0) {
            this.addOutput('(empty)');
        } else {
            this.addOutput(items.join('  '));
        }
    },

    cmdCd(args) {
        if (args.length === 0) {
            this.currentPath = '/';
            this.updatePrompt();
            return;
        }

        const target = args[0];

        if (target === '..') {
            if (this.currentPath === '/') return;
            const parts = this.currentPath.split('/').filter(p => p);
            parts.pop();
            this.currentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
            this.updatePrompt();
            return;
        }

        if (target === '/') {
            this.currentPath = '/';
            this.updatePrompt();
            return;
        }

        const newPath = this.currentPath === '/' ? `/${target}` : `${this.currentPath}/${target}`;
        const folder = this.getFolder(newPath);

        if (!folder) {
            this.addOutput(`cd: ${target}: No such directory`);
            return;
        }

        if (folder.type !== 'folder') {
            this.addOutput(`cd: ${target}: Not a directory`);
            return;
        }

        this.currentPath = newPath;
        this.updatePrompt();
    },

    cmdCat(args) {
        if (args.length === 0) {
            this.addOutput('cat: missing file name');
            return;
        }

        const filename = args[0];
        const folder = this.getFolder(this.currentPath);

        if (!folder.children[filename]) {
            this.addOutput(`cat: ${filename}: No such file`);
            return;
        }

        const file = folder.children[filename];
        if (file.type !== 'file') {
            this.addOutput(`cat: ${filename}: Is a directory`);
            return;
        }

        this.addOutput(file.content || '(empty)');
    },

    cmdMkdir(args) {
        if (args.length === 0) {
            this.addOutput('mkdir: missing directory name');
            return;
        }

        const name = args[0];
        const folder = this.getFolder(this.currentPath);

        if (folder.children[name]) {
            this.addOutput(`mkdir: ${name}: File exists`);
            return;
        }

        folder.children[name] = { type: 'folder', children: {} };
        os.saveFileSystem();
    },

    cmdTouch(args) {
        if (args.length === 0) {
            this.addOutput('touch: missing file name');
            return;
        }

        const name = args[0];
        const folder = this.getFolder(this.currentPath);

        if (folder.children[name]) {
            this.addOutput(`touch: ${name}: File exists`);
            return;
        }

        folder.children[name] = { type: 'file', content: '' };
        os.saveFileSystem();
    },

    cmdRm(args) {
        if (args.length === 0) {
            this.addOutput('rm: missing file name');
            return;
        }

        const name = args[0];
        const folder = this.getFolder(this.currentPath);

        if (!folder.children[name]) {
            this.addOutput(`rm: ${name}: No such file or directory`);
            return;
        }

        delete folder.children[name];
        os.saveFileSystem();
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

    addOutput(text) {
        const output = document.getElementById('terminal-output');
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    },

    updatePrompt() {
        const prompt = document.getElementById('terminal-prompt');
        if (prompt) {
            prompt.textContent = `user@simpleos:${this.currentPath}$`;
        }
    }
});
