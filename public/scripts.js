const socket = io('http://localhost:3000', {

})


const boxes = document.querySelectorAll(".box");
const turn = document.getElementById("turn");
const restartBtn = document.getElementById("restartBtn");
const xScoreDisplay = document.getElementById("xScoreDisplay");
const oScoreDisplay = document.getElementById("oScoreDisplay");

let myRole = null //X/O, wird noch nicht definiert

socket.on('connect', () => {
    console.log('Verbunden mit Server als', socket.id);
});



//benachrichtigt, wenn das Spiel voll ist
socket.on('full', message => {
    alert(message)
})

socket.on('role', role => {
    // console.log(role)
    myRole = role
    turn.textContent = `Your role is ${myRole}`;
    setTimeout(() => turn.textContent = "X's turn", 2000);
})

// setTimeout(() => console.log(myRole),5000) //da socket.on('role') asynchron ist

let acceptBtn = null
let declineBtn = null

// entfernt den accept und decline button aus dem DOM
function removeRestartButtons(){
    if(acceptBtn){
        document.body.removeChild(acceptBtn);
        acceptBtn = null
    }
    if(declineBtn){
        document.body.removeChild(declineBtn)
        declineBtn = null
    }
    restartBtn.style.display = 'inline'
}


socket.on('restartRequest', () => {
    console.log('The other user wants to restart the game')
    turn.textContent = 'The other player wants to restart the game.'
    // erstellt die buttons nur, wenn sie noch nicht existieren
     if (!acceptBtn && !declineBtn) {
        acceptBtn = document.createElement('button');
        declineBtn = document.createElement('button');

        acceptBtn.textContent = 'accept';
        declineBtn.textContent = 'decline';
        acceptBtn.style.backgroundColor = 'lightgreen';
        declineBtn.style.backgroundColor = 'coral';
        acceptBtn.classList.add('restartBtn');
        declineBtn.classList.add('restartBtn');

        document.body.insertBefore(acceptBtn, restartBtn);
        document.body.insertBefore(declineBtn, restartBtn);
    }
    
    restartBtn.style.display = 'none'

    acceptBtn.addEventListener('click', () => {
        console.log('restart has been accepted')
        socket.emit('exRestart') //execute Restart
        removeRestartButtons()
    })
    declineBtn.addEventListener('click', () => {
        console.log('restart has been declined')
        socket.emit('notRestart')
        removeRestartButtons()
    })
})

socket.on('declRestart', (message) => {
    turn.textContent = message
})


// Die einzelnen Felder müssen nun nicht mehr einzeln abgespeichert werden


// Für jedes Feld wird nun ein Klick-Event eingefügt
boxes.forEach(box => {
    box.addEventListener('click', event => {
        const index = event.target.dataset.index; // gibt den data-index aus dem HTML-File aus
        socket.emit('played', index);
        //console.log(typeof(+index));
        // +index, da dataset.index einen String ausgibt und wir eine Zahl wollen.
        //  + wandelt den String in eine Zahl um
        clicked(+index); 
    })
})

restartBtn.addEventListener('click', () => {
    console.log('asked for restart')
    socket.emit('restart')
});

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