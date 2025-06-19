const express = require('express')
const app = express()
app.use(express.static('public')) //hier machen wir, dass die Files im public Ordner angezeigt werden, wenn wir den Server aufrufen
const expressServer = app.listen(3000)

const socketio = require('socket.io') 
const io = socketio(expressServer, {  // das ist der socket.io Server

});

const maxPlayers = 2;
let connectedPlayers = [];

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
        connectedPlayers = connectedPlayers.filter(id => id!==socket.id);
        console.log(`${socket.id} has disconnected from Server`);
    })

    socket.on('restart', () => {
        if(socket.id === connectedPlayers[0]){
            console.log(`${socket.id} requested reset`);
            socket.broadcast.emit('restartRequest', socket.id) //sendet nur an den anderen Client
        }
    })



    // Rollenverteilung
    // 1. Spieler = X und 2. Spieler = O
    if(connectedPlayers[0] === socket.id){
        socket.emit('role', 'X');
    }
    else{
        socket.emit('role', 'O');
    }
    

})