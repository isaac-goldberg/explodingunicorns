/////////////////////////////////////////
// [BUG REMINDERS] //
// [1] Entries with the same name will get their points messed up when rendering the animation
/////////////////////////////////////////

// constants
const maxEntries = 7;
const entryTransition = 750;
var isTransitioning = false;

// function that determines when site has finished loading because some site assets take longer to load will throw an error if accessed
function ready (callback) {
    // in case the document is already rendered
    if (document.readyState != "loading") callback();
    // modern browsers
    else document.addEventListener("DOMContentLoaded", callback);
}

// calls ready function immediately, which in turn calls this callback
ready(function(){
    // this function gets any previous entry data and sets it into their appropriate elements
    initEntries();

    // this function initializes the jBox library modals
    initModals();
});


// functions called from inline JavaScript in the HTML
function resetLeaderboard() {
    deleteEntries();

    window.location.reload();
}

function submitEntryData() {
    if (isTransitioning) return;

    newEntry();
}

// HELPER FUNCTIONS
function newEntry() {
    let { name, points, dead } = getInputs();
    if (!name || !points) return;

    var entry = { rank: null, name, points, dead };
    resetInputs();

    // push the new entry to the existing entries array
    let entries = getEntries();
    entries.push(entry);

    // sort the entries and give each one a rank
    let sortedEntries = sortEntries(entries);
    setEntries(sortedEntries);

    // get the updated entry which now has a rank, and render it onto the site
    let updatedEntry = sortedEntries.find(e => e.name === entry.name);
    if (!updatedEntry) return false;
    renderNewEntry(updatedEntry);
}

function renderNewEntry(data) {
    // this function uses timeout, so it will take a minimum of 2 seconds before being able to render another entry
    isTransitioning = true;

    let newInner = createEntry(data);
    newInner.style.transition = "0 none !important";

    let downInners = [];
    for (var i = 1; i <= maxEntries; i++) {
        let currentEntryInner = document.querySelector(`#entry-${i} .inner`);

        // if entry we are iterating on is less than the entry we are about to add
        if (i < data.rank) {
            // move entry to the right
            currentEntryInner.classList.add("horizontalTransform");
            currentEntryInner.style.transform = "translateX(360px)";

            // after other elements have transitioned, move back into place
            setTimeout(function () {
                currentEntryInner.style.transform = "translateX(0)";

                setTimeout(function () {
                    currentEntryInner.classList.remove("horizontalTransform");
                }, entryTransition);
            }, entryTransition + entryTransition);
        
        // if entry we are iterating over is equal to the highest entry id AKA the last entry
        } else if (i == maxEntries) {
            // move entry downwards out of sight
            currentEntryInner.style.transform = "translateY(1000px)";

            // after finished transition, remove element and add new entry as soon as possible to prevent sudden movement of the leaderboard
            setTimeout(function() {
                currentEntryInner.remove();

                let container = document.getElementById(`entry-${data.rank}`);
                container.appendChild(newInner);
                newInner.style.transform = "translateY(-750px)";
                newInner.style.transition = `${entryTransition / 1000}s ease !important;`;
                setTimeout(function () {
                    newInner.style.transform = "translateY(0)";
                    isTransitioning = false;
                }, 50);
            }, entryTransition);
        
        // if entry we are iterating over is greater than or equal to the entry we are about to add
        } else if (i >= data.rank && i !== maxEntries) {
            // move inner element approximately to the next lowest entry container
            currentEntryInner.style.transform = "translateY(82.5px)";
            downInners.push({ id: i + 1, elem: currentEntryInner });

            // move each of these inners into the next lowest div while showing the least amount of movement possible
            setTimeout(function() {
                downInners.forEach((e) => {
                    let previousTransition = e.elem.style.transition;
                    e.elem.style.transition = "0 !important";

                    let nextEntryContainer = document.getElementById(`entry-${e.id}`);
                    nextEntryContainer.appendChild(e.elem);

                    e.elem.style.transform = "translateY(0)";
                    e.elem.style.transition = previousTransition;
                });
            }, entryTransition);
        }
    }
}

function getEntries() {
    try {
        // get entries from LocalStorage
        let entries = JSON.parse(window.localStorage.getItem("entries")) || [];

        // sort entries by points just in case
        let sorted = sortEntries(entries);

        // set sorted entries into LocalStorage
        setEntries(sorted);
        return sorted;
    } catch (err) {
        // darn users must have been screwing around with LocalStorage and corrupted the JSON string
        console.log(err);
        window.localStorage.setItem("entries", JSON.stringify([]));
        return [];
    }
}

function setEntries(obj) {
    window.localStorage.setItem("entries", JSON.stringify(obj));
    return true;
}

function deleteEntries() {
    window.localStorage.setItem("entries", JSON.stringify([]));
    return true;
}

function createEntry(data) {
    let inner = document.createElement("div");
    inner.classList.add("inner");

    let pName = document.createElement("p");
    pName.classList.add("name");
    pName.innerText = data.name;

    let pPoints = document.createElement("p");
    pPoints.classList.add("points");
    pPoints.innerText = data.points;

    inner.appendChild(pName);
    inner.appendChild(pPoints);
    
    return inner;
}

function createDeadIndicator() {
    return "<"
}

function getInputs() {
    let name = document.getElementById("entry-name");
    let points = document.getElementById("entry-points");
    let dead = document.getElementById("entry-isDead").checked;
    let nameValue = name.value.trim();

    if (nameValue.length == 0 || points.value.length == 0) {
        new jBox("Notice", {
            content: "No input was detected for the name and/or points input boxes",
            color: "red",
            autoClose: 3000,
        });
        return { name: null, points: null, dead };
    }

    let pointsValue;
    try {
        pointsValue = JSON.parse(points.value.trim());
    } catch {
        new jBox("Notice", {
            content: "Could not parse points value",
            color: "red",
            autoClose: 3000,
        });
    }

    return { name: nameValue, points: pointsValue, dead };
}

function resetInputs() {
    let name = document.getElementById("entry-name");
    let points = document.getElementById("entry-points");
    name.value = ""; name.blur();
    points.value = ""; points.blur();

    document.getElementById("entry-isDead").checked = false;
    return true;
}

function sortEntries(obj) {
    var compare = (a, b) => {
        let pA = a.points;
        let pB = b.points;
        if (pA < pB) {
            return 1;
        }
        if (pA > pB) {
            return -1;
        }
        return 0;
    }

    var sorted = obj.sort(compare);
    var newSorted = [];
    i = 1;
    sorted.forEach((e) => {
        if (i > 7) return;
        e.rank = i;
        newSorted.push(e);

        i++;
    });
    return newSorted;
}

// ONE-TIME HELPER FUNCTIONS
function initEntries() {
    // entries that have been previously set into LocalStorage (will be an array)
    let entries = getEntries();

    if (entries) {
        entries.forEach((e) => {
            let nameElem = document.querySelector(`#entry-${e.rank} .inner p.name`);
            let pointsElem = document.querySelector(`#entry-${e.rank} .inner p.points`);

            nameElem.innerText = e.name;

            pointsElem.innerText = e.points;
        });
    }
}

function initModals() {
    new jBox("Modal", {
        attach: "#form-modal-trigger",
        height: 260,
        overlay: false,
        title: "Admin Menu",
        draggable: "title",
        content: `<form id="entry-form" class="entry-form">
        <h4>Create New Entry</h4>
        <input type="text" placeholder="Full Name" id="entry-name" autocomplete="off">
        <input type="text" placeholder="Points" id="entry-points" autocomplete="off">
        <button id="entry-submit" type="submit">Submit</button>
        <input style="margin-top: 10px" type="checkbox" id="entry-isDead">
        <label for="entry-isDead">Was this player dead?</label>
        </form>

        <hr/>
        <h4>Danger Zone</h4>
        <button class="button danger" onclick="resetLeaderboard()" data-confirm="Are you sure you want to reset all leaderboard entries?">
        Reset Leaderboard</button>
        <script>
        $("#entry-form").submit(function(e) { e.preventDefault(); submitEntryData() });
        new jBox("Confirm", {
            confirmButton: "Okay",
            cancelButton: "No, cancel"
        });
        </script>`
    });
}