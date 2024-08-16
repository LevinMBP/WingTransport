import scheduleDB from "../database/delivery-schedule-db.js";


if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.register('service-worker.js', { scope: '/', type: 'module' })
        .then((res) => {
            // console.log("Registration Success: ", res);
        })
        .catch((err) => {
            console.log("Registration Failed: ", err);
        })

    navigator.serviceWorker.ready
        .then((registration) => {
            if ("Notification" in window) {
                // Check permission
                const currentPermission = Notification.permission;

                if (currentPermission === 'default') {
                    requestUserPermission();
                }

            }
        })

}
else {
    console.log('Service Worker or Sync Manager not supported');
}

const pageSelector = document.getElementById("pageSelectorMain");
const myForm = document.getElementById("scheduleForm");
const pickupdate = document.getElementById("pickup_date");
const companyname = document.getElementById("company_name");
const address1 = document.getElementById("address1");
const postalcode = document.getElementById("postalcode");
const contactnumber = document.getElementById("contact_no");
const packagesize = document.getElementById("package_size");
const packageweight = document.getElementById("package_weight");
const submitBtn = document.getElementById("submitBtn");

var errMsg = document.getElementById("errMsg");
var succMsg = document.getElementById("succMsg");
var postalErr = false;

const ALLOWED_POSTAL = ['N6E', 'N6P', 'N6N', 'N6M', 'N6L', 'N6K', 'N6J', 'N6G', 'N5V', 'N5Z', 'N5Y', 'N5X', 'N6A', 'N6C', 'N5W', 'N6H', 'N6B'];


// Event Listeners
window.onload = () => {
    scheduleDB.open();

    const dateToday = new Date();
    const mindate = new Date((dateToday.getTime() + 2 * 24 * 60 * 60 * 1000)).toISOString().split('T', 1)[0]
    pickupdate.setAttribute('min', mindate);

}

pageSelector.addEventListener('change', (e) => {
    console.log(e.target.value)
    if (e.target.value === "runs") {
        const base = window.location.href
        window.location.replace(`${base}pages/delivery_runs.html`);
    }
})

myForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit()
})

postalcode.addEventListener('focusout', (e) => {
    console.log(e.target.value);
    const postal = e.target.value;
    if (postal.length !== 6) {
        errMsg.innerHTML = `<h6>Invalid Postal Code</h6>`;
        errMsg.classList.add("show");

        return;
    }

    // Formats postal code
    const dataArr = (e.target.value).split('');
    const formated = dataArr.splice(3, 0, " ");
    e.target.value = dataArr.toString().split(",").join("").toUpperCase();
})




async function handleSubmit() {
    const formData = new FormData(myForm);

    var data = Object.fromEntries(formData);
    console.log(data.postalcode)

    if (!data.pickup_date || !data.company_name || !data.postalcode || !data.contact_no || !data.package_size || !data.package_weight || !data.address1) {
        errMsg.classList.add("show");
        return;
    }
    if (postalErr) {
        return;
    }
    data['status'] = "pending";
    data['city'] = "London";
    data['province'] = "ON";
    data['country'] = "Canada";
    await scheduleDB.add(data);

    const currentPermission = Notification.permission;
    switch (Notification.permission) {
        case 'default':
            requestUserPermission();
            break;
        case 'granted':
            displayNotification();
            break;
        case 'denied':
            // notificationNotAllowed();
            break;
    }
}

// Push is seding message from server to user
// Notificaion is for displaying the information received
// Normally called Push Notification because most the time they go together

// Request the users permission to send notifications
function requestUserPermission() {
    // Requests a new permission
    Notification.requestPermission()
        .then((permission) => {

            if (permission === 'granted') {

                // Subscribe the device to receive push messages
                configurePushSubscription();
            }
        })
}

// Subscribe the device to receive push messages
async function configurePushSubscription() {
    try {

        // PushManager interface provides a way to receive notifications from third-party servers
        const registration = await navigator.serviceWorker.ready;
        const pushManager = registration.pushManager;

        // Returns an object containing details of existing subscription
        // Retiurns null if user is not subscribed
        let getSubscription = await pushManager.getSubscription();
        if (getSubscription === null) {
            // https://vapidkeys.com/
            const publicKey = "BF03c7t3TQ8vZCVV0ixTNs_bXyBTahpvVNTxzt4ex_F5AcGfLFfXLEBJPhQ-pKZ2pGez72pigH0dyPrj2Jocgr4";
            const options = {
                userVisibleOnly: true,
                applicationServerKey: publicKey,
            }
            // Createsa new push subscription
            getSubscription = await pushManager.subscribe(options);

            // If new subscription is created.
            // Needs to save to database
            await scheduleDB.open();
            await scheduleDB.subscribe(getSubscription);
            console.log("Subscription Saved!");
        }
        // Goes here if Client is already subscribed.
        // Does not need to save to db if Client already subscribed.
        console.log("Subscription: ", getSubscription);
    }
    catch (err) {
        console.log(err)
    }
}

// Display a notification
function displayNotification() {
    console.log("Showing Notification...");

    const options = {
        body: "Go to Delivery Run Page for more info",
        icon: "/assets/images/logo.png",
        image: "../assets/images/thank-you.jpg",
        data: {
            title: "Dummy",
            body: "hotdog"
        }
    }
    // Can not apply actions to this Notification
    // new Notification('Successfully Subscribed', options);

    // ServiceWorker notification 
    navigator.serviceWorker.ready
        .then((registration) => {
            registration.showNotification("NEW DELIVERY WAS POSTED", options);
        })

}