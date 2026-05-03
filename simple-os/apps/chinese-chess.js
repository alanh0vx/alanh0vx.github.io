// Chinese Chess (external game launcher)
os.registerApp({
    id: 'chinese-chess',
    name: 'Chinese Chess',
    icon: '<img src="chinese-chess/icon.png" class="app-icon-img" alt="Chinese Chess" style="width:1em;height:1em;object-fit:cover;vertical-align:middle;">',
    category: 'external',

    onLaunch(windowId) {
        window.open('chinese-chess/', '_blank');
        os.closeWindow(windowId);
    }
});
