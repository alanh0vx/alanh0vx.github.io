// Chinese Chess (external game launcher)
os.registerApp({
    id: 'chinese-chess',
    name: 'Chinese Chess',
    icon: '<img src="chinese-chess/icon.png" class="app-icon-img" alt="Chinese Chess">',
    category: 'external',

    onLaunch(windowId) {
        window.open('chinese-chess/', '_blank');
        os.closeWindow(windowId);
    }
});
