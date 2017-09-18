const express = require('express'),
    path = require('path'),
    WebSocket = require('ws'),
    url = require('url'),
    fs = require('fs');

// Initiate express object
const app = new express(),
    http = require('http').createServer(app),
    socketIO = require('socket.io')(http);

// Serve static files from public directory
app.use(express.static('public'));

// Handle Get at root
app.get('/', (request, response) => {
    response.send('this is socket server');
});

var players = [],
    games = {};

socketIO.on('connection', function(socket) {

    // Handle begin event from clients
    socket.on('begin', function(data) {
        console.log(socket.id);
        var game = JSON.parse(data);
        console.log('%s started playing', game.player.name);
        players.push(game.player);
        if (players.length < 2) {
            socket.emit('wait', JSON.stringify({
                message: 'Waiting for some other player to join...'
            }));
        } else if (players.length == 2) {
            console.log('players are two. start game')
            var gid = guidGenerator();
            game.gid = gid;
            games[gid] = {
                'players': [],
                'game': {}
            };
            games[gid]['players'] = players.slice();
            games[gid]['game'] = game;
            players = [];
            var beginner = (Math.random() > 0.5) ? games[gid].players[1].id : games[gid].players[0].id;
            console.log('beginner - %s', beginner);
            socket.to(beginner).emit('begin', JSON.stringify(games[gid]));
            console.log('Begin emitted for beginner');
        }
    });

    socket.on('move', function(data) {
        console.log('Move played');
        var game = JSON.parse(data);
        gid = game.gid;
        games[gid]['game'] = game;
        var nextPlayer = (games[gid]['players'][0].id == game.player.id) ? games[gid].players[1] : games[gid].players[0];
        console.log('lastPlayer' + game.player.id)
        console.log('nextPlayer' + nextPlayer.id);
        games[gid]['game']['player'] = nextPlayer;
        socket.to(nextPlayer.id).emit('move', JSON.stringify(games[gid]));
    });
});


// Start server on port 3001
http.listen(3002, () => {
    console.log('socket server started at port: 3002');
});

function guidGenerator() {
    var S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return S4() + "-" + S4();
}
