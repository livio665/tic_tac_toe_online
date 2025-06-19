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





io.on('connection', socket => { //wenn sich ein Client mit dem Server verbindet
    // lehnt die Verbindung ab, wenn schon 2 Spieler verbunden sind
    if(connectedPlayers.length >= maxPlayers){
        console.log(`${socket.id} tried to connect, but the game was full`)
        socket.emit('full', 'The game is full');
        socket.disconnect(true);
        return;
    }
    console.log(`${socket.id} has connected to the Server`) // die id des Clients
    connectedPlayers.push(socket.id)

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
        socket.broadcast.emit('restartRequest', socket.id) //sendet nur an den anderen Client
    })
    
    // kommt, wenn der zweite Client die restart Anfrage annimmt
    socket.on('exRestart', () => {
        console.log('Game gets restarted')
    })

    // kommt, wenn der zweite Client die restart Anfrage ablehnt
    socket.on('notRestart', () => {
        console.log('Game gets not restarted')
        socket.broadcast.emit('declRestart', 'The other user has declined the restart');
    })

    
    // Rollenverteilung
    if (roles.length > 0) {
        const roleIndex = Math.floor(Math.random() * roles.length);
        const assignedRole = roles[roleIndex];
        socket.assignedRole = assignedRole;
        socket.emit('role', assignedRole);

        // entferne vergebene Rolle aus Liste
        roles = roles.filter(role => role !== assignedRole);
    } else {
        // wenn keine Rollen frei sind, Verbindung abbrechen
        socket.emit('full', 'No roles left');
        socket.disconnect(true);
    }


})