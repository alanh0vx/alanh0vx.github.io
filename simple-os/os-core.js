// SimpleOS Core System
class SimpleOS {
    constructor() {
        this.windows = [];
        this.apps = {};
        this.zIndexCounter = 100;
        this.fileSystem = this.initFileSystem();
        this.isMobile = this.detectMobile();
        this.init();
    }

    detectMobile() {
        // Check if device is mobile based on screen width and touch capability
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        return isTouchDevice && isSmallScreen;
    }

    init() {
        this.setupTaskbar();
        this.setupStartMenu();
        this.setupContextMenu();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);

        // Mobile mode: Show app grid
        if (this.isMobile) {
            setTimeout(() => this.setupMobileLayout(), 500);
        }
        // Desktop mode: Category folders are on desktop, user can double-click to open
    }

    initFileSystem() {
        const fs = localStorage.getItem('simpleOS_fileSystem');
        if (fs) {
            return JSON.parse(fs);
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
        item.onclick = () => {
            this.launchApp(app.id);
            this.hideStartMenu();
        };
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
        const iconsContainer = document.getElementById('icons-container');

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

        // Desktop: Create folder icon for category (only once per category)
        const folderId = `desktop-folder-${app.category}`;
        if (!document.getElementById(folderId)) {
            const folderIcon = document.createElement('div');
            folderIcon.id = folderId;
            folderIcon.className = 'desktop-icon desktop-folder';
            folderIcon.innerHTML = `
                <div class="desktop-icon-image">${this.getCategoryIcon(app.category)}</div>
                <div class="desktop-icon-label">${this.getCategoryLabel(app.category).replace(/^.+?\s/, '')}</div>
            `;
            folderIcon.ondblclick = () => this.openFolder(app.category);
            folderIcon.oncontextmenu = (e) => {
                e.preventDefault();
                this.showContextMenu(e, 'folder', app.category);
            };
            iconsContainer.appendChild(folderIcon);
        }
    }

    openFolder(category, position = null) {
        const apps = this.categoryApps[category] || [];
        if (apps.length === 0) return;

        // Check if folder is already open
        const folderId = `folder-${category}`;
        const existingFolder = document.getElementById(folderId);
        if (existingFolder) {
            this.focusWindow(folderId);
            return;
        }

        // Create a temporary window to show folder contents
        const windowEl = document.createElement('div');
        windowEl.className = 'window folder-window';
        windowEl.id = folderId;
        windowEl.style.zIndex = this.zIndexCounter++;
        windowEl.style.width = '400px';
        windowEl.style.height = '500px';

        // Use provided position or default
        if (position) {
            windowEl.style.left = position.x + 'px';
            windowEl.style.top = position.y + 'px';
        } else {
            windowEl.style.left = '100px';
            windowEl.style.top = '100px';
        }

        windowEl.innerHTML = `
            <div class="window-titlebar">
                <span class="window-title">📁 ${this.getCategoryLabel(category)}</span>
                <div class="window-controls">
                    <button class="window-btn minimize">−</button>
                    <button class="window-btn maximize">□</button>
                    <button class="window-btn close">×</button>
                </div>
            </div>
            <div class="window-content folder-content" id="${folderId}-content">
                <div class="folder-icons">
                    ${apps.map(app => `
                        <div class="folder-icon" ondblclick="os.launchApp('${app.id}'); document.getElementById('${folderId}').remove();">
                            <div class="folder-icon-image">${app.icon}</div>
                            <div class="folder-icon-label">${app.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('desktop').appendChild(windowEl);

        // Make folder window draggable
        this.makeWindowDraggable(windowEl);
        this.makeWindowResizable(windowEl);

        // Window controls
        windowEl.querySelector('.close').onclick = (e) => {
            e.stopPropagation();
            windowEl.remove();
        };
        windowEl.querySelector('.minimize').onclick = (e) => {
            e.stopPropagation();
            windowEl.classList.toggle('minimized');
        };
        windowEl.querySelector('.maximize').onclick = (e) => {
            e.stopPropagation();
            windowEl.classList.toggle('maximized');
        };

        windowEl.querySelector('.window-titlebar').onclick = () => this.focusWindow(folderId);
    }

    setupTaskbar() {
        const startButton = document.getElementById('start-button');
        startButton.onclick = () => this.toggleStartMenu();
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

        // Build menu HTML
        contextMenu.innerHTML = menuItems.map(item =>
            `<div class="context-menu-item" onclick="event.stopPropagation(); this.clickHandler()">${item.label}</div>`
        ).join('');

        // Attach click handlers
        const items = contextMenu.querySelectorAll('.context-menu-item');
        items.forEach((item, index) => {
            item.clickHandler = () => {
                menuItems[index].action();
                contextMenu.style.display = 'none';
            };
            item.onclick = () => item.clickHandler();
        });

        // Position and show menu
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.style.display = 'block';

        e.stopPropagation();
    }

    autoOpenCategoryFolders() {
        if (!this.categoryApps) return;

        const categories = Object.keys(this.categoryApps);
        const padding = 20;
        const folderWidth = 400;
        const folderHeight = 500;

        // Calculate how many columns can fit on screen
        const availableWidth = window.innerWidth - padding * 2;
        const availableHeight = window.innerHeight - 40 - padding * 2; // 40 for taskbar
        const maxCols = Math.floor(availableWidth / (folderWidth + padding));
        const cols = Math.min(maxCols, 3); // Max 3 columns

        categories.forEach((category, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);

            const position = {
                x: padding + col * (folderWidth + padding),
                y: padding + row * (folderHeight + padding)
            };

            // Only open if position is within visible area
            if (position.y + folderHeight < availableHeight) {
                this.openFolder(category, position);
            } else {
                // If it doesn't fit, cascade from top
                const cascadeOffset = (index - (cols * Math.floor(availableHeight / (folderHeight + padding)))) * 30;
                this.openFolder(category, { x: padding + cascadeOffset, y: padding + cascadeOffset });
            }
        });
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
        timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        windowEl.style.zIndex = this.zIndexCounter++;

        // Mobile: Open apps fullscreen
        if (this.isMobile) {
            windowEl.classList.add('maximized');
        } else {
            // Desktop: Set window size based on app preferences
            const windowSize = this.getWindowSize(app);
            windowEl.style.width = windowSize.width;
            windowEl.style.height = windowSize.height;

            // Center window on screen
            const centerX = (window.innerWidth - parseInt(windowSize.width)) / 2;
            const centerY = (window.innerHeight - parseInt(windowSize.height) - 40) / 2; // 40 for taskbar
            windowEl.style.left = Math.max(20, centerX) + 'px';
            windowEl.style.top = Math.max(20, centerY) + 'px';
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

        // Focus on click (only on titlebar or window frame, not content)
        windowEl.querySelector('.window-titlebar').onclick = () => this.focusWindow(windowId);

        // Add to taskbar
        this.addToTaskbar(windowId, app);

        this.windows.push({ id: windowId, app, element: windowEl, minimized: false, maximized: false });

        return windowId;
    }

    makeWindowDraggable(windowEl) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

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

        // Touch support for mobile
        const handleTouchMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            const touch = e.touches[0];
            currentX = touch.clientX - initialX;
            currentY = touch.clientY - initialY;

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

            document.addEventListener('touchmove', handleTouchMove);
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

            // Touch support for mobile
            const handleTouchMove = (e) => {
                if (!isResizing) return;

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

                document.addEventListener('touchmove', handleTouchMove);
                document.addEventListener('touchend', handleTouchEnd);
            });
        });
    }

    focusWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        if (windowEl) {
            windowEl.style.zIndex = this.zIndexCounter++;
        }
    }

    closeWindow(windowId) {
        const window = this.windows.find(w => w.id === windowId);
        if (!window) return;

        window.element.remove();
        this.removeFromTaskbar(windowId);
        this.windows = this.windows.filter(w => w.id !== windowId);
    }

    minimizeWindow(windowId) {
        const window = this.windows.find(w => w.id === windowId);
        if (!window) return;

        window.element.classList.toggle('minimized');
        window.minimized = !window.minimized;
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
        item.onclick = () => {
            const window = this.windows.find(w => w.id === windowId);
            if (window.minimized) {
                this.minimizeWindow(windowId);
            }
            this.focusWindow(windowId);
        };
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
