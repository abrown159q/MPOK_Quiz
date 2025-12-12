let fileList = [];
let userDisplayNames = {};

let datasets = [];
let selectedFiles = [];
let selectedColumns = {};
let rowMode = "random";

document.addEventListener("DOMContentLoaded", async () => {
    await loadManifest();
    loadSavedDisplayNames();
    renderFileOptions();

    document.getElementById("next-to-settings")
        .addEventListener("click", showSettingsScreen);

    document.getElementById("start-quiz")
        .addEventListener("click", startQuiz);
});

async function loadManifest() {
    const res = await fetch("file-list.json");
    fileList = await res.json();
}

// Load stored custom display names
function loadSavedDisplayNames() {
    const stored = localStorage.getItem("displayNames");
    if (stored) userDisplayNames = JSON.parse(stored);
}

function saveDisplayNames() {
    localStorage.setItem("displayNames", JSON.stringify(userDisplayNames));
}

function renderFileOptions() {
    const container = document.getElementById("file-options");
    container.innerHTML = "";

    fileList.forEach(file => {
        const displayName = userDisplayNames[file.filename] || file.displayName;

        const row = document.createElement("div");
        row.className = "file-row";

        row.innerHTML = `
            <label>
                <input type="checkbox" value="${file.filename}">
                <strong>${displayName}</strong>
            </label>
            <input type="text" class="rename-box" data-file="${file.filename}" value="${displayName}">
        `;

        container.appendChild(row);
    });

    document.querySelectorAll(".rename-box").forEach(input => {
        input.addEventListener("change", () => {
            const fname = input.dataset.file;
            userDisplayNames[fname] = input.value;
            saveDisplayNames();
            renderFileOptions();
        });
    });
}

function showSettingsScreen() {
    selectedFiles = [...document.querySelectorAll("#file-options input[type=checkbox]:checked")]
                    .map(x => x.value);

    if (selectedFiles.length === 0) return;

    document.getElementById("topic-screen").style.display = "none";
    document.getElementById("settings-screen").style.display = "flex";

    renderColumnSelection();
}

function renderColumnSelection() {
    const container = document.getElementById("column-settings");
    container.innerHTML = "";

    selectedFiles.forEach(async file => {
        const data = await loadCSV("data/" + file);
        datasets.push({ file, data });

        const box = document.createElement("div");
        box.className = "column-box";

        const headers = Object.keys(data[0]);
        selectedColumns[file] = [headers[0]];

        box.innerHTML = `<h3>${userDisplayNames[file] || file}</h3>`;

        headers.forEach(col => {
            const id = `${file}-${col}`;
            const row = document.createElement("div");

            row.innerHTML = `
                <label>
                    <input type="checkbox" data-file="${file}" value="${col}" ${col === headers[0] ? "checked" : ""}>
                    ${col}
                </label>
            `;

            box.appendChild(row);
        });

        container.appendChild(box);
    });

    container.addEventListener("change", evt => {
        if (!evt.target.matches("input[type=checkbox]")) return;

        const file = evt.target.dataset.file;
        const col = evt.target.value;

        if (evt.target.checked) {
            if (!selectedColumns[file].includes(col))
                selectedColumns[file].push(col);
        } else {
            selectedColumns[file] = selectedColumns[file].filter(c => c !== col);
        }
    });
}

async function loadCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    const rows = text.split(/\r?\n/).map(r => r.split(","));
    const headers = rows[0];

    return rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i] || "");
        return obj;
    });
}

let currentDatasetIndex = 0;
let currentRowIndex = 0;
let currentColumnIndex = 0;

function startQuiz() {
    document.getElementById("settings-screen").style.display = "none";
    document.getElementById("quiz-screen").style.display = "flex";

    document.getElementById("prev-row").onclick = () => changeRow(-1);
    document.getElementById("next-row").onclick = () => changeRow(1);
    document.getElementById("prev-col").onclick = () => changeColumn(-1);
    document.getElementById("next-col").onclick = () => changeColumn(1);

    pickNewRandomRow();
    updateDisplay();
}

function pickNewRandomRow() {
    const idx = Math.floor(Math.random() * datasets.length);
    currentDatasetIndex = idx;

    const ds = datasets[idx];
    currentRowIndex = Math.floor(Math.random() * ds.data.length);

    const selectableCols = selectedColumns[ds.file];
    const col = selectableCols[Math.floor(Math.random() * selectableCols.length)];

    const headers = Object.keys(ds.data[0]);
    currentColumnIndex = headers.indexOf(col);
}

function updateDisplay() {
    const ds = datasets[currentDatasetIndex];
    const row = ds.data[currentRowIndex];
    const headers = Object.keys(row);
    const col = headers[currentColumnIndex];

    document.getElementById("cell-display").textContent = row[col];

    document.getElementById("quiz-title").textContent =
        userDisplayNames[ds.file] || ds.file;
}

function changeRow(delta) {
    const ds = datasets[currentDatasetIndex];
    const len = ds.data.length;

    currentRowIndex = (currentRowIndex + delta + len) % len;
    updateDisplay();
}

function changeColumn(delta) {
    const ds = datasets[currentDatasetIndex];
    const headers = Object.keys(ds.data[0]);

    currentColumnIndex =
        (currentColumnIndex + delta + headers.length) % headers.length;

    updateDisplay();
}
