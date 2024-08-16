import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';


class DeliverySchedule {
    constructor() {
        this.db = null;
        this.localDB = null;
        this.isAvailable = false;
        this.isLocal = false;
        this.swController = null;
        this.swRegistration = null;
    }

    something() {

    }

    open() {

        return new Promise((resolve, reject) => {

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready
                    .then((registration) => {
                        if ('active' in registration && 'sync' in registration) {
                            this.openLocalDB()
                                .then(() => {
                                    this.swController = registration.active;
                                    this.swRegistration = registration;
                                    this.openCloudDB().then(resolve).catch(reject);
                                })
                                .catch(() => {
                                    this.openCloudDB().then(resolve).catch(reject);
                                })
                        }
                        else {
                            this.openCloudDB().then(resolve).catch(reject);
                        }
                    })

            }
            else {
                this.openCloudDB().then(resolve).catch(reject);
            }
        })

    }

    openCloudDB() {
        return new Promise((resolve, reject) => {
            if (navigator.onLine) {
                try {
                    // Your web app's Firebase configuration
                    const firebaseConfig = {
                        apiKey: "AIzaSyAmAPcc_M1G24A6aHdmYpvsMSjuSsIu6WQ",
                        authDomain: "info-6128-project-b45fe.firebaseapp.com",
                        projectId: "info-6128-project-b45fe",
                        storageBucket: "info-6128-project-b45fe.appspot.com",
                        messagingSenderId: "679152342511",
                        appId: "1:679152342511:web:6733a5db3cc942c035521a"
                    };

                    // Initialize Firebase
                    const app = initializeApp(firebaseConfig);

                    // Initialize Cloud Firestore and get a reference to the service
                    const db = getFirestore(app);

                    if (db) {
                        this.db = db;
                        this.isAvailable = true;
                        console.log("Cloud DB is Activated!");
                        resolve();
                    }
                    else {
                        reject('Database not available');
                    }

                }
                catch (err) {
                    reject(err.message);
                }
            }
            else {
                reject("No Internet connection")
            }

        })
    }

    openLocalDB() {
        return new Promise((resolve, reject) => {
            // Check if available indexeddb is available global scope
            if (indexedDB) {
                // Open or Create local database
                const request = indexedDB.open('Delivery', 2);

                // handles localdb error when opening or creating
                request.onerror = (event) => {
                    reject(event.target.error.message);
                }

                request.onsuccess = (event) => {
                    const db = event.target.result;
                    if (db) {
                        this.localDB = db;
                        this.isLocal = true;
                        console.log("IndexedDB is Activated");
                        resolve();
                    }
                    else {
                        console.log("something went wrong creating local db");
                        reject();
                    }
                }

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    const objectStore = db.createObjectStore("Deliveries", { autoIncrement: true })
                }
            }
        })
    }

    add(data) {
        return new Promise((resolve, reject) => {
            if (navigator.onLine) {
                if (!this.isAvailable) {
                    reject("Database not connected");
                }

                // Create Playlist object to be added
                // const track = { title, artist, likes };

                // Connect to Firebase Collection
                const dbCollection = collection(this.db, 'Schedule');

                // Adds new Playlist object to the collection
                addDoc(dbCollection, data)
                    .then((docRes) => {
                        console.log("Doc response: ", docRes.id);
                        resolve();
                    })
                    .catch((err) => {
                        reject(err.message)
                    })
            }
            else {
                this.swRegistration.sync.getTags()
                    .then((tags) => {
                        if (!tags.includes('add-delivery')) {
                            console.log("tag was created")
                            this.swRegistration.sync.register("add-delivery");
                        }
                    })
                this.addLocalDB(data).then((res) => { }).catch((err) => { });
            }

        });
    }

    addLocalDB(data) {
        return new Promise((resolve, reject) => {
            if (!this.isLocal) {
                reject("Database not connected");
            }

            const transaction = this.localDB.transaction(["Deliveries"], 'readwrite');
            transaction.onerror = (event) => {
                reject(event.target.error.message);
            }
            data['status'] = 'pending';
            // Store handlers
            const store = transaction.objectStore("Deliveries");
            const storeRequest = store.add(data);

            storeRequest.onerror = (event) => {
                reject(event.target.error.message);
            }

            store.onsuccess = () => {
                console.log("Added to indexeddb");
                resolve();
            }
        })
    }

    getAll() {
        if (!this.isAvailable) {
            console.log("Database not connected");
            return
        }
        const getData = async () => {
            const querySnapshot = await getDocs(collection(this.db, "Schedule"));
            const playlist = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                data.id = doc.id;
                playlist.push(data);
            });
            return playlist
        }
        return getData();
    }

    getAllLocalDB() {
        return new Promise((resolve, reject) => {
            if (!this.isLocal) {
                reject("Database not connected");
            }

            const transaction = this.localDB.transaction(["Deliveries"], 'readonly');

            transaction.onerror = (event) => {
                reject(event.target.error.message);
            }

            // Store handlers
            const store = transaction.objectStore("Deliveries");
            const request = store.getAll();

            request.onerror = (event) => {
                reject(event.target.error.message);
            }

            request.onsuccess = (event) => {
                console.log("result: ", event.target.result)
                resolve(event.target.result)
            }
        })
    }

    getDeliveryByID(id) {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable) {
                console.log("Database not connected");
                return
            }

            const getData = async () => {
                // const dbCollection = collection(this.db, "Schedule");

                const docRef = doc(this.db, "Schedule", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    console.log(docSnap.data())
                    console.log(docSnap.id)
                    const data = docSnap.data();
                    data.id = docSnap.id;
                    resolve(data);
                }
                else {
                    reject("No records found");
                }
            }
            return getData();
        })
    }

    getPendingDeliveries() {
        if (!this.isAvailable) {
            console.log("Database not connected");
            return
        }
        const getData = async () => {

            const q = query(collection(this.db, "Schedule"), where("status", "==", "pending"));

            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                // console.log(doc.data());
            })
        }
        return getData();
    }

    getOutOfDeliveries() {
        if (!this.isAvailable) {
            console.log("Database not connected");
            return
        }
        const getData = async () => {

            const q = query(collection(this.db, "Schedule"), where("status", "==", "accepted"));

            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                console.log(doc.data());
            })
        }
        return getData();
    }

    getCompletedDeliveries() {
        if (!this.isAvailable) {
            console.log("Database not connected");
            return
        }
        const getData = async () => {

            const q = query(collection(this.db, "Schedule"), where("status", "==", "completed"));

            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((doc) => {
                console.log(doc.data());
            })
        }
        return getData();
    }

    deleteLocalDB() {
        return new Promise((resolve, reject) => {
            if (!this.isLocal) {
                reject("Database not connected");
            }

            const transaction = this.localDB.transaction(["Deliveries"], "readwrite")
                .objectStore('Deliveries')
                .clear();

            // // Store handlers
            // const store = transaction.objectStore("Deliveries");
            // const request = store.delete(id);

            // request.onerror = (event) => {
            //     reject(event.target.error.message);
            // }

            transaction.onsuccess = (event) => {
                console.log("result: ", event.target.result)
                resolve();
            }
        })
    }


    subscribe(subscription) {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable) {
                reject("Database not opened");
            }

            // Connect to db then add subscription
            const dbCollection = collection(this.db, 'Subscriptions');
            addDoc(dbCollection, { subscription: JSON.stringify(subscription) })
                .then((docRes) => {
                    console.log("Doc response: ", docRes.id);
                    resolve();
                })
                .catch((err) => {
                    reject(err.message)
                })
        })
    }

}

export default new DeliverySchedule();