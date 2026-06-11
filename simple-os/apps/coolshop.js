// CoolShop (external virtual-shopping launcher)
os.registerApp({
    id: 'coolshop',
    name: 'CoolShop',
    icon: '🛍️',
    category: 'external',

    onLaunch(windowId) {
        window.open('virtual-shopping/', '_blank');
        os.closeWindow(windowId);
    }
});
