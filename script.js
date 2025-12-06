const dataFiles = [
    {name: "Math", path: "data/math.csv"},
    {name: "Science", path: "data/science.csv"},
    {name: "History", path: "data/history.csv"}
];

let loadedData = {};        // { filename: { headers: [], rows: [] } }
let selectedFiles = [];
let rowMode = "sequential";
let currentRow = 0;
let currentCol = 0;
let allRows = [];
let selectedColumns = {};   // { filePath: [column1, column2, ...] }

window.addEventListener('DOMContentLoaded', () => {
    const fileOptions = document.getElementById('file-options');

    // Populate topic selection
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

    // Next to settings screen
    document.getElementById('next-to-settings').addEventListener('click', async () => {
        selectedFiles = Array.from(fileOptions.querySelectorAll('input:checked')).map(cb => cb.value);
        if(selectedFiles.length === 0) return alert("Select at least one file.");
        await loadSelectedFiles();
        showSettingsScreen();
    });

    // Start quiz
    document.getElementById('start-quiz').addEventListener('click', () => {
        rowMode = document.querySelector('input[name="rowMode"]:checked').value;

        // Gather selected columns per file
        selectedColumns = {};
        document.querySelectorAll('#column-settings input[type="checkbox"]').forEach(cb => {
            const file = cb.dataset.file;
            if(!selectedColumns[file]) selectedColumns[file] = [];
            if(cb.checked) selectedColumns[file].push(cb.value);
        });

        prepareQuizRows();
        showQuizScreen();
        startOnRandomSelectedColumn();
    });

    // Button navigation
    document.getElementById('prev-row').addEventListener('click', prevRow);
    document.getElementById('next-row').addEventListener('click', nextRow);
    document.getElementById('prev-col').addEventListener('click', prevCol);
    document.getElementById('next-col').addEventListener('click', nextCol);

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        switch(e.key) {
            case "ArrowLeft": prevCol(); break;
            case "ArrowRight": nextCol(); break;
            case "ArrowUp": prevRow(); break;
            case "ArrowDown": nextRow(); break;
        }
    });

    // Swipe support
    let startX = 0, startY = 0;
    const threshold = 50;
    const cellDisplayBox = document.getElementById('cell-display');

    cellDisplayBox.addEventListener('touchstart', e => {
        const touch = e.changedTouches[0];
        startX = touch.screenX;
        startY = touch.screenY;
    });

    cellDisplayBox.addEventListener('touchend', e => {
        const touch = e.changedTouches[0];
        const dx = touch.screenX - startX;
        const dy = touch.screenY - startY;

        if(Math.abs(dx) > Math.abs(dy)) {
            if(dx > threshold) prevCol();
            else if(dx < -threshold) nextCol();
        } else {
            if(dy > threshold) prevRow();
            else if(dy < -threshold) nextRow();
        }
    });
});

// Load selected CSV files
async function loadSelectedFiles() {
    for(const filePath of selectedFiles) {
        const response = await fetch(filePath);
        const text = await response.text();
        const rows = text.trim().split("\n").map(r => r.split(","));
        loadedData[filePath] = { headers: rows[0], rows: rows.slice(1) };
    }
}

// Show column settings
function showSettingsScreen() {
    document.getElementById('topic-screen').style.display = 'none';
    const screenSettings = document.getElementById('settings-screen');
    screenSettings.style.display = 'block';

    const columnSettings = document.getElementById('column-settings');
    columnSettings.innerHTML = "";

    selectedFiles.forEach(filePath => {
        const fileData = loadedData[filePath];
        const container = document.createElement('div');
        container.style.marginBottom = "10px";

        const title = document.createElement('strong');
        title.textContent = filePath.split('/').pop();
        container.appendChild(title);

        fileData.headers.forEach((header, idx) => {
            const cb = document.createElement('input');
            cb.type = "checkbox";
            cb.value = header;
            cb.checked = idx === 0; // default first column checked
            cb.dataset.file = filePath;

            const label = document.createElement('label');
            label.style.marginRight = "10px";
            label.textContent = header;
            label.prepend(cb);

            container.appendChild(document.createElement('br'));
            container.appendChild(label);
        });

        columnSettings.appendChild(container);
    });
}

// Prepare rows
function prepareQuizRows() {
    allRows = [];
    Object.entries(loadedData).forEach(([filePath, file]) => {
        file.rows.forEach(row => {
            allRows.push({ headers: file.headers, row: row, file: filePath });
        });
    });
    if(rowMode === "random") allRows = shuffleArray(allRows);
    currentRow = 0;
    currentCol = 0;
}

// Show quiz screen
function showQuizScreen() {
    document.getElementById('settings-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'flex';
}

// Start on random selected column
function startOnRandomSelectedColumn() {
    const currentData = allRows[currentRow];
    const filePath = currentData.file;
    const possibleColumns = selectedColumns[filePath] || currentData.headers;

    if(possibleColumns.length === 1) currentCol = currentData.headers.indexOf(possibleColumns[0]);
    else {
        const randomColName = possibleColumns[Math.floor(Math.random() * possibleColumns.length)];
        currentCol = currentData.headers.indexOf(randomColName);
    }

    displayCell();
}

// Display current cell
function displayCell() {
    const cellDisplay = document.getElementById('cell-display');
    const currentData = allRows[currentRow];
    cellDisplay.textContent = currentData.row[currentCol];
}

// Navigation functions
function prevRow() { currentRow = (currentRow - 1 + allRows.length) % allRows.length; startOnRandomSelectedColumn(); }
function nextRow() { currentRow = (currentRow + 1) % allRows.length; startOnRandomSelectedColumn(); }
function prevCol() { 
    const headers = allRows[currentRow].headers;
    currentCol = (currentCol - 1 + headers.length) % headers.length; 
    displayCell(); 
}
function nextCol() { 
    const headers = allRows[currentRow].headers;
    currentCol = (currentCol + 1) % headers.length; 
    displayCell(); 
}

// Shuffle helper
function shuffleArray(array) {
    for(let i = array.length-1; i>0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
