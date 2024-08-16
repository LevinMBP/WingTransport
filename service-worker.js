import scheduleDB from "./database/delivery-schedule-db.js";
const CACHENAME = 'cacheAssets-v1';

const addResourceToCache = async (resource) => {
    try {
        const cache = await cache.open(CACHENAME);
        await cache.addAll(resource);
    }
    catch (err) {
        console.log("SOmething went wrong: ", err)
    }
}

self.addEventListener('install', (event) => {
    // console.log("[SW] Install : ", event);

    // Activates itself automatically when it enters waiting phase. 
    self.skipWaiting();

    // Creates static cache.
    event.waitUntil(
        addResourceToCache([
            "/",
            "/index.html",
            "/css/styles.css",
            "/css/deliveryRuns.css",
            "/js/scheduleDelivery.js",
            "/js/deliveryRuns.js",
            "/manifest.json",
            "/pages/delivery_runs.html",
            "/assets/images/favicon.ico",
            "/assets/images/logo.png",
            "/assets/images/favicon-32x32.png",
            "/assets/images/favicon-16x16.png",
            "/assets/images/android-chrome-192x192.png",
        ])
        // caches.open(CACHENAME)
        //     .then((cache) => {
        //         // console.log(cache);
        //         cache.addAll([
        //             "/",
        //             "/index.html",
        //             "/css/styles.css",
        //             "/css/deliveryRuns.css",
        //             "/js/scheduleDelivery.js",
        //             "/js/deliveryRuns.js",
        //             "/manifest.json",
        //             "/pages/delivery_runs.html",
        //             "/assets/images/favicon.ico",
        //             "/assets/images/logo.png",
        //             "/assets/images/favicon-32x32.png",
        //             "/assets/images/favicon-16x16.png",
        //             "/assets/images/android-chrome-192x192.png",
        //         ])
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //     })
    )

})

self.addEventListener('activate', (event) => {
    // console.log("[SW] Activate: ", event);

    // Immediately get control over the open pages.
    event.waitUntil(
        clients.claim()
    );

    //  Remove caches that are stale.
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHENAME)
                        .map(itemName => caches.delete(itemName))
                )
            })
    );
})

self.addEventListener('fetch', (event) => {
    // Stale Cache with Network Revalidate Strategy
    if (event.request.method === "GET") {
        event.respondWith(
            caches.open(CACHENAME)
                .then((cache) => {
                    return cache.match(event.request)
                        .then((cachedResponse) => {
                            const fetchResponse = fetch(event.request)
                                .then((networkResponse) => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                            return cachedResponse || fetchResponse;
                        })
                })
        )
    }
})

// Soon as connection can be used and SW is running. sync event will be sent to SW
self.addEventListener('sync', (event) => {
    // console.log(event);
    if (event.tag === "add-delivery") {
        console.log(scheduleDB)
        addDeliveryToFirebaseDB();
    }
})

// Using SW add deliveries on indexed db
function addDeliveryToFirebaseDB() {
    // Open localdb
    scheduleDB.openLocalDB()
        .then(() => {
            scheduleDB.getAllLocalDB()
                .then((items) => {
                    console.log(items)

                    // Open clouddb
                    scheduleDB.open()
                        .then(() => {

                            // Save items in cloud db
                            items.forEach(item => {

                                // Call add function
                                scheduleDB.add(item)
                                    .then(() => {
                                        scheduleDB.deleteLocalDB()
                                    })
                                    .catch((err) => console.log(err))
                            })
                        })
                        .catch((err) => console.log(err))
                })
        })
        .catch((err) => {
            console.log(err)
        })
}

// On Push Event / PushAPI
// Only gets triggered when beckend pushes a message
self.addEventListener('push', (event) => {

    console.log(event.data.text())
    console.log(JSON.parse(event.data.text()))


    // Data sent by a Server/ThirdParty
    // Can be both text or json. Needs to verify with sender
    const dataText = event.data.text();
    // const dataJson = event.data.json();

    // This data came from the backend
    const dataParsed = JSON.parse(dataText);

    // Set the notification option config
    const options = {
        body: dataParsed.body,
        data: dataParsed.url,
        image: dataParsed.image,
    }

    // Dispaly the notification
    event.waitUntil(
        self.registration.showNotification(dataParsed.title, options)
    )


})

self.addEventListener('notificationclick', (event) => {
    console.log("Gets called when User clicks on the notification")
})