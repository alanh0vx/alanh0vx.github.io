// Help & User Guide App
os.registerApp({
    id: 'help',
    name: 'Help',
    icon: '❓',
    category: 'system',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.currentSection = 'welcome';
        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    render(content) {
        content.innerHTML = `
            <div class="help-app">
                <div class="help-sidebar">
                    <div class="help-nav-item ${this.currentSection === 'welcome' ? 'active' : ''}"
                         onclick="os.apps['help'].showSection('welcome')">
                        🏠 Welcome
                    </div>
                    <div class="help-nav-item ${this.currentSection === 'getting-started' ? 'active' : ''}"
                         onclick="os.apps['help'].showSection('getting-started')">
                        🚀 Getting Started
                    </div>
                    <div class="help-nav-item ${this.currentSection === 'apps' ? 'active' : ''}"
                         onclick="os.apps['help'].showSection('apps')">
                        📱 Built-in Apps
                    </div>
                    <div class="help-nav-item ${this.currentSection === 'file-system' ? 'active' : ''}"
                         onclick="os.apps['help'].showSection('file-system')">
                        📁 File System
                    </div>
                    <div class="help-nav-item ${this.currentSection === 'terminal' ? 'active' : ''}"
                         onclick="os.apps['help'].showSection('terminal')">
                        ⌨️ Terminal Commands
                    </div>
                    <div class="help-nav-item ${this.currentSection === 'custom-app' ? 'active' : ''}"
                         onclick="os.apps['help'].showSection('custom-app')">
                        🛠️ Create Custom App
                    </div>
                    <div class="help-nav-item ${this.currentSection === 'tips' ? 'active' : ''}"
                         onclick="os.apps['help'].showSection('tips')">
                        💡 Tips & Tricks
                    </div>
                </div>
                <div class="help-content" id="help-content">
                    ${this.renderSection(this.currentSection)}
                </div>
            </div>
        `;
    },

    showSection(section) {
        this.currentSection = section;
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    renderSection(section) {
        switch (section) {
            case 'welcome':
                return this.renderWelcome();
            case 'getting-started':
                return this.renderGettingStarted();
            case 'apps':
                return this.renderApps();
            case 'file-system':
                return this.renderFileSystem();
            case 'terminal':
                return this.renderTerminal();
            case 'custom-app':
                return this.renderCustomApp();
            case 'tips':
                return this.renderTips();
            default:
                return '';
        }
    },

    renderWelcome() {
        return `
            <div class="help-section">
                <h1>Welcome to SimpleOS! 🎉</h1>

                <p>SimpleOS is a fully functional web-based operating system that runs entirely in your browser.
                It features a complete desktop environment with multiple applications, file management, and even a terminal emulator!</p>

                <h2>Key Features</h2>
                <ul>
                    <li><strong>📁 File System</strong> - LocalStorage-based virtual file system</li>
                    <li><strong>🪟 Window Management</strong> - Draggable, resizable, minimizable windows</li>
                    <li><strong>📱 Built-in Apps</strong> - 11 pre-installed applications</li>
                    <li><strong>⌨️ Terminal</strong> - Command-line interface with file operations</li>
                    <li><strong>⚙️ Customizable</strong> - Themes, settings, and easy app development</li>
                    <li><strong>📱 Responsive</strong> - Works on desktop, tablet, and mobile</li>
                    <li><strong>💾 Persistent Storage</strong> - Your data is saved locally</li>
                </ul>

                <h2>What's Included?</h2>
                <div class="app-grid">
                    <div class="app-card">📁 File Manager</div>
                    <div class="app-card">📝 Notepad</div>
                    <div class="app-card">🔢 Calculator</div>
                    <div class="app-card">💣 Minesweeper</div>
                    <div class="app-card">🌐 Browser</div>
                    <div class="app-card">⌨️ Terminal</div>
                    <div class="app-card">⚙️ Settings</div>
                    <div class="app-card">🕐 Clock</div>
                    <div class="app-card">🎨 Paint</div>
                    <div class="app-card">🎵 Music Player</div>
                    <div class="app-card">❓ Help</div>
                </div>

                <div class="help-note">
                    <strong>💡 Tip:</strong> Click on any section in the sidebar to learn more about SimpleOS features!
                </div>
            </div>
        `;
    },

    renderGettingStarted() {
        return `
            <div class="help-section">
                <h1>Getting Started 🚀</h1>

                <h2>Desktop Basics</h2>
                <p>The SimpleOS desktop is your main workspace:</p>
                <ul>
                    <li><strong>Desktop Icons</strong> - Double-click any icon to launch an app</li>
                    <li><strong>Start Menu</strong> - Click "Start" button to see all available apps</li>
                    <li><strong>Taskbar</strong> - Shows running apps and current time</li>
                </ul>

                <h2>Working with Windows</h2>
                <h3>Window Controls</h3>
                <ul>
                    <li><strong>Move</strong> - Click and drag the title bar</li>
                    <li><strong>Resize</strong> - Drag from any edge or corner (desktop only)</li>
                    <li><strong>Minimize (−)</strong> - Hide window (click taskbar to restore)</li>
                    <li><strong>Maximize (□)</strong> - Fill entire screen</li>
                    <li><strong>Close (×)</strong> - Close the window</li>
                </ul>

                <h3>Multiple Windows</h3>
                <p>You can open multiple apps at once. Click any window to bring it to the front.</p>

                <h2>File Management</h2>
                <p>SimpleOS has a complete file system stored in your browser's localStorage:</p>
                <ul>
                    <li>Use <strong>File Manager</strong> to browse files and folders</li>
                    <li>Use <strong>Terminal</strong> for command-line file operations</li>
                    <li>Create, edit, and delete files and folders</li>
                    <li>Files are automatically saved and persist across sessions</li>
                </ul>

                <h2>Settings & Customization</h2>
                <p>Open the <strong>⚙️ Settings</strong> app to:</p>
                <ul>
                    <li>Change theme colors</li>
                    <li>Adjust wallpaper style</li>
                    <li>Modify font size</li>
                    <li>View storage usage</li>
                    <li>Export/import your data</li>
                </ul>

                <div class="help-warning">
                    <strong>⚠️ Important:</strong> All data is stored in your browser's localStorage.
                    Clearing browser data will delete all your files and settings!
                </div>
            </div>
        `;
    },

    renderApps() {
        return `
            <div class="help-section">
                <h1>Built-in Apps 📱</h1>

                <h2>📁 File Manager</h2>
                <p>Browse and manage your virtual file system.</p>
                <ul>
                    <li>Double-click folders to open them</li>
                    <li>Double-click files to open in Notepad</li>
                    <li>Right-click items to delete them</li>
                    <li>Create new files and folders with toolbar buttons</li>
                    <li>Navigate up with the "⬆️ Up" button</li>
                </ul>

                <h2>📝 Notepad</h2>
                <p>Simple text editor for creating and editing files.</p>
                <ul>
                    <li>Type or paste text into the editor</li>
                    <li><strong>Save</strong> - Update existing file</li>
                    <li><strong>Save As</strong> - Save to a new file</li>
                    <li><strong>Clear</strong> - Empty the editor</li>
                </ul>

                <h2>🔢 Calculator</h2>
                <p>Basic calculator for arithmetic operations.</p>
                <ul>
                    <li>Click buttons or use keyboard</li>
                    <li>Supports +, −, ×, ÷ operations</li>
                    <li>C - Clear all, CE - Clear entry</li>
                    <li>% - Convert to percentage</li>
                </ul>

                <h2>💣 Minesweeper</h2>
                <p>Classic puzzle game. Reveal all safe cells without hitting mines!</p>
                <ul>
                    <li>Left-click to reveal a cell</li>
                    <li>Right-click to place/remove flag</li>
                    <li>Numbers show adjacent mine count</li>
                    <li>10×10 grid with 15 mines</li>
                </ul>

                <h2>🌐 Browser</h2>
                <p>Basic web browser with URL navigation.</p>
                <ul>
                    <li>Enter URLs in the address bar</li>
                    <li>Use back/forward buttons</li>
                    <li><strong>Note:</strong> Most websites block embedding due to CORS restrictions</li>
                </ul>

                <h2>⌨️ Terminal</h2>
                <p>Command-line interface for advanced users. See "Terminal Commands" section for details.</p>

                <h2>⚙️ Settings</h2>
                <p>Customize your SimpleOS experience.</p>
                <ul>
                    <li><strong>Appearance</strong> - Theme, wallpaper, font size</li>
                    <li><strong>Storage</strong> - View usage, clear data, export/import</li>
                    <li><strong>About</strong> - System information</li>
                </ul>

                <h2>🕐 Clock</h2>
                <p>Multi-function time utility.</p>
                <ul>
                    <li><strong>Clock</strong> - Current time, date, and timezone</li>
                    <li><strong>Timer</strong> - Countdown timer</li>
                    <li><strong>Stopwatch</strong> - Count up from zero</li>
                    <li><strong>Alarm</strong> - Set time-based alerts</li>
                </ul>

                <h2>🎨 Paint</h2>
                <p>Simple drawing application.</p>
                <ul>
                    <li><strong>Pen</strong> - Draw freehand</li>
                    <li><strong>Eraser</strong> - Erase parts of drawing</li>
                    <li><strong>Fill</strong> - Fill entire canvas</li>
                    <li>Choose colors from picker or presets</li>
                    <li>Adjust brush size</li>
                    <li>Save to file system or download as PNG</li>
                </ul>

                <h2>🎵 Music Player</h2>
                <p>Play audio from URLs.</p>
                <ul>
                    <li>Add songs via "➕ Add URL" button</li>
                    <li>Click playlist items to play</li>
                    <li>Use playback controls (play/pause/next/previous)</li>
                    <li>Adjust volume with slider</li>
                    <li>Playlist persists across sessions</li>
                </ul>

                <h2>❓ Help</h2>
                <p>You're here! Complete user guide and developer documentation.</p>
            </div>
        `;
    },

    renderFileSystem() {
        return `
            <div class="help-section">
                <h1>File System 📁</h1>

                <h2>Overview</h2>
                <p>SimpleOS uses a virtual file system stored in your browser's localStorage.
                This means all files and folders persist even after closing the browser.</p>

                <h2>Default Structure</h2>
                <pre class="code-block">
/
├── Documents/
├── Downloads/
├── Pictures/
└── welcome.txt
                </pre>

                <h2>File Operations</h2>

                <h3>Via File Manager</h3>
                <ul>
                    <li><strong>Browse</strong> - Navigate folders by double-clicking</li>
                    <li><strong>Create Folder</strong> - Click "📁 New Folder" button</li>
                    <li><strong>Create File</strong> - Click "📄 New File" button</li>
                    <li><strong>Open File</strong> - Double-click to open in Notepad</li>
                    <li><strong>Delete</strong> - Right-click item and select "Delete"</li>
                    <li><strong>Navigate Up</strong> - Click "⬆️ Up" button</li>
                </ul>

                <h3>Via Terminal</h3>
                <ul>
                    <li><code>ls</code> - List files and folders</li>
                    <li><code>cd [path]</code> - Change directory</li>
                    <li><code>mkdir [name]</code> - Create folder</li>
                    <li><code>touch [name]</code> - Create file</li>
                    <li><code>cat [file]</code> - Display file contents</li>
                    <li><code>rm [name]</code> - Remove file or folder</li>
                </ul>

                <h2>Storage Limits</h2>
                <p>The file system is limited by your browser's localStorage quota (typically 5-10 MB).
                You can check usage in <strong>Settings → Storage</strong>.</p>

                <h2>Data Persistence</h2>
                <ul>
                    <li>✅ Files persist across browser sessions</li>
                    <li>✅ Survives page refresh</li>
                    <li>❌ Clearing browser data will delete all files</li>
                    <li>❌ Incognito/Private mode data is lost on close</li>
                </ul>

                <h2>Backup & Restore</h2>
                <p>Use <strong>Settings → Storage</strong> to:</p>
                <ul>
                    <li><strong>Export Data</strong> - Download backup JSON file</li>
                    <li><strong>Import Data</strong> - Restore from backup file</li>
                </ul>

                <div class="help-tip">
                    <strong>💡 Pro Tip:</strong> Regularly export your data to prevent loss!
                </div>
            </div>
        `;
    },

    renderTerminal() {
        return `
            <div class="help-section">
                <h1>Terminal Commands ⌨️</h1>

                <h2>Available Commands</h2>

                <h3>File Navigation</h3>
                <dl class="command-list">
                    <dt><code>ls</code></dt>
                    <dd>List all files and folders in current directory</dd>

                    <dt><code>cd [path]</code></dt>
                    <dd>Change directory. Use <code>..</code> to go up, <code>/</code> for root</dd>

                    <dt><code>pwd</code></dt>
                    <dd>Print working directory (show current path)</dd>
                </dl>

                <h3>File Operations</h3>
                <dl class="command-list">
                    <dt><code>cat [filename]</code></dt>
                    <dd>Display file contents</dd>

                    <dt><code>mkdir [name]</code></dt>
                    <dd>Create a new folder</dd>

                    <dt><code>touch [name]</code></dt>
                    <dd>Create a new empty file</dd>

                    <dt><code>rm [name]</code></dt>
                    <dd>Remove a file or folder</dd>
                </dl>

                <h3>Utilities</h3>
                <dl class="command-list">
                    <dt><code>echo [text]</code></dt>
                    <dd>Display text to terminal</dd>

                    <dt><code>date</code></dt>
                    <dd>Show current date and time</dd>

                    <dt><code>whoami</code></dt>
                    <dd>Display current user</dd>

                    <dt><code>clear</code></dt>
                    <dd>Clear terminal screen</dd>

                    <dt><code>help</code></dt>
                    <dd>Show list of available commands</dd>
                </dl>

                <h2>Examples</h2>
                <pre class="code-block">
# Navigate to Documents folder
cd Documents

# Create a new folder
mkdir MyFolder

# Navigate into it
cd MyFolder

# Create a file
touch notes.txt

# Go back to parent directory
cd ..

# List all files
ls

# Display a file
cat welcome.txt

# Delete a file
rm notes.txt
                </pre>

                <h2>Terminal Features</h2>
                <ul>
                    <li><strong>Command History</strong> - Use ↑/↓ arrow keys to navigate history</li>
                    <li><strong>Auto-scroll</strong> - Terminal automatically scrolls to bottom</li>
                    <li><strong>File System Integration</strong> - All changes sync with File Manager</li>
                </ul>

                <div class="help-tip">
                    <strong>💡 Pro Tip:</strong> The terminal uses the same file system as File Manager,
                    so changes in one are immediately visible in the other!
                </div>
            </div>
        `;
    },

    renderCustomApp() {
        return `
            <div class="help-section">
                <h1>Create Custom App 🛠️</h1>

                <h2>Quick Start</h2>
                <p>Adding your own app to SimpleOS is easy! Just create a JavaScript file and register your app with the OS.</p>

                <h2>Step-by-Step Guide</h2>

                <h3>1. Create App File</h3>
                <p>Create a new file in the <code>apps/</code> folder, e.g., <code>apps/my-app.js</code></p>

                <h3>2. Write Your App Code</h3>
                <p>Use this template as a starting point:</p>

                <pre class="code-block">
// My Custom App
os.registerApp({
    id: 'my-app',           // Unique identifier
    name: 'My App',         // Display name
    icon: '🚀',            // Emoji icon

    onLaunch(windowId) {
        // Called when app is launched
        this.windowId = windowId;

        // Get the window's content area
        const content = os.getWindowContent(windowId);

        // Render your app's HTML
        this.render(content);
    },

    render(content) {
        // Set the HTML content
        content.innerHTML = \`
            &lt;div style="padding: 20px;"&gt;
                &lt;h1&gt;Hello from My App!&lt;/h1&gt;
                &lt;p&gt;This is my custom application.&lt;/p&gt;
                &lt;button onclick="os.apps['my-app'].handleClick()"&gt;
                    Click Me
                &lt;/button&gt;
            &lt;/div&gt;
        \`;
    },

    handleClick() {
        alert('Button clicked!');
    }
});
                </pre>

                <h3>3. Include in HTML</h3>
                <p>Add your script to <code>index.html</code> before the closing <code>&lt;/body&gt;</code> tag:</p>

                <pre class="code-block">
&lt;script src="apps/my-app.js"&gt;&lt;/script&gt;
                </pre>

                <h3>4. Reload the OS</h3>
                <p>Refresh your browser and your app will appear in the Start menu and desktop!</p>

                <h2>Advanced Features</h2>

                <h3>Access File System</h3>
                <pre class="code-block">
// Get the file system
const fs = os.fileSystem;

// Navigate to a folder
const rootFolder = fs['/'];
const files = rootFolder.children;

// Save changes
os.saveFileSystem();
                </pre>

                <h3>Get Window Content</h3>
                <pre class="code-block">
// Get content div for this window
const content = os.getWindowContent(this.windowId);

// Update content
content.innerHTML = '&lt;p&gt;New content&lt;/p&gt;';
                </pre>

                <h3>Use LocalStorage</h3>
                <pre class="code-block">
// Save app data
localStorage.setItem('myApp_data', JSON.stringify(data));

// Load app data
const data = JSON.parse(
    localStorage.getItem('myApp_data') || '{}'
);
                </pre>

                <h3>Add Styles</h3>
                <p>Add CSS to <code>styles.css</code>:</p>
                <pre class="code-block">
.my-app-container {
    padding: 20px;
    background: #f5f5f5;
}

.my-app-button {
    padding: 10px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
                </pre>

                <h2>Complete Example: Counter App</h2>
                <pre class="code-block">
// Counter App (apps/counter.js)
os.registerApp({
    id: 'counter',
    name: 'Counter',
    icon: '🔢',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.count = 0;
        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    render(content) {
        content.innerHTML = \`
            &lt;div style="padding: 40px; text-align: center;"&gt;
                &lt;h1&gt;Counter App&lt;/h1&gt;
                &lt;div style="font-size: 48px; margin: 30px 0;"&gt;
                    \${this.count}
                &lt;/div&gt;
                &lt;button onclick="os.apps['counter'].increment()"
                        style="padding: 10px 20px; margin: 5px;"&gt;
                    ➕ Increment
                &lt;/button&gt;
                &lt;button onclick="os.apps['counter'].decrement()"
                        style="padding: 10px 20px; margin: 5px;"&gt;
                    ➖ Decrement
                &lt;/button&gt;
                &lt;button onclick="os.apps['counter'].reset()"
                        style="padding: 10px 20px; margin: 5px;"&gt;
                    🔄 Reset
                &lt;/button&gt;
            &lt;/div&gt;
        \`;
    },

    increment() {
        this.count++;
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    decrement() {
        this.count--;
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    reset() {
        this.count = 0;
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    }
});
                </pre>

                <h2>Best Practices</h2>
                <ul>
                    <li>✅ Use unique app IDs to avoid conflicts</li>
                    <li>✅ Always store windowId for later reference</li>
                    <li>✅ Re-render when state changes</li>
                    <li>✅ Use emoji icons for consistency</li>
                    <li>✅ Handle errors gracefully</li>
                    <li>❌ Don't modify os.fileSystem directly without saving</li>
                    <li>❌ Don't create memory leaks with intervals/timers</li>
                </ul>

                <div class="help-tip">
                    <strong>💡 Pro Tip:</strong> Look at existing apps in the <code>apps/</code> folder
                    for more complex examples and patterns!
                </div>
            </div>
        `;
    },

    renderTips() {
        return `
            <div class="help-section">
                <h1>Tips & Tricks 💡</h1>

                <h2>Productivity Tips</h2>
                <ul>
                    <li><strong>Multiple Windows</strong> - Open several apps at once for multitasking</li>
                    <li><strong>Keyboard Navigation</strong> - Terminal supports command history with ↑/↓</li>
                    <li><strong>Quick Launch</strong> - Double-click desktop icons instead of using Start menu</li>
                    <li><strong>Window Management</strong> - Maximize frequently used apps for more space</li>
                    <li><strong>File Organization</strong> - Create folders to keep files organized</li>
                </ul>

                <h2>Customization Tips</h2>
                <ul>
                    <li><strong>Themes</strong> - Try different color themes in Settings</li>
                    <li><strong>Font Size</strong> - Adjust for better readability on your device</li>
                    <li><strong>Wallpaper</strong> - Switch between gradient, solid, or dark backgrounds</li>
                </ul>

                <h2>File Management Tips</h2>
                <ul>
                    <li><strong>Regular Backups</strong> - Export your data regularly (Settings → Storage)</li>
                    <li><strong>Use Terminal</strong> - Faster for batch file operations</li>
                    <li><strong>Organize Early</strong> - Create folder structure before accumulating files</li>
                    <li><strong>Check Storage</strong> - Monitor usage in Settings to avoid hitting limits</li>
                </ul>

                <h2>Mobile Usage Tips</h2>
                <ul>
                    <li><strong>Touch Gestures</strong> - Drag windows by title bar, tap to focus</li>
                    <li><strong>Auto-Maximize</strong> - Windows auto-fill on small screens</li>
                    <li><strong>Start Menu</strong> - Easier than desktop icons on mobile</li>
                    <li><strong>Landscape Mode</strong> - Better for most apps on phones</li>
                </ul>

                <h2>App-Specific Tips</h2>

                <h3>📝 Notepad</h3>
                <ul>
                    <li>Use "Save As" to create multiple versions of a file</li>
                    <li>Files opened from File Manager auto-populate filename</li>
                </ul>

                <h3>⌨️ Terminal</h3>
                <ul>
                    <li>Use <code>cd ..</code> multiple times to quickly navigate up</li>
                    <li>Combine commands: create folder then navigate into it</li>
                    <li>Use arrow keys to recall previous commands</li>
                </ul>

                <h3>🎨 Paint</h3>
                <ul>
                    <li>Save drawings to file system for later editing</li>
                    <li>Use fill tool to quickly change canvas background</li>
                    <li>Adjust brush size for detail work vs. broad strokes</li>
                </ul>

                <h3>🎵 Music Player</h3>
                <ul>
                    <li>Use free audio URLs from sites like SoundCloud or direct MP3 links</li>
                    <li>Organize with descriptive names and artist info</li>
                    <li>Playlist is saved automatically</li>
                </ul>

                <h3>💣 Minesweeper</h3>
                <ul>
                    <li>Start from corners for safer first moves</li>
                    <li>Use flags to mark known mines</li>
                    <li>Numbers indicate adjacent mines (including diagonals)</li>
                </ul>

                <h2>Troubleshooting</h2>

                <h3>App Won't Launch?</h3>
                <ul>
                    <li>Try refreshing the page</li>
                    <li>Check browser console for errors (F12)</li>
                    <li>Clear localStorage and start fresh</li>
                </ul>

                <h3>Files Disappeared?</h3>
                <ul>
                    <li>Check if browser data was cleared</li>
                    <li>Import from backup if available</li>
                    <li>Files in incognito mode don't persist</li>
                </ul>

                <h3>Performance Issues?</h3>
                <ul>
                    <li>Close unused windows</li>
                    <li>Clear terminal output with <code>clear</code></li>
                    <li>Check storage usage in Settings</li>
                </ul>

                <h3>Browser Won't Load Sites?</h3>
                <ul>
                    <li>This is normal - most sites block iframe embedding</li>
                    <li>CORS restrictions prevent external site loading</li>
                    <li>Some sites may work if they allow embedding</li>
                </ul>

                <div class="help-note">
                    <strong>🔧 Still Need Help?</strong> SimpleOS is open source and runs entirely in your browser.
                    Check the source code or browser console for debugging!
                </div>
            </div>
        `;
    }
});
