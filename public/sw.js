self.addEventListener('push', function (event) {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: data.icon,
        vibrate: [200, 100, 200, 100, 200, 100, 200], // Long vibration for calls
        requireInteraction: true, // Keep it visible
        tag: data.tag || 'general',
        data: data.data,
        actions: [
            { action: 'open', title: 'Answer / View' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Check if there's already a tab open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // If exact match or base match, focus it
                if (client.url && 'focus' in client) {
                    // Optionally check if client.url matches app url
                    return client.focus();
                }
            }
            // No tab open, open new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
