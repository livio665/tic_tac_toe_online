// So verbindet sich der Client mit dem Server
const socket = io('http://localhost:3000', {

})

const boxes = document.querySelectorAll(".box");
const turn = document.getElementById("turn");
const restartBtn = document.getElementById("restartBtn");
const xScoreDisplay = document.getElementById("xScoreDisplay");
const oScoreDisplay = document.getElementById("oScoreDisplay");

let myRole = null //X/O, wird noch nicht definiert

// Wird ausgefüht, nachdem der Client sich mit dem Server verbunden hat
socket.on('connect', () => {
    console.log('Connected to server as', socket.id);
});


socket.on('clearWins', () => {
    xScoreDisplay.textContent = '0'
    oScoreDisplay.textContent = '0'
})

socket.on('newPlayer', (message) => {
    turn.textContent = message
})

//benachrichtigt, wenn das Spiel voll ist
socket.on('full', message => {
    alert(message)
})

// Nach der Rollenzuteilung vom Server
socket.on('role', role => {
    // console.log(role)
    myRole = role
    turn.textContent = `Your role is ${myRole}`;
})

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

// Nach einem Sieg, Unentschieden oder restart wenn das Feld geleert wird
socket.on('clearBoard', () => {
    boxes.forEach(box => {
        box.textContent = '';
    })
})


// Wenn ein Spieler restart drückt, dann wird der andere um Zustimmung gebeten mit diesem Code
socket.on('restartRequest', () => {
    tempText = turn.textContent // ich setze tempText auf den textContent, damit ich diesen nach dem Code wieder einfügen kann
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
        turn.textContent = tempText;
    })
})

// Wenn die restart Anfrage des Clients abgelehnt wurde
socket.on('declRestart', (message) => {
    turn.textContent = message
})

// Wenn einer der beiden Spieler seinen Zug gemacht hat
socket.on('clicked', (board) => {
    // console.log(board); //funktioniert
    for(let i=0; i<=8; i++){
        boxes[i].textContent = board[i]
    }
})

// Signalisieren, dass ein Spieler gewonnen hat
socket.on('win', (winMessage) => {
    turn.textContent = winMessage;
})

// Zum Anpassen der Scoreanzeige
socket.on('increaseScore', (score, player) => {
    if(player === 'X'){
        xScoreDisplay.textContent = score
    }
    else{
        oScoreDisplay.textContent = score
    }
})

// Wenn das Spiel unentschieden endet
socket.on('draw', (message) => {
    turn.textContent = message
})

// Wenn ein Spieler gespielt hat und jetzt der andere dran ist
socket.on('nextTurn', (nextPlayer) => {
    if(nextPlayer === myRole){
        turn.textContent = 'Your turn'
    }
    else{
        turn.textContent = "Enemie's turn"
    }
})

// Klick-Event für den restart Button
restartBtn.addEventListener('click', () => {
    console.log('asked for restart')
    socket.emit('restart')
});

// Klick-Event für jedes Feld
boxes.forEach(box => {
    box.addEventListener('click', event => {
        const index = event.target.dataset.index; // gibt den data-index aus dem HTML-File aus
        socket.emit('played', +index);
    })
})