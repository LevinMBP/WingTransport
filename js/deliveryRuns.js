import scheduleDB from "../database/delivery-schedule-db.js";

if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
        .then((registration) => {

        })
        .then(() => {
            // console.log("Background Sync Registered");
        })
        .catch((err) => {
            console.log("Registration Failed: ", err);
        })
}
else {
    console.log('Service Worker or Sync Manager not supported');
}

const pageSelector = document.getElementById("pageSelectorRun");


window.onload = async () => {
    scheduleDB.open()
        .then(() => {
            scheduleDB.getPendingDeliveries();
            scheduleDB.getAll().then(renderListOfDeliveries);
        })
        .catch((err) => {
            console.log("Error: ", err);
        });
}

pageSelector.addEventListener('change', (e) => {

    if (e.target.value === "schedule") {
        const base = window.location.href.split("/pages")[0];
        window.location.replace(base);
    }
})

function renderListOfDeliveries(items) {

    if (items) {
        let parentElement = document.getElementById("listOfRuns");

        parentElement.innerHTML = "";

        items.map((item, index) => {

            const navigateBtn = createButton("Navigate", `${item.id}-${index}`);

            navigateBtn.className = "navigate-btn"
            navigateBtn.innerHTML = `<i class='fa fa-location-arrow' aria-hidden='true' id=${item.id}></i>`;

            parentElement.innerHTML += `
                <div class="item-card-container">
                    <div class="item-card">
                        <div class="item-card-header">
                            <div class="item-title">
                                <h5>Delivery ID: <span class="span-content header-title-content">${item.id}</span></h5>
                            </div>
                        </div>
                        <div class="item-card-body">
                            <div class="item-company_name">
                                <h5>${item.company_name}</h5>
                            </div>
                            <div class="item-address">
                                <h5>Address: 
                                    <span class="span-content body-address-content">
                                        ${item.address2} 
                                        ${item.address1} 
                                        ${item.city}
                                        ${item.province}
                                        ${item.postalcode}
                                    </span>
                                </h5>
                            </div>
                            <div class="item-status">
                                <h5>Status: 
                                    <span class="span-content body-status-content">
                                        ${item.status}
                                    </span>
                                </h5>
                            </div>
                        </div>
                    </div>

                    <div class="btn btn-actions-wrapper">
                        <div class="btn btn-navigate" id="btn-navigate-${index}">
                            
                        </div>
                    </div>
                </div>
            `;
            document.getElementById(`btn-navigate-${index}`).appendChild(navigateBtn);
        })

        const navigatebtns = document.querySelectorAll("button.navigate-btn");

        navigatebtns.forEach((button, index) => button.addEventListener("click", event => navigateRoute(event)));

    }
}

// Opens google maps and show routes
async function navigateRoute(event) {
    console.log(event.target)
    const routeId = event.target.id;
    console.log(routeId)
    try {
        const { address1, city, province, postalcode } = await scheduleDB.getDeliveryByID(routeId);
        const { latitude, longitude } = await handleGeolocation();

        const origin = `${latitude},${longitude}`;
        const toStringDest = `${address1}, ${city} ${province} ${postalcode}`;
        const formatedDest = toStringDest.split(" ").join("+")

        const urlQuery = `https://maps.google.com/maps/dir/?api=1&origin=${origin}&destination=${formatedDest}`;
        window.open(urlQuery);

    }
    catch (err) {
        console.log(err)
    }
}

function handleGeolocation() {
    return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
            // Get current position
            console.log(navigator.geolocation)
            navigator.geolocation.getCurrentPosition(
                // on success callback
                (position) => {
                    console.log("CUrrent Position: ", position);

                    resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude })
                },

                // on error callback
                (err) => {
                    reject("Current Position Error: ", err);
                }
            );

            // // Watch when position change
            // navigator.geolocation.watchPosition(
            //     // On success callback
            //     (position) => {
            //         console.log("Watching Position: ", position);

            //         resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude })
            //     },
            //     // Error callback
            //     (err) => {
            //         reject("Watch Position Error: ", err);
            //     }
            // )
        }
        else {
            reject("Geolocation API not available on this device");
        }
    })

}

function createButton(text, id) {
    const btnElem = document.createElement('button');
    btnElem.innerText = text;
    btnElem.id = id;
    return btnElem;
}