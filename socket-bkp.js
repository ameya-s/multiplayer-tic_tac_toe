const express = require('express'),
    path = require('path'),
    WebSocket = require('ws'),
    http = require('http'),
    url = require('url'),
    fs = require('fs');

// Initiate express object
const app = new express();

// Serve static files from public directory
app.use(express.static('public'));

// Handle Get at root
app.get('/', (request, response) => {
    response.send('this is socket server');
});

// Define http server for express app, use this server to create new intance of WebSocket
const server = http.createServer(app);
const socket = new WebSocket.Server({
    server,
    clientTracking: true
});

var players = [],
    games = {};

socket.on('connection', function connection(ws, request) {
    const location = url.parse(request.url, true);
    ws.on('message', function incomming(data) {
        fs.writeFile("temp.json", socket.clients.contents, 'utf8', function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("The file was saved!");
            }
        });
        console.log(data);
        var game = JSON.parse(data);
        if (!game.started) {
            console.log('%s started playing', game.player.name);
            players.push(game.player);

            if (players.length < 2) {
                ws.send(JSON.stringify({
                    message: 'Waiting for some other player to join...'
                }));
            } else if (players.length == 2) {
                var gid = guidGenerator();
                games[gid] = {};
                games[gid]['players'] = players.slice();
                games.game = game;
                players = [];
                games[gid].whoStarts = (Math.random() > 0.5) ? games[gid].players[1] : games[gid].players[1]
                ws.send(JSON.stringify(games[gid]));
            }
        } else if (game.started && !game.finished) {
            games[game.gid].game = game;
            ws.send(JSON.stringify(game));
        }
    });
});

// Start server on port 3001
server.listen(3002, () => {
    console.log('socket server started at port: 3002');
});

function guidGenerator() {
    var S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return S4() + "-" + S4();
}
