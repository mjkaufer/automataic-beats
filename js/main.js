var beatCount = 16;
var noteRange = 16;
var currentColumn = 0;
var beatInterval = null;

var bpm = 200;
var colorDelay = 100;

var beatContainerId = 'beats';
var beatRowClassName = 'beat-row';
var beatElementClassName = 'beat-element';
var toggledBeatClassName = 'on';
var selectedBeatClassName = 'active';


var rootNote = 60;

var pentatonicMinorIntervals = [0, 3, 5, 7, 10];

var currentInstrument = bass;

var beatContainer = document.getElementById(beatContainerId);

var noteList = generateNoteList(pentatonicMinorIntervals, noteRange);

var audioOutput = true;

for (var i = 0; i < noteRange; i++) {

    var noteRow = document.createElement('div');
    noteRow.classList.add(beatRowClassName);

    for (var j = 0; j < beatCount; j++) {

        var beatBox = document.createElement('div');
        beatBox.setAttribute('note', noteList[i]);

        beatBox.onclick = function(event) {
            var beatElement = event.target;

            var note = beatElement.getAttribute('note');
            playNote(note);

            toggleActive(beatElement);
        }

        beatBox.classList.add(beatElementClassName);
        noteRow.appendChild(beatBox);
    }

    beatContainer.appendChild(noteRow)
}

// setBpm(bpm);

function togglePlaying() {
    if (beatInterval != null) {
        clearInterval(beatInterval);
        beatInterval = null;
        return false;
    } else {
        setBpm(bpm);
        return true;
    }
}

var toggle = document.getElementById('toggle');

toggle.onclick = function() {
    var isPlaying = togglePlaying();

    toggle.innerHTML = isPlaying ? 'Stop' : 'Start';
}

var clear = document.getElementById('clear');

clear.onclick = clearCells

var random = document.getElementById('random');

random.onclick = randomCells


function playColumnNotes(columnNotes) {
    columnNotes.filter(function(element) {
        return element.classList.contains(toggledBeatClassName);
    }).forEach(function(element) {
        playNote(element.getAttribute('note'));
    })
}

function setBpm(newBpm) {
    bpm = newBpm;

    clearInterval(beatInterval);

    beatInterval = setInterval(function() {
        var columnNotes = selectColumn(currentColumn);
        playColumnNotes(columnNotes);

        currentColumn++;
        currentColumn %= beatCount;

        if (currentColumn == 0) {
            updateCells();
        }
    }, 1 / bpm * 60 * 1000);
}

function selectColumn(colNum) {
    // does not include first black column; a colNum of 0 selects the first targettable column

    var column = [];
    var beatRows = document.getElementsByClassName(beatRowClassName);

    for (var i = 0; i < beatRows.length; i++) {
        var beatRow = beatRows[i];

        for (var j = 0; j < beatRow.children.length; j++) {
            var beatElement = beatRow.children[j];

            if (j == colNum) {
                beatElement.classList.add(selectedBeatClassName);
                column.push(beatElement);
            } else {
                beatElement.classList.remove(selectedBeatClassName);
            }
            
        }
    }

    return column;

}

function switchScales(scale) {
    var newNoteList = generateNoteList(scale, noteRange);
    updateNotes(newNoteList);
}

function updateNotes(newNoteList) {

    var beatRows = document.getElementsByClassName(beatRowClassName);

    for (var i = 0; i < beatRows.length; i++) {
        var beatRow = beatRows[i];

        for (var j = 0; j < beatRow.children.length; j++) {
            beatRow.children[j].setAttribute('note', noteList[i]);
        }
    }

    noteList = newNoteList;

}

function playNote(midiNote) {
    if (audioOutput) {
        currentInstrument.play({pitch: midiToFreq(midiNote)});    
    }
}

function midiToFreq(midi) {
    // midi of 69 = 440
    return 440 * Math.pow(2,(midi-69) / 12);
}


function flashActive(element) {
    element.classList.add(toggledBeatClassName);

    setTimeout(function() {
        element.classList.remove(toggledBeatClassName);
    }, colorDelay);
}

function getCell(i, j) {
    var beatRows = document.getElementsByClassName(beatRowClassName);
    return beatRows[i].children[j];
}

function isCellAliveInNextState(i, j) {

    var beatRows = document.getElementsByClassName(beatRowClassName);
    var liveCount = 0;

    for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
            if (dr == dc && dr == 0) {
                continue;
            }

            var r = (i + dr + noteRange) % noteRange;
            var c = (j + dc + beatCount) % beatCount;

            if (isActive(getCell(r, c))) {
                liveCount++;
            }
        }
    }

    var currentCell = getCell(i, j);

    if (isActive(currentCell)) {
        return liveCount == 2 || liveCount == 3;
    } else {
        return liveCount == 3;
    }
}

function updateCells() {
    var rows = noteRange;
    var cols = beatCount;
    
    var tempGrid = new Array(rows);

    for (var i = 0; i < rows; i++) {
        tempGrid[i] = new Array(cols);
        for (var j = 0; j < rows; j++) {
            tempGrid[i][j] = isCellAliveInNextState(i, j);
        }
    }

    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < rows; j++) {
            var cell = getCell(i, j);
            var state = tempGrid[i][j];
            setActive(cell, state);

        }
    }

}

function clearCells() {
    var rows = noteRange;
    var cols = beatCount;
    
    var tempGrid = new Array(rows);

    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < rows; j++) {
            var cell = getCell(i, j);
            setActive(cell, false);
        }
    }
}

function randomCells() {
    var rows = noteRange;
    var cols = beatCount;
    
    var tempGrid = new Array(rows);

    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < rows; j++) {
            var cell = getCell(i, j);
            setActive(cell, Math.random() > 0.5);
        }
    }
}

function isActive(element) {
    return element.classList.contains(toggledBeatClassName);
}

function toggleActive(element) {
    if (element.classList.contains(toggledBeatClassName)) {
        removeActive(element);
    } else {
        addActive(element);
    }
}

function setActive(element, active) {
    if (active) {
        addActive(element);
    } else {
        removeActive(element);
    }
    
}

function addActive(element) {
    element.classList.add(toggledBeatClassName);
}

function removeActive(element) {
    element.classList.remove(toggledBeatClassName);
}

function generateNoteList(scale, noteCount) {

    var noteList = [];

    for (var i = 0; i < noteCount; i++) {

        var octave = Math.floor(i / scale.length);

        var note = scale[i % scale.length] + 12 * octave + rootNote;

        noteList.push(note);
    }

    return noteList;
}