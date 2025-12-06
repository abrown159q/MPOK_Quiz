const dataFiles = [
    {name: "Math", path: "data/math.csv"},
    {name: "Science", path: "data/science.csv"},
    {name: "History", path: "data/history.csv"}
];

let loadedData = {}; // { filename: { headers: [], rows: [] } }
let selectedFiles = [];
let rowMode = "sequential";
let selectedColumn = "";
let currentRow = 0;
let currentCol = 0;
let allRows = [];

window.addEventListener('DOMContentLoaded', () => {
    const fileOptions = document.getElementById('file-options');
    dataFiles.forEach(file => {
        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.value = file.path;
        checkbox.id = file.name;

        const label = document.createElement('label');
        label.htmlFor = file.name;
        label.textContent = file.name;

        const container = document.createElement('div');
        container.appendChild(checkbox);
        container.appendChild(label);

        fileOptions.appendChild(container);
    });

    document.getElementById('next-to-settings').addEventListener('click', async () => {
        selectedFiles = Array.from(fileOptions.querySelectorAll('input:checked')).map(cb => cb.value);
        if(selectedFiles.length === 0) {
            alert("Select at least one file.");
            return;
        }

        await loadSelectedFiles();
        showSettingsScreen();
    });

    document.getElementById('start-quiz').addEventListener('click', () => {
        rowMode = document.querySelector('input[name="rowMode"]:checked').value;
        selectedColumn = document.getElementById('column-select').value;
        prepareQuizRows();
        showQuizScreen();
        displayCell();
    });

    document.getElementById('prev-row').addEventListener('click', () => {
        currentRow = (currentRow - 1 + allRows.length) % allRows.length;
        displayCell();
    });
    document.getElementById('next-row').addEventListener('click', () => {
        currentRow = (currentRow + 1) % allRows.length;
        displayCell();
    });
    document.getElementById('prev-col').addEventListener('click', () => {
        const headers = allRows[0].headers;
        currentCol = (currentCol - 1 + headers.length) % headers.length;
        displayCell();
    });
    document.getElementById('next-col').addEventListener('click', () => {
        const headers = allRows[0].headers;
        currentCol = (currentCol + 1) % headers.length;
        displayCell();
    });
});

async function loadSelectedFiles() {
    for(const filePath of selectedFiles) {
        const response = await fetch(filePath);
        const text = await response.text();
        const rows = text.trim().split("\n").map(r => r.split(","));
        loadedData[filePath] = {
            headers: rows[0],
            rows: rows.slice(1)
        };
    }
}

function showSettingsScreen() {
    const screenTopic = document.getElementById('topic-screen');
    const screenSettings = document.getElementById('settings-screen');
    screenTopic.style.display = 'none';
    screenSettings.style.display = 'block';

    const columnSelect = document.getElementById('column-select');
    columnSelect.innerHTML = "";
    const allHeaders = new Set();
    Object.values(loadedData).forEach(file => file.headers.forEach(h => allHeaders.add(h)));
    allHeaders.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        columnSelect.appendChild(option);
    });
}

function prepareQuizRows() {
    allRows = [];
    Object.values(loadedData).forEach(file => {
        file.rows.forEach(row => {
            allRows.push({headers: file.headers, row: row});
        });
    });
    if(rowMode === "random") {
        allRows = shuffleArray(allRows);
    }
    currentRow = 0;
    currentCol = 0;
}

function showQuizScreen() {
    document.getElementById('settings-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
}

function displayCell() {
    const cellDisplay = document.getElementById('cell-display');
    const currentData = allRows[currentRow];
    const colIndex = currentData.headers.indexOf(selectedColumn);
    if(colIndex === -1) currentCol = 0; // fallback
    cellDisplay.textContent = currentData.row[currentCol];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
