const express = require('express')
const app = express()
app.use(express.static('public')) //hier machen wir, dass die Files im public Ordner angezeigt werden, wenn wir den Server aufrufen
const expressServer = app.listen(3000)

const socketio = require('socket.io') 
const io = socketio(expressServer, {  // das ist der socket.io Server

});

const maxPlayers = 2;
let connectedPlayers = [];

let roles = ['X', 'O']

let board = Array(9).fill('');

let startingPlayer = 'X';
let currentPlayer = startingPlayer;
let scoreX = 0;
let scoreO = 0;
let running = true;


// Funktion welche aufgerufen wird nach einem Sieg, Unentschieden oder nachdem beide Spieler neustarten wollen
function restart(startingPlayer){
    board = Array(9).fill('');
    running = true;
    io.emit('clearBoard')
    if(startingPlayer === 'X'){
        startingPlayer = 'O';
        currentPlayer = 'O';
        io.emit('nextTurn', currentPlayer)
    }
    else{
        startingPlayer = 'X';
        currentPlayer = 'X'; 
        io.emit('nextTurn', currentPlayer)
    }
}

// Funktion welche die Scoreanzeige aktualisiert
function updateScore(player){
    if(player === 'X'){
        scoreX += 1;
        io.emit('increaseScore', scoreX, player)
    }
    else{
        scoreO += 1;
        io.emit('increaseScore', scoreO, player)
    }
}

//wenn sich ein Client mit dem Server verbindet
io.on('connection', socket => {
    // Leert das Spielfeld, wenn sich ein Spieler verbindet
    board = Array(9).fill('')
    // Setzt die Siegesanzeige auf 0, wenn sich ein neuer Spieler verbindet
    io.emit('clearWins')
    // Informiert den anderen Spieler, dass ein neuer Spieler beigetreten ist
    setTimeout(() => socket.broadcast.emit('newPlayer', 'A new player has joined the game'))

    // lehnt die Verbindung ab, wenn schon 2 Spieler verbunden sind
    if(connectedPlayers.length >= maxPlayers){
        console.log(`${socket.id} tried to connect, but the game was full`)
        socket.emit('full', 'The game is full');
        socket.disconnect(true);
        return;
    }
    // Um zu überprüfen, ob die Verbindung zustande kommt
    console.log(`${socket.id} has connected to the Server`) // die id des Clients

    // fügt die id des Clients dem connectedPlayers Array hinzu
    connectedPlayers.push(socket.id)

    // Wenn eine Verbindung aufgelöst wird
    socket.on('disconnect', () => {
        connectedPlayers = connectedPlayers.filter(id => id !== socket.id);
        console.log(`${socket.id} has disconnected from Server`);

        // Rolle wieder freigeben
        if (socket.assignedRole) {
            roles.push(socket.assignedRole);
            console.log(`Free Role: ${socket.assignedRole}`);
        }
    })

    // kommt, wenn der restart Button bei einem Client gedrückt wird
    socket.on('restart', () => {
        console.log(`${socket.id} requested restart`); 
        socket.broadcast.emit('restartRequest') //sendet nur an den anderen Client
    })
    
    // kommt, wenn der zweite Client die restart Anfrage annimmt
    socket.on('exRestart', () => {
        console.log('Game gets restarted')
        restart(startingPlayer)
    })

    // kommt, wenn der zweite Client die restart Anfrage ablehnt
    socket.on('notRestart', () => {
        console.log('Game gets not restarted')
        socket.broadcast.emit('declRestart', 'The other user has declined the restart');
        setTimeout(() => io.emit('nextTurn', currentPlayer), 2000)
    })

    
    // Rollenverteilung
    if (roles.length > 0) {
        const roleIndex = Math.floor(Math.random() * roles.length);
        const assignedRole = roles[roleIndex];
        socket.assignedRole = assignedRole;
        socket.emit('role', assignedRole);
        setTimeout(() => {
            io.emit('nextTurn', currentPlayer)
        }, 3000)

        // entfernt die vergebene Rolle aus dem Array
        roles = roles.filter(role => role !== assignedRole);
    } else {
        // wenn keine Rollen frei sind - Verbindung abbrechen
        socket.emit('full', 'No roles left');
        socket.disconnect(true);
    }


    // Wenn gespielt wird, wird die clicked Funktion aufgerufen
    socket.on('played', (index) => {
        clicked(index)
    })


    // Funktion, welche aufgerufen wird, wenn gespielt wurde
    function clicked(index){
        if(running){ // verhindert, dass Felder nach einem Sieg angewählt werden können
            //überprüfen ob das Feld leer ist    
            if(board[index] !== ''){
                return; //tut nichts, wenn es schon belegt ist
            }
            // Überprüft, ob der Spielzug vom Spieler stammt, welcher am Zug ist
            if(socket.assignedRole !== currentPlayer){
                return; 
            }
            
            // Board beim Index des Feldes, auf welches geklickt wurde, wird auf den aktuellen Spieler gesetzt und an die Clients verschickt
            board[index] = currentPlayer;
            io.emit('clicked', board)

            // Gewinnüberprüfung
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
                running = false; // damit nach einem Sieg nicht weitergespielt werden kann
                io.emit('win', `${currentPlayer} wins! Game restarts in 3 seconds`)
                updateScore(currentPlayer);
                // startet das Spiel automatisch nach 3 Sekunden neu
                setTimeout(() => restart(startingPlayer), 3000)
            }
            //Überprüft, ob alle neun Felder besetzt sind und startet allenfalls das Spiel neu
            //indexOf gibt den Index des ersten leeren Feldes zurück
            //wenn kein leeres Feld vorhanden ist gibt es den Wert -1 zurück
            else if(board.indexOf('') === -1){ 
                io.emit('draw', 'Draw! Game restarts in 2 seconds!')
                setTimeout(() => restart(startingPlayer), 2000);
            }
            // wechselt den aktiven Spieler von X zu O und umgekehrt
            else{
                if(currentPlayer === 'X'){
                    currentPlayer = 'O';
                }
                else{
                    currentPlayer = 'X';
                }
                io.emit('nextTurn', currentPlayer)
            }
        }
    }
})