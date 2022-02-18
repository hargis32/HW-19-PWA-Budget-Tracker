let db;

// creates a new db request for db named "budgetDB", version 1 (optional parameter)
const request = indexedDB.open('budgetDB', 1 );

// Event handler for upgrading database version when new database is loaded
request.onupgradeneeded = function (e) {
    console.log('Upgrade needed');

    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;

    console.log('DB updated from old version to new version');

    db = e.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('budgetStore', {autoIncrement: true });
    }
};

// console logs error on request
request.onerror = function (e) {
    console.log(`Error code: ${e.target.errorCode}`);
};

function checkDatabase() {
    console.log('checking db');
    // opens transaction  on previously created db, 'budgetStore'
    let transaction = db.transaction(['budgetStore'], 'readwrite');
    // accesses db object
    const store = transaction.objectStore('budgetStore');
    // sets all records from db store to getAll variable
    const getAll = store.getAll();

    // runs if request successful
    getAll.onsuccess = function () {
        // bulk adds all store items once back online
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application.json',
                },
            })
            .then((response) => response.json())
            .then((res) => {
                // runs if response not empty
                if (res.length !== 0) {
                    // opens new transactoin to db with read/write ability
                    transaction = db.transaction(['budgetStore'], 'readwrite');
                    // assigns store to variable
                    const currentStore = transaction.objectStore('budgetStore');
                    // clears store on successful bulk add
                    currentStore.clear();
                    console.log('Store is cleared!');
                }
            });
        }
    };
}

request.onsuccess = function (e) {
    console.log('successful!');
    db = e.target.result;
    // if online, runs checkDatabase function to add items from db store
    if (navigator.onLine) {
        console.log('we are online!');
        checkDatabase();
    }
};

const saveRecord = (record) => {
    const transaction = db.transaction(['budgetStore'], 'readwrite');

    const store = transaction.objectStore('budgetStore');

    store.add(record);
};
// where the magic happens. checks for app coming back online, then runs function to add data from offline store!
window.addEventListener('online', checkDatabase);