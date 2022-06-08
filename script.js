/////////////////////////////////////////
// [REMINDERS FOR BUGS TO FIX LATER] //
// 1. if the user puts a float in the "points" input box it will throw an error when parsing to JSON
/////////////////////////////////////////



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

    // the submit button element
    let submitBtn = document.getElementById("entry-submit");
    submitBtn.addEventListener("click", () => newEntry());

    // when hitting enter while in the "points" input
    let nameInput = document.getElementById("entry-name");
    let pointsInput = document.getElementById("entry-points");
    pointsInput.addEventListener("keydown", function (e) {
        if (e.code === "Enter" && nameInput.value.trim() != "") {
            newEntry();
        }
    });
});


// HELPER FUNCTIONS
function newEntry() {
    let { name, points } = getInputs();
    var entry = { rank: null, name, points };

    // push the new entry to the existing entries array
    let entries = getEntries();
    entries.push(entry);

    // sort the entries and give each one a rank
    let sortedEntries = sortEntries(entries);
    setEntries(sortedEntries);

    // get the updated entry which now has a rank, and render it onto the site
    let updatedEntry = sortedEntries.find(e => e.name === entry.name);
    renderNewEntry(updatedEntry);
}

function renderNewEntry(data) {
    // var div = document.createElement("div");
    // div.classList.add("entry");
    // div.id = `entry-${data.rank}`;

    // div.style.transform = "transformY(900px)";

    // let bottomEntry = document.getElementById("entry-7");
    // bottomEntry.
}

function getEntries() {
    try {
        // get entries from LocalStorage
        let entries = JSON.parse(window.localStorage.getItem("entries"));

        // sort entries by points in case the users corrupted just the ranks stored in LocalStorage
        let sorted = sortEntries(entries);

        // set sorted entries into LocalStorage
        setEntries(sorted);
        return sorted;
    } catch (err) {
        // darn users must have been screwing around with LocalStorage and corrupted the JSON string
        console.log(err);
        window.localStorage.setItem("entries", "");
        return [];
    }
}

function setEntries(obj) {
    window.localStorage.setItem("entries", JSON.stringify(obj));
    return true;
}

function getInputs() {
    let name = document.getElementById("entry-name");
    let points = document.getElementById("entry-points");
    return {name: name.value.trim(), points: JSON.parse(points.value.trim()) };
}

function sortEntries(obj) {
    var compare = (a, b) => {
        if (a.points < b.points) {
            return 1;
        }
        if (a.points > b.points) {
            return -1;
        }
        return 0;
    }

    var sorted = obj.sort(compare);
    i = 1;
    sorted.forEach((e) => {
        e.rank = i;
        i++;
    });
    return sorted;
}

// ONE-TIME HELPER FUNCTIONS
function initEntries() {
    // entries that have been previously set into LocalStorage (will be an array)
    let entries = getEntries();

    if (entries) {
        entries.forEach((e) => {
            let nameElem = document.querySelector(`#entry-${e.rank} p.user`);
            let pointsElem = document.querySelector(`#entry-${e.rank} p.points`)

            nameElem.innerText = e.name;

            pointsElem.innerText = e.points;
        });
    }
}