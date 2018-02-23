var beatCount = 16;
var noteRange = 16;
var currentColumn = 0;
var beatInterval = undefined;

var bpm = 200;
var colorDelay = 100;

var beatContainerId = 'beats';
var beatRowClassName = 'beat-row';
var beatElementClassName = 'beat-element';
var toggledBeatClassName = 'on';
var selectedBeatClassName = 'active';
var sliderId = 'bpmSlider';

var rootNote = 54;

var pentatonicMajor = [0, 2, 4, 7, 9];
var pentatonicMinor = [0, 3, 5, 7, 10];

var rootPentatonicMajor = pentatonicMajor;

var majorFifthPentatonicMajor = rootPentatonicMajor.map(function(e) {
    return e + 7 - 12;
});

var majorFourthPentatonicMajor = rootPentatonicMajor.map(function(e) {
    return e + 5;
});

var minorSixthPentatonicMinor = pentatonicMinor.map(function(e) {
    return e + 9 - 12;
});

var scaleProgressions = [rootPentatonicMajor, majorFifthPentatonicMajor, minorSixthPentatonicMinor, majorFourthPentatonicMajor];
var parity = 0;

var maxPlayableNotes = 4;

var currentInstrument = bass;

var beatContainer = document.getElementById(beatContainerId);
var slider = document.getElementById(sliderId);

var noteList = scaleProgressions[parity];
switchScales(noteList);

var audioOutput = true;

var midi = undefined;
var output = undefined;
var midiDuration = 100;

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

slider.onchange = function(e) {
    newBpm = parseInt(e.target.value);
    if (beatInterval === undefined) {
        bpm = newBpm;
    } else {
        setBpm(newBpm);
    }
    
}

// setBpm(bpm);

function togglePlaying() {
    if (beatInterval !== undefined) {
        clearInterval(beatInterval);
        beatInterval = undefined;
        return false;
    } else {
        setBpm(bpm);
        return true;
    }
}

var toggle = document.getElementById('toggle');

toggle.onclick = function() {
    updateScaleChord();
    var isPlaying = togglePlaying();

    toggle.innerHTML = isPlaying ? 'Stop' : 'Start';
}

var clear = document.getElementById('clear');

clear.onclick = clearCells

var random = document.getElementById('random');

random.onclick = randomCells


function playColumnNotes(columnNotes) {

    var activeNotes = columnNotes.filter(function(element) {
        return element.classList.contains(toggledBeatClassName);
    }).map(function(element) {
        return parseInt(element.getAttribute('note'));
    });

    activeNotes.forEach(function(note) {
        playNote(note);
    });

    var midiNotesToPlay = pickBestNotes(activeNotes, maxPlayableNotes);

    midiNotesToPlay.forEach(function(note) {
        sendNote(note);
    });
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
            updateScaleChord();
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
    noteList = generateNoteList(scale, noteRange);
    updateNotes();
}

function updateNotes() {
    var beatRows = document.getElementsByClassName(beatRowClassName);

    for (var i = 0; i < beatRows.length; i++) {
        var beatRow = beatRows[i];

        for (var j = 0; j < beatRow.children.length; j++) {
            beatRow.children[j].setAttribute('note', noteList[i]);
        }
    }

}

function playNote(midiNote) {
    currentInstrument.play({pitch: midiToFreq(midiNote)});
}

function sendNote(midiNote) {
    if (output === undefined) {
        return false;
    }
    
    output.send([0x90, midiNote, 100]);

    (function(midiNote) {
        setTimeout(function() {
            output.send([0x80, midiNote, 100]);
        }, midiDuration);
    })(midiNote);

    return true;

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
    var livingCount = 0;

    for (var i = 0; i < rows; i++) {
        tempGrid[i] = new Array(cols);
        for (var j = 0; j < rows; j++) {
            tempGrid[i][j] = isCellAliveInNextState(i, j);
            livingCount += tempGrid[i][j] ? 1 : 0;
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

function updateScaleChord() {
    var rows = noteRange;
    var cols = beatCount;
    var livingCount = 0;

    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < rows; j++) {
            var cell = getCell(i, j);
            livingCount += isActive(cell) ? 1 : 0;

        }
    }

    parity = livingCount % scaleProgressions.length;
    switchScales(scaleProgressions[parity]);
    console.log("Parity of", parity);
}

function exportRow(rowNum) {
    var row = document.getElementsByClassName(beatRowClassName)[rowNum];

    var binaryRepresentation = 0;

    for (var i = 0; i < row.children.length; i++) {
        binaryRepresentation *= 2;
        binaryRepresentation += (isActive(getCell(rowNum, i)) ? 1 : 0);

    }

    return binaryRepresentation.toString(16);
}

function exportPiece() {
    var beatRows = document.getElementsByClassName(beatRowClassName);
    var representationString = '';

    for (var i = 0; i < beatRows.length; i++) {
        representationString += exportRow(i) + ';';
    }

    return representationString;
}

function importRow(rowNum, representationString) {
    var row = document.getElementsByClassName(beatRowClassName)[rowNum];

    var binary = parseInt(representationString, 16);

    for (var i = row.children.length - 1; i >= 0; i--) {
        var value = binary % 2;
        binary = Math.floor(binary / 2);

        setActive(getCell(rowNum, i), value == 1);

    }
}

function importPiece(representationString) {
    var representationArray = representationString.split(';');

    for (var i = 0; i < representationArray.length; i++) {
        var val = representationArray[i];

        if (val == "") {
            continue;
        }

        importRow(i, val);
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


function onMIDISuccess( midiAccess ) {
    console.log( "MIDI ready!" );
    midi = midiAccess;
    output = midi.outputs.values().next().value;
}

function onMIDIFailure(msg) {
    console.log( "Failed to get MIDI access - " + msg );
}

function pickBestNotes(noteArray, noteCount) {
    // because shimon can only play 4 notes
    // this should work pretty well on a pentatonic scale, but more TLC will be needed if we want
    // it to work well on a diatonic or, god forbid, a chromatic scale

    if (noteArray.length <= noteCount) {
        return noteArray;
    }

    var map = new Array(12).fill([]);

    noteArray.forEach(function(note) {
        map[note % 12].push(note);
    });

    // cycle through count of notes, pick one of each as we go through, loop til we're out of notes or have `noteCount` notes
    // if length is even, pick first note, otherwise pick last note left in array
    map = map.sort(function(noteArrA, noteArrB) {
        return noteArrB.length - noteArrA.length;
    });

    var finalNotesToPlay = [];

    // measure whether we want the first or last note in the array of similar notes
    // we'll have this alternate, and hopefully we'll get a decent distribution of notes that
    // spans shimon's playable range
    var pickFromLeft = true;

    while (finalNotesToPlay.length < noteCount) {
        var noteIndex = finalNotesToPlay.length;

        var subNoteArray = map[noteIndex];

        var indexToSelectFrom = pickFromLeft ? 0 : (subNoteArray.length - 1);

        var noteToAdd = subNoteArray.splice(indexToSelectFrom, 1);
        finalNotesToPlay.push(noteToAdd);

        pickFromLeft = !pickFromLeft;
    }

    return finalNotesToPlay;

}

navigator.requestMIDIAccess().then( onMIDISuccess, onMIDIFailure );