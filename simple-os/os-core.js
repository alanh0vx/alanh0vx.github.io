// SimpleOS Core System
class SimpleOS {
    constructor() {
        this.windows = [];
        this.apps = {};
        this.zIndexCounter = 100;
        this.activeWindowId = null;
        this.windowResources = {};
        this.fileSystem = this.initFileSystem();
        this.deviceMode = this.detectDeviceMode();
        this.isMobile = this.deviceMode === 'phone';
        this.init();
    }

    detectDeviceMode() {
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches ||
            'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice && window.innerWidth <= 768) return 'phone';
        if (isTouchDevice) return 'tablet';
        return 'desktop';
    }

    init() {
        document.body.dataset.device = this.deviceMode;
        this.setupTaskbar();
        this.setupStartMenu();
        this.setupContextMenu();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);

        // Re-evaluate device mode when the viewport changes (rotation, resize)
        let resizeTimer;
        const onViewportChange = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.updateDeviceMode(), 250);
        };
        window.addEventListener('resize', onViewportChange);
        window.addEventListener('orientationchange', onViewportChange);

        // Mobile mode: Show app grid
        if (this.isMobile) {
            setTimeout(() => this.setupMobileLayout(), 500);
        }
        // Desktop mode: Category folders are on desktop, user can double-click to open
    }

    updateDeviceMode() {
        const mode = this.detectDeviceMode();
        if (mode === this.deviceMode) return;
        this.deviceMode = mode;
        this.isMobile = mode === 'phone';
        document.body.dataset.device = mode;
        this.renderHomeScreen();

        // Entering phone mode: open windows become fullscreen
        if (this.isMobile) {
            this.windows.forEach(w => {
                w.element.classList.add('maximized');
                w.maximized = true;
            });
        }
    }

    renderHomeScreen() {
        const iconsContainer = document.getElementById('icons-container');
        iconsContainer.innerHTML = '';
        if (this.isMobile) {
            this.setupMobileLayout();
        } else {
            iconsContainer.className = '';
            Object.keys(this.categoryApps || {}).forEach(category => this.createDesktopFolderIcon(category));
        }
    }

    // Make a div behave like a button for keyboard and screen-reader users
    makeAccessible(el, activate, role = 'button') {
        el.setAttribute('role', role);
        el.tabIndex = 0;
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate();
            }
        });
    }

    safeGet(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.warn(`SimpleOS: ignoring corrupt localStorage entry "${key}"`, e);
            return fallback;
        }
    }

    initFileSystem() {
        const fs = this.safeGet('simpleOS_fileSystem');
        if (fs) {
            return fs;
        }

        // Default file system
        const defaultFS = {
            '/': {
                type: 'folder',
                children: {
                    'Documents': { type: 'folder', children: {} },
                    'Downloads': { type: 'folder', children: {} },
                    'Pictures': { type: 'folder', children: {} },
                    'welcome.txt': { type: 'file', content: 'Welcome to SimpleOS!\n\nThis is a simple web-based operating system.\n\nExplore the apps from the Start menu!' }
                }
            }
        };

        this.saveFileSystem(defaultFS);
        return defaultFS;
    }

    saveFileSystem(fs = this.fileSystem) {
        localStorage.setItem('simpleOS_fileSystem', JSON.stringify(fs));
    }

    registerApp(app) {
        // Set default category if not specified
        if (!app.category) {
            app.category = 'utilities';
        }

        this.apps[app.id] = app;
        this.addToStartMenu(app);
        this.addDesktopIcon(app);
    }

    addToStartMenu(app) {
        const startMenuApps = document.getElementById('start-menu-apps');

        // Find or create category group
        const categoryId = `category-${app.category}`;
        let categoryGroup = document.getElementById(categoryId);

        if (!categoryGroup) {
            categoryGroup = document.createElement('div');
            categoryGroup.id = categoryId;
            categoryGroup.className = 'start-menu-category';

            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'start-menu-category-header';
            categoryHeader.innerHTML = this.getCategoryLabel(app.category);
            categoryGroup.appendChild(categoryHeader);

            const categoryItems = document.createElement('div');
            categoryItems.className = 'start-menu-category-items';
            categoryItems.id = `${categoryId}-items`;
            categoryGroup.appendChild(categoryItems);

            startMenuApps.appendChild(categoryGroup);
        }

        // Add app to category
        const categoryItems = document.getElementById(`${categoryId}-items`);
        const item = document.createElement('div');
        item.className = 'start-menu-item';
        item.innerHTML = `<span class="app-icon">${app.icon}</span>${app.name}`;
        const launch = () => {
            this.launchApp(app.id);
            this.hideStartMenu();
        };
        item.onclick = launch;
        this.makeAccessible(item, launch, 'menuitem');
        categoryItems.appendChild(item);
    }

    getCategoryLabel(category) {
        const labels = {
            'utilities': '🛠️ Utilities',
            'games': '🎮 Games',
            'entertainment': '🎬 Entertainment',
            'productivity': '📝 Productivity',
            'system': '⚙️ System',
            'ai': '🤖 AI',
            'external': '🚀 External Apps',
            'custom': '⚡ Custom Apps'
        };
        return labels[category] || '📂 Other';
    }

    getCategoryIcon(category) {
        const icons = {
            'utilities': '🛠️',
            'games': '🎮',
            'entertainment': '🎬',
            'productivity': '📝',
            'system': '⚙️',
            'ai': '🤖',
            'external': '🚀',
            'custom': '⚡'
        };
        return icons[category] || '📂';
    }

    addDesktopIcon(app) {
        // Track apps by category for folders
        if (!this.categoryApps) {
            this.categoryApps = {};
        }
        if (!this.categoryApps[app.category]) {
            this.categoryApps[app.category] = [];
        }
        this.categoryApps[app.category].push(app);

        // Mobile: Don't show folder icons, they'll be in the app grid
        if (this.isMobile) {
            return;
        }

        this.createDesktopFolderIcon(app.category);
    }

    // Desktop: Create folder icon for category (only once per category)
    createDesktopFolderIcon(category) {
        const iconsContainer = document.getElementById('icons-container');
        const folderId = `desktop-folder-${category}`;
        if (document.getElementById(folderId)) return;

        const folderIcon = document.createElement('div');
        folderIcon.id = folderId;
        folderIcon.className = 'desktop-icon desktop-folder';
        folderIcon.innerHTML = `
            <div class="desktop-icon-image">${this.getCategoryIcon(category)}</div>
            <div class="desktop-icon-label">${this.getCategoryLabel(category).replace(/^.+?\s/, '')}</div>
        `;
        folderIcon.ondblclick = () => this.openFolder(category);
        folderIcon.oncontextmenu = (e) => {
            e.preventDefault();
            this.showContextMenu(e, 'folder', category);
        };
        this.makeAccessible(folderIcon, () => this.openFolder(category));
        iconsContainer.appendChild(folderIcon);
    }

    openFolder(category) {
        const apps = this.categoryApps[category] || [];
        if (apps.length === 0) return;

        // Focus (and restore) the folder window if it is already open
        const existing = this.windows.find(w => w.app.id === `folder-${category}`);
        if (existing) {
            if (existing.minimized) this.minimizeWindow(existing.id);
            this.focusWindow(existing.id);
            return;
        }

        // Folder windows are ordinary windows, so they get the taskbar,
        // focus handling and lifecycle for free
        const folderApp = {
            id: `folder-${category}`,
            name: this.getCategoryLabel(category).replace(/^.+?\s/, ''),
            icon: this.getCategoryIcon(category),
            category,
            windowSize: { width: '400px', height: '500px' },
            onLaunch: (windowId) => {
                const grid = document.createElement('div');
                grid.className = 'folder-icons';

                apps.forEach(app => {
                    const icon = document.createElement('div');
                    icon.className = 'folder-icon';
                    icon.innerHTML = `
                        <div class="folder-icon-image">${app.icon}</div>
                        <div class="folder-icon-label">${app.name}</div>
                    `;
                    const open = () => {
                        this.launchApp(app.id);
                        this.closeWindow(windowId);
                    };
                    icon.ondblclick = open;
                    icon.onclick = () => {
                        if (this.deviceMode !== 'desktop') open();
                    };
                    this.makeAccessible(icon, open);
                    grid.appendChild(icon);
                });

                const wrap = document.createElement('div');
                wrap.className = 'folder-content';
                wrap.appendChild(grid);

                const content = this.getWindowContent(windowId);
                content.appendChild(wrap);
            }
        };

        const windowId = this.createWindow(folderApp);
        folderApp.onLaunch(windowId);
    }

    setupTaskbar() {
        const startButton = document.getElementById('start-button');
        startButton.onclick = () => this.toggleStartMenu();
        this.makeAccessible(startButton, () => this.toggleStartMenu());
        startButton.setAttribute('aria-haspopup', 'menu');
    }

    toggleStartMenu() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.toggle('hidden');
    }

    hideStartMenu() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.add('hidden');
    }

    setupStartMenu() {
        document.addEventListener('click', (e) => {
            const startMenu = document.getElementById('start-menu');
            const startButton = document.getElementById('start-button');
            if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
                this.hideStartMenu();
            }
        });

        // Keyboard: Escape closes menus, arrows move through start-menu items
        document.addEventListener('keydown', (e) => {
            const startMenu = document.getElementById('start-menu');
            const menuOpen = !startMenu.classList.contains('hidden');

            if (e.key === 'Escape') {
                const contextMenu = document.getElementById('os-context-menu');
                if (contextMenu && contextMenu.style.display !== 'none') {
                    contextMenu.style.display = 'none';
                } else if (menuOpen) {
                    this.hideStartMenu();
                    document.getElementById('start-button').focus();
                }
                return;
            }

            if (menuOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                e.preventDefault();
                const items = Array.from(startMenu.querySelectorAll('.start-menu-item'));
                if (items.length === 0) return;
                const current = items.indexOf(document.activeElement);
                const next = e.key === 'ArrowDown'
                    ? (current + 1) % items.length
                    : (current - 1 + items.length) % items.length;
                items[next].focus();
            }
        });
    }

    setupContextMenu() {
        // Create context menu element
        const contextMenu = document.createElement('div');
        contextMenu.id = 'os-context-menu';
        contextMenu.className = 'context-menu';
        contextMenu.style.display = 'none';
        document.body.appendChild(contextMenu);

        // Hide context menu on click elsewhere
        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });

        // Prevent default context menu on desktop
        document.getElementById('desktop').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, 'desktop');
        });
    }

    showContextMenu(e, type, data = null) {
        const contextMenu = document.getElementById('os-context-menu');
        let menuItems = [];

        if (type === 'desktop') {
            menuItems = [
                { label: '🔄 Refresh', action: () => location.reload() },
                { label: '⚙️ Settings', action: () => this.launchApp('settings') },
                { label: '❓ Help', action: () => this.launchApp('help') }
            ];
        } else if (type === 'folder') {
            menuItems = [
                { label: '📂 Open', action: () => this.openFolder(data) },
                { label: '🔄 Refresh', action: () => location.reload() }
            ];
        }

        // Build menu items
        contextMenu.innerHTML = '';
        contextMenu.setAttribute('role', 'menu');
        menuItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'context-menu-item';
            el.textContent = item.label;
            const activate = () => {
                item.action();
                contextMenu.style.display = 'none';
            };
            el.onclick = (ev) => {
                ev.stopPropagation();
                activate();
            };
            this.makeAccessible(el, activate, 'menuitem');
            contextMenu.appendChild(el);
        });

        // Position and show menu
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.style.display = 'block';

        e.stopPropagation();
    }

    setupMobileLayout() {
        if (!this.categoryApps) return;

        const iconsContainer = document.getElementById('icons-container');
        iconsContainer.innerHTML = ''; // Clear desktop
        iconsContainer.className = 'mobile-app-grid';

        // Create scrollable pages container
        const pagesContainer = document.createElement('div');
        pagesContainer.className = 'mobile-pages-container';
        pagesContainer.id = 'mobile-pages';

        // Get all apps sorted by category
        const allApps = [];
        Object.keys(this.categoryApps).forEach(category => {
            this.categoryApps[category].forEach(app => {
                allApps.push(app);
            });
        });

        // Calculate apps per page (4x5 grid = 20 apps per page)
        const appsPerPage = 20;
        const numPages = Math.ceil(allApps.length / appsPerPage);

        // Create pages
        for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
            const page = document.createElement('div');
            page.className = 'mobile-page';

            const startIndex = pageIndex * appsPerPage;
            const endIndex = Math.min(startIndex + appsPerPage, allApps.length);

            for (let i = startIndex; i < endIndex; i++) {
                const app = allApps[i];
                const appIcon = document.createElement('div');
                appIcon.className = 'mobile-app-icon';
                appIcon.innerHTML = `
                    <div class="mobile-app-icon-image">${app.icon}</div>
                    <div class="mobile-app-icon-label">${app.name}</div>
                `;
                appIcon.onclick = () => this.launchApp(app.id);
                this.makeAccessible(appIcon, () => this.launchApp(app.id));
                page.appendChild(appIcon);
            }

            pagesContainer.appendChild(page);
        }

        iconsContainer.appendChild(pagesContainer);

        // Add page indicator dots and navigation arrows
        if (numPages > 1) {
            const pageIndicator = document.createElement('div');
            pageIndicator.className = 'mobile-page-indicator';
            pageIndicator.id = 'page-indicator';

            for (let i = 0; i < numPages; i++) {
                const dot = document.createElement('div');
                dot.className = 'page-dot' + (i === 0 ? ' active' : '');
                pageIndicator.appendChild(dot);
            }

            iconsContainer.appendChild(pageIndicator);

            // Add navigation arrows
            const leftArrow = document.createElement('div');
            leftArrow.className = 'mobile-nav-arrow mobile-nav-left';
            leftArrow.id = 'mobile-nav-left';
            leftArrow.innerHTML = '‹';
            leftArrow.style.display = 'none'; // Hidden on first page
            iconsContainer.appendChild(leftArrow);

            const rightArrow = document.createElement('div');
            rightArrow.className = 'mobile-nav-arrow mobile-nav-right';
            rightArrow.id = 'mobile-nav-right';
            rightArrow.innerHTML = '›';
            iconsContainer.appendChild(rightArrow);

            // Setup swipe functionality
            this.setupMobileSwipe(pagesContainer, numPages);
        }
    }

    setupMobileSwipe(pagesContainer, numPages) {
        let currentPage = 0;
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        const leftArrow = document.getElementById('mobile-nav-left');
        const rightArrow = document.getElementById('mobile-nav-right');

        const updatePage = (page) => {
            currentPage = Math.max(0, Math.min(page, numPages - 1));
            pagesContainer.style.transform = `translateX(-${currentPage * 100}%)`;

            // Update dots
            const dots = document.querySelectorAll('.page-dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentPage);
            });

            // Update arrow visibility
            if (leftArrow && rightArrow) {
                leftArrow.style.display = currentPage === 0 ? 'none' : 'flex';
                rightArrow.style.display = currentPage === numPages - 1 ? 'none' : 'flex';
            }
        };

        pagesContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            currentX = startX; // Initialize currentX to startX
            isDragging = true;
            pagesContainer.style.transition = 'none';
        });

        pagesContainer.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            const currentOffset = -currentPage * 100;
            const dragPercent = (diff / window.innerWidth) * 100;
            pagesContainer.style.transform = `translateX(${currentOffset + dragPercent}%)`;
        });

        pagesContainer.addEventListener('touchend', (e) => {
            if (!isDragging) return;

            const diff = currentX - startX;
            const threshold = window.innerWidth * 0.2; // 20% swipe threshold

            isDragging = false;
            pagesContainer.style.transition = 'transform 0.3s ease';

            if (diff > threshold) {
                updatePage(currentPage - 1);
            } else if (diff < -threshold) {
                updatePage(currentPage + 1);
            } else {
                updatePage(currentPage);
            }

            // Reset currentX after handling the swipe
            currentX = 0;
        });

        // Arrow click handlers
        if (leftArrow) {
            leftArrow.addEventListener('click', () => {
                updatePage(currentPage - 1);
            });
        }

        if (rightArrow) {
            rightArrow.addEventListener('click', () => {
                updatePage(currentPage + 1);
            });
        }
    }

    updateTime() {
        const timeElement = document.getElementById('taskbar-time');
        const now = new Date();
        
        // Format time in 24-hour format with seconds
        const timeOptions = {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        // Format date
        const dateOptions = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        
        const timeStr = now.toLocaleTimeString([], timeOptions);
        const dateStr = now.toLocaleDateString([], dateOptions);
        
        timeElement.innerHTML = `
            <div class="taskbar-time-display">
                <div class="taskbar-time-time">${timeStr}</div>
                <div class="taskbar-time-date">${dateStr}</div>
            </div>
        `;
    }

    launchApp(appId) {
        const app = this.apps[appId];
        if (!app) return;

        const windowId = this.createWindow(app);
        app.onLaunch(windowId);
    }

    getWindowSize(app) {
        // Default sizes for different app categories
        const defaultSizes = {
            'games': { width: '500px', height: '600px' },
            'utilities': { width: '600px', height: '500px' },
            'productivity': { width: '700px', height: '500px' },
            'entertainment': { width: '650px', height: '550px' },
            'system': { width: '700px', height: '600px' }
        };

        // Specific sizes for individual apps
        const specificSizes = {
            'snake': { width: '500px', height: '650px' },
            'tictactoe': { width: '450px', height: '600px' },
            'memory': { width: '500px', height: '600px' },
            'minesweeper': { width: '450px', height: '550px' },
            'calculator': { width: '400px', height: '550px' },
            'paint': { width: '900px', height: '700px' },
            'terminal': { width: '700px', height: '500px' },
            'notepad': { width: '700px', height: '500px' },
            'file-manager': { width: '700px', height: '550px' },
            'browser': { width: '900px', height: '700px' },
            'settings': { width: '750px', height: '600px' },
            'help': { width: '850px', height: '650px' },
            'clock': { width: '500px', height: '550px' },
            'music': { width: '500px', height: '700px' },
            'ai-chat': { width: '700px', height: '650px' }
        };

        // Use app-specific size if available, otherwise use category default
        if (app.windowSize) {
            return app.windowSize;
        } else if (specificSizes[app.id]) {
            return specificSizes[app.id];
        } else {
            return defaultSizes[app.category] || { width: '600px', height: '400px' };
        }
    }

    createWindow(app) {
        const windowId = `window-${Date.now()}`;
        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.id = windowId;
        windowEl.setAttribute('role', 'dialog');
        windowEl.setAttribute('aria-label', app.name);
        windowEl.style.zIndex = this.zIndexCounter++;

        // Mobile: Open apps fullscreen
        if (this.isMobile) {
            windowEl.classList.add('maximized');
        } else {
            // Desktop: Set window size based on app preferences, clamped to viewport
            const windowSize = this.getWindowSize(app);
            const width = Math.min(parseInt(windowSize.width), window.innerWidth - 20);
            const height = Math.min(parseInt(windowSize.height), window.innerHeight - 60);
            windowEl.style.width = width + 'px';
            windowEl.style.height = height + 'px';

            // Center window on screen
            const centerX = (window.innerWidth - width) / 2;
            const centerY = (window.innerHeight - height - 40) / 2; // 40 for taskbar
            windowEl.style.left = Math.max(10, centerX) + 'px';
            windowEl.style.top = Math.max(10, centerY) + 'px';
        }

        windowEl.innerHTML = `
            <div class="window-titlebar">
                <span class="window-title">${app.icon} ${app.name}</span>
                <div class="window-controls">
                    <button class="window-btn minimize">−</button>
                    <button class="window-btn maximize">□</button>
                    <button class="window-btn close">×</button>
                </div>
            </div>
            <div class="window-content" id="${windowId}-content"></div>
        `;

        document.getElementById('desktop').appendChild(windowEl);

        // Window dragging
        this.makeWindowDraggable(windowEl);

        // Window resizing
        this.makeWindowResizable(windowEl);

        // Window controls
        windowEl.querySelector('.close').onclick = (e) => {
            e.stopPropagation();
            this.closeWindow(windowId);
        };
        windowEl.querySelector('.minimize').onclick = (e) => {
            e.stopPropagation();
            this.minimizeWindow(windowId);
        };
        windowEl.querySelector('.maximize').onclick = (e) => {
            e.stopPropagation();
            this.toggleMaximize(windowId);
        };

        // Raise the window when any part of it is pressed (capture phase, no preventDefault)
        windowEl.addEventListener('pointerdown', () => this.focusWindow(windowId), true);

        // Add to taskbar
        this.addToTaskbar(windowId, app);

        this.windows.push({ id: windowId, app, element: windowEl, minimized: false, maximized: this.isMobile });
        this.focusWindow(windowId);

        return windowId;
    }

    makeWindowDraggable(windowEl) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        // Keep at least part of the titlebar reachable on screen
        const clampToViewport = (x, y) => {
            const minVisible = 60;
            const maxX = window.innerWidth - minVisible;
            const minX = minVisible - windowEl.offsetWidth;
            const maxY = window.innerHeight - 90; // titlebar stays above the taskbar
            return {
                x: Math.min(Math.max(x, minX), maxX),
                y: Math.min(Math.max(y, 0), maxY)
            };
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            const pos = clampToViewport(e.clientX - initialX, e.clientY - initialY);
            currentX = pos.x;
            currentY = pos.y;

            windowEl.style.left = currentX + 'px';
            windowEl.style.top = currentY + 'px';
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        const handleMouseDown = (e) => {
            if (e.target.classList.contains('window-btn')) return;
            if (windowEl.classList.contains('maximized')) return;

            isDragging = true;
            initialX = e.clientX - windowEl.offsetLeft;
            initialY = e.clientY - windowEl.offsetTop;

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        titlebar.addEventListener('mousedown', handleMouseDown);

        // Touch support for phones/tablets
        const handleTouchMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            const touch = e.touches[0];
            const pos = clampToViewport(touch.clientX - initialX, touch.clientY - initialY);
            currentX = pos.x;
            currentY = pos.y;

            windowEl.style.left = currentX + 'px';
            windowEl.style.top = currentY + 'px';
        };

        const handleTouchEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };

        const handleTouchStart = (e) => {
            if (e.target.classList.contains('window-btn')) return;
            if (windowEl.classList.contains('maximized')) return;

            isDragging = true;
            const touch = e.touches[0];
            initialX = touch.clientX - windowEl.offsetLeft;
            initialY = touch.clientY - windowEl.offsetTop;

            // passive: false so preventDefault can stop page scrolling during the drag
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
        };

        titlebar.addEventListener('touchstart', handleTouchStart);
    }

    makeWindowResizable(windowEl) {
        const minWidth = 300;
        const minHeight = 200;

        const resizers = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
        resizers.forEach(direction => {
            const resizer = document.createElement('div');
            resizer.className = `resizer resizer-${direction}`;
            windowEl.appendChild(resizer);

            let isResizing = false;
            let startX, startY, startWidth, startHeight, startLeft, startTop;

            const handleMouseMove = (e) => {
                if (!isResizing) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                if (direction.includes('e')) {
                    windowEl.style.width = Math.max(minWidth, startWidth + deltaX) + 'px';
                }
                if (direction.includes('w')) {
                    const newWidth = Math.max(minWidth, startWidth - deltaX);
                    if (newWidth > minWidth) {
                        windowEl.style.width = newWidth + 'px';
                        windowEl.style.left = startLeft + deltaX + 'px';
                    }
                }
                if (direction.includes('s')) {
                    windowEl.style.height = Math.max(minHeight, startHeight + deltaY) + 'px';
                }
                if (direction.includes('n')) {
                    const newHeight = Math.max(minHeight, startHeight - deltaY);
                    if (newHeight > minHeight) {
                        windowEl.style.height = newHeight + 'px';
                        windowEl.style.top = startTop + deltaY + 'px';
                    }
                }
            };

            const handleMouseUp = () => {
                if (isResizing) {
                    isResizing = false;
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                }
            };

            resizer.addEventListener('mousedown', (e) => {
                if (windowEl.classList.contains('maximized')) return;

                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = windowEl.offsetWidth;
                startHeight = windowEl.offsetHeight;
                startLeft = windowEl.offsetLeft;
                startTop = windowEl.offsetTop;

                e.stopPropagation();
                e.preventDefault();

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });

            // Touch support for phones/tablets
            const handleTouchMove = (e) => {
                if (!isResizing) return;

                e.preventDefault();
                const touch = e.touches[0];
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;

                if (direction.includes('e')) {
                    windowEl.style.width = Math.max(minWidth, startWidth + deltaX) + 'px';
                }
                if (direction.includes('w')) {
                    const newWidth = Math.max(minWidth, startWidth - deltaX);
                    if (newWidth > minWidth) {
                        windowEl.style.width = newWidth + 'px';
                        windowEl.style.left = startLeft + deltaX + 'px';
                    }
                }
                if (direction.includes('s')) {
                    windowEl.style.height = Math.max(minHeight, startHeight + deltaY) + 'px';
                }
                if (direction.includes('n')) {
                    const newHeight = Math.max(minHeight, startHeight - deltaY);
                    if (newHeight > minHeight) {
                        windowEl.style.height = newHeight + 'px';
                        windowEl.style.top = startTop + deltaY + 'px';
                    }
                }
            };

            const handleTouchEnd = () => {
                if (isResizing) {
                    isResizing = false;
                    document.removeEventListener('touchmove', handleTouchMove);
                    document.removeEventListener('touchend', handleTouchEnd);
                }
            };

            resizer.addEventListener('touchstart', (e) => {
                if (windowEl.classList.contains('maximized')) return;

                isResizing = true;
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                startWidth = windowEl.offsetWidth;
                startHeight = windowEl.offsetHeight;
                startLeft = windowEl.offsetLeft;
                startTop = windowEl.offsetTop;

                e.stopPropagation();

                // passive: false so preventDefault can stop page scrolling during the resize
                document.addEventListener('touchmove', handleTouchMove, { passive: false });
                document.addEventListener('touchend', handleTouchEnd);
            });
        });
    }

    focusWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        if (!windowEl) return;

        windowEl.style.zIndex = this.zIndexCounter++;
        this.activeWindowId = windowId;

        // Highlight the matching taskbar item
        document.querySelectorAll('.taskbar-item.active').forEach(el => el.classList.remove('active'));
        const taskbarItem = document.getElementById(`taskbar-${windowId}`);
        if (taskbarItem) taskbarItem.classList.add('active');
    }

    closeWindow(windowId) {
        const window = this.windows.find(w => w.id === windowId);
        if (!window) return;

        if (typeof window.app.onClose === 'function') {
            try {
                window.app.onClose(windowId);
            } catch (e) {
                console.warn(`SimpleOS: onClose for "${window.app.id}" failed`, e);
            }
        }
        this.cleanupWindowResources(windowId);

        window.element.remove();
        this.removeFromTaskbar(windowId);
        this.windows = this.windows.filter(w => w.id !== windowId);
    }

    // Intervals/listeners registered through these helpers are cleaned up
    // automatically when the window closes.
    setWindowInterval(windowId, fn, ms) {
        const id = setInterval(fn, ms);
        (this.windowResources[windowId] = this.windowResources[windowId] || [])
            .push(() => clearInterval(id));
        return id;
    }

    addWindowListener(windowId, target, event, fn, options) {
        target.addEventListener(event, fn, options);
        (this.windowResources[windowId] = this.windowResources[windowId] || [])
            .push(() => target.removeEventListener(event, fn, options));
    }

    cleanupWindowResources(windowId) {
        (this.windowResources[windowId] || []).forEach(dispose => dispose());
        delete this.windowResources[windowId];
    }

    async clearAllData() {
        const confirmed = await this.ui.confirm(
            'This will clear ALL cookies and localStorage data, including:\n\n• Custom apps\n• AI chat settings\n• File system data\n• Settings and preferences\n\nThis action cannot be undone. Continue?',
            { title: '⚠️ Clear All Data', danger: true, confirmLabel: 'Clear Everything' }
        );
        if (!confirmed) return;

        localStorage.clear();

        document.cookie.split(';').forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        });

        location.reload();
    }

    minimizeWindow(windowId) {
        const window = this.windows.find(w => w.id === windowId);
        if (!window) return;

        window.element.classList.toggle('minimized');
        window.minimized = !window.minimized;

        if (window.minimized) {
            const item = document.getElementById(`taskbar-${windowId}`);
            if (item) item.classList.remove('active');
        }
    }

    toggleMaximize(windowId) {
        const window = this.windows.find(w => w.id === windowId);
        if (!window) return;

        window.element.classList.toggle('maximized');
        window.maximized = !window.maximized;
    }

    addToTaskbar(windowId, app) {
        const taskbarApps = document.getElementById('taskbar-apps');
        const item = document.createElement('div');
        item.className = 'taskbar-item';
        item.id = `taskbar-${windowId}`;
        item.innerHTML = `${app.icon} ${app.name}`;
        const activate = () => {
            const window = this.windows.find(w => w.id === windowId);
            if (window.minimized) {
                this.minimizeWindow(windowId);
            }
            this.focusWindow(windowId);
        };
        item.onclick = activate;
        this.makeAccessible(item, activate);
        taskbarApps.appendChild(item);
    }

    removeFromTaskbar(windowId) {
        const item = document.getElementById(`taskbar-${windowId}`);
        if (item) item.remove();
    }

    getWindowContent(windowId) {
        return document.getElementById(`${windowId}-content`);
    }
}

// Initialize OS
const os = new SimpleOS();
