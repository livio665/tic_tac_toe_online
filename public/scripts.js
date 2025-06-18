const boxes = document.querySelectorAll(".box");
const turn = document.getElementById("turn");
const resetBtn = document.getElementById("resetBtn");
const xScoreDisplay = document.getElementById("xScoreDisplay");
const oScoreDisplay = document.getElementById("oScoreDisplay");


let board = Array(9).fill('');

// Die einzelnen Felder müssen nun nicht mehr einzeln abgespeichert werden


let startingPlayer = 'X';
let currentPlayer = startingPlayer;
let scoreX = 0;
let scoreO = 0;
let running = true;


// Für jedes Feld wird nun ein Klick-Event eingefügt
boxes.forEach(box => {
    box.addEventListener('click', event => {
        const index = event.target.dataset.index;
        //console.log(typeof(+index));
        // +index, da dataset.index einen String ausgibt und wir eine Zahl wollen.
        //  + wandelt den String in eine Zahl um
        clicked(+index); 
    })
})

resetBtn.addEventListener('click', () => reset(startingPlayer));

function clicked(index){
    if(running){ // verhindert, dass Felder nach einem Sieg angewählt werden können
        //überprüfen ob das Feld leer ist    
        if(board[index] !== ''){
            return; //tut nichts, wenn es schon belegt ist
        }

        //Spielzug
        board[index] = currentPlayer;
        boxes[index].textContent = currentPlayer;

        // Gewinnüberprüfung
        // ist jetzt der selbe Code für beide Spieler und nicht mehr getrennt
        if( //vertikalen
            board[0] === currentPlayer && board[1] === currentPlayer && board[2] === currentPlayer ||
            board[3] === currentPlayer && board[4] === currentPlayer && board[5] === currentPlayer ||
            board[6] === currentPlayer && board[7] === currentPlayer && board[8] === currentPlayer ||
            //horizontalen
            board[0] === currentPlayer && board[3] === currentPlayer && board[6] === currentPlayer ||
            board[1] === currentPlayer && board[4] === currentPlayer && board[7] === currentPlayer ||
            board[2] === currentPlayer && board[5] === currentPlayer && board[8] === currentPlayer ||
            //diagonalen
            board[0] === currentPlayer && board[4] === currentPlayer && board[8] === currentPlayer ||
            board[2] === currentPlayer && board[4] === currentPlayer && board[6] === currentPlayer

        ){
            running = false;
            // Die Bilder durch den Buchstaben ersetzt, da das viel einfacher ist
            turn.textContent = currentPlayer + ' wins!'
            updateScore(currentPlayer);
        }
        //indexOf gibt den Index des ersten leeren Feldes zurück
        //wenn kein leeres Feld vorhanden ist gibt es den Wert -1 zurück
        else if(board.indexOf('') === -1){ 
            turn.textContent = 'Draw';
            setTimeout(() => reset(startingPlayer), 1500);
        }
        else{
            if(currentPlayer === 'X'){
                currentPlayer = 'O';
            }
            else{
                currentPlayer = 'X';
            }
            turn.textContent = currentPlayer + "'s turn";
        }
    }
}    

// Da die Gewinnerkennung jetzt für beide Spieler gilt, verwende ich hier eine separate Funktion
function updateScore(player){
    if(player === 'X'){
        scoreX += 1;
        xScoreDisplay.textContent = scoreX;
    }
    else{
        scoreO += 1;
        oScoreDisplay.textContent = scoreO;
    }
}

function reset(startingPlayer){
    board = Array(9).fill('');
    running = true;
    boxes.forEach(box => {
        box.textContent = '';
    })
    if(startingPlayer === 'X'){
        startingPlayer = 'O';
        currentPlayer = 'O';
        turn.textContent = "O's turn"
    }
    else{
        startingPlayer = 'X';
        currentPlayer = 'X';
        turn.textContent = "X's turn"
    }
}