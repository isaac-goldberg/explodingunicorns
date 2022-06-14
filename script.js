/////////////////////////////////////////
// [BUG REMINDERS] //
// [1] Entries with the same name will get their points messed up when rendering the animation
// [2] Occasionally lags and an entry may suddenly flash across the screen for a splitsecond
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


// FUNCTIONS CALLED FROM INLINE JS
function resetLeaderboard() {
    deleteEntries();

    window.location.reload();
}

function submitEntryData() {
    if (isTransitioning) return;

    newEntry();
}

function deleteEntry() {
    let name = document.getElementById("delete-entry-name");
    let nameValue = name.value.trim();

    if (!nameValue || nameValue.length == 0) {
        new jBox("Notice", {
            content: "No input was detected for the name input box",
            color: "red",
        });
        return;
    }

    let entryFound = false;
    let entries = getEntries();
    entries = entries.filter((e) => {
        if (e.name.trim().toLowerCase() != nameValue.trim().toLowerCase()) {
            return true;
        } else {
            entryFound = true;
            return false;
        }
    });

    if (!entryFound) {
        new jBox("Notice", {
            content: "No entry found with that name",
            color: "yellow",
        });
        name.value = "";
        return;
    }

    let sortedEntries = sortEntries(entries);
    setEntries(sortedEntries);

    window.location.reload();
    return;
}

function postWebhook() {
    let archive = JSON.parse(window.localStorage.getItem("archive") || "[]");

    var smallArrays = [];
    var maxLen = 10;
    for (var i=0; i < archive.length; i += maxLen) {
        smallArrays.push(archive.slice(i, i + maxLen));
    }
    
    smallArrays.forEach(async (arr) => {
        let str = `\`\`\`css\n`;
        arr.forEach((e) => {
            str += `${e.name} ${e.points}${e.dead ? " [Dead]" : ""}\n`;
        });
        str += "```";

        await fetch("https://discord.com/api/webhooks/986061690732965918/XEuisjJGbqCbi9b3VeFsvuJliWDHRku1x0fT5ASUJGQTJJE8m_sQ6I-jIFsAl6p_auwd", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({
                "name": "Exploding Unicorns",
                "content": str,
            }),
        });
    });
}

// PAGE RENDERING FUNCTIONS
function newEntry() {
    // get the values of the input boxes and checkboxes, and reset the form
    let { name, points, dead } = getInputs();
    resetInputs();

    // check if all values were provided and then create the entry object
    if (!name || !points) return;
    var entry = { rank: null, name, points, dead };

    // save the entry to archive
    archiveEntry(entry);

    // push the new entry to the existing entries array
    let entries = getEntries();
    entries.push(entry);

    // sort the entries and give each one a rank
    let sortedEntries = sortEntries(entries);
    setEntries(sortedEntries);

    // get the updated entry which now has a rank, and render it onto the site
    let updatedEntry = sortedEntries.find(e => e.name === entry.name);
    if (!updatedEntry) {
        new jBox("Notice", {
            content: "Not enough points to make the leaderboard (entry was still saved to archive)",
            color: "yellow",
        });

        return false;
    }
    renderNewEntry(updatedEntry);
}

function archiveEntry(data) {
    let arr = JSON.parse(window.localStorage.getItem("archive") || "[]");
    let clone = { name: data.name, points: data.points, dead: data.dead };
    arr.push(clone);
    window.localStorage.setItem("archive", JSON.stringify(arr));
    return;
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
            currentEntryInner.style.transform = "translateX(340px)";

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

                // create tooltips for death indicators
                initDeadTooltip();
                
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

// HELPER FUNCTIONS
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
    if (!data.dead) {
        pPoints.innerText = data.points;
    } else {
        pPoints.innerHTML = `${data.points} ${createDeadIndicator()}`
    }

    inner.appendChild(pName);
    inner.appendChild(pPoints);
    
    return inner;
}

function createDeadIndicator() {
    return "<i class='fas fa-skull tooltip-dead'></i>";
}

function initDeadTooltip() {
    $(".tooltip-dead").jBox("Tooltip", {
        theme: "TooltipDark",
        content: "This player died but still accumulated enough points to make the leaderboard",
        position: {
            y: "bottom",
        },
    });
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
        });
    }

    if (pointsValue == 0) {
        new jBox("Notice", {
            content: "Need more than 0 points to make the leaderboard",
            color: "red",
        })
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

            if (!e.dead) {
                pointsElem.innerText = e.points;
            } else {
                pointsElem.innerHTML = `${e.points} ${createDeadIndicator()}`;
                initDeadTooltip();
            }
        });
    }
}

function initModals() {
    new jBox("Modal", {
        attach: "#form-modal-trigger",
        height: 505,
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

        <form id="delete-entry-form" class="delete-entry-form">
        <h4>Delete Entry</h4>
        <input type="text" placeholder="Full Name" id="delete-entry-name" autocomplete="off">
        <button id="entry-submit" type="submit">Delete</button>
        </form>

        <hr/>

        <button class="button warning" onclick="postWebhook()">Post archive to Discord
        <p style="font-size: 10px; margin: 0; font-style: italic;">Requires Internet connection</p>
        </button>
        <button class="button danger" onclick="resetLeaderboard()" data-confirm="Are you sure you want to reset all leaderboard entries?">
        Reset Leaderboard</button>

        <hr/>

        <p class="reminder" style="font-size: 12px">Admin note: don't enter the same person's name twice - delete their name first, then create a new entry for them.</p>

        <script>
        $("#entry-form").submit(function(e) { e.preventDefault(); submitEntryData() });
        new jBox("Confirm", {
            confirmButton: "Okay",
            cancelButton: "No, cancel"
        });

        $("#delete-entry-form").submit(function(e) { e.preventDefault(); deleteEntry() });
        </script>`
    });
}