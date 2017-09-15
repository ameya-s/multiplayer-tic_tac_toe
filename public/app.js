function guidGenerator() {
    var S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return S4();
}

function Matrix() {
    this.gid = null;
    this.started = 0;
    this.player = {};
    this.state = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    this.winner = "";
    this.finished = 0;
}

Matrix.prototype.updateState = function() {
    var self = this;
    $('.matrix-row').each(function(i, row) {
        var cells = $(row).find('.matrix-cell');
        cells.each(function(j, cell) {
            cellState = $(cell).attr('data-marker');
            self.state[i][j] = parseInt(cellState);
        });
    });
};

Matrix.prototype.checkFinished = function() {
    var self = this;
    if (self.state.toString().indexOf("0") > -1) {
        self.finished = false;
    } else {
        self.finished = true;
    }
};

Matrix.prototype.result = function() {
    var self = this;
    // Check row sums
    var rowSums = [0, 0, 0],
        colSums = [0, 0, 0],
        diSums = [0, 0];
    for (var i = 0; i < self.state.length; i++) {
        for (var j = 0; j < self.state[i].length; j++) {
            cellVal = self.state[i][j];
            rowSums[i] += cellVal;
            colSums[j] += cellVal;
            if (i === j) {
                diSums[0] += cellVal;
            }
            if (i === (self.state[i].length - j - 1)) {
                diSums[1] += cellVal;
            }
        }
    }
    if ((rowSums.indexOf(3) > -1 || colSums.indexOf(3) > -1 || diSums.indexOf(3) > -1) &&
        (rowSums.indexOf(-3) === -1 || colSums.indexOf(-3) === -1 || diSums.indexOf(-3) === -1)) {
        self.winner = "Player 1";
        self.finished = true;
    } else if ((rowSums.indexOf(-3) > -1 || colSums.indexOf(-3) > -1 || diSums.indexOf(-3) > -1) &&
        (rowSums.indexOf(3) === -1 || colSums.indexOf(3) === -1 || diSums.indexOf(3) === -1)) {
        self.winner = "Player 2";
        self.finished = true;
    }
};

$('document').ready(function() {
    var player = {};
    var game = new Matrix();
    var count = 0;
    var circle = '<i class="fa fa-circle-o" aria-hidden="true"></i>';
    var cross = '<i class="fa fa-times" aria-hidden="true"></i>';

    // Create a websocket
    var gameSocket = new WebSocket("ws://localhost:3002");

    // Handle user info submit
    $(document).on('click', 'button#submit', function(e) {
        if (game.player.id != 'undefined') {
            game.player.id = guidGenerator();
            game.player.name = $('input#player-name').val();
        }
        $('.player-info').hide();
        $('button#new').show();

        // Send status of the game across scocket
        gameSocket.send(JSON.stringify(game));

    });

    gameSocket.onmessage = function(msgEvent) {
        var data = JSON.parse(msgEvent.data);
        if (data.gid == undefined) {
            $('.message').text(data.message);
        } else if (data.begin != undefined) {
            (data.begin == game.player.id) ? $('#matrix').removeClass('no-start'): null;
            game.gid = data.gid;
            $('.message').text('You can start playing now');
        } else {
            game = data.game;
            $('#matrix').removeClass('no-start');
        }
    }

    //New game
    $(document).on('click', 'button#new', function(e) {
        var endGamePrompt = confirm('Do you really want to leave this game?');
        if (endGamePrompt) {
            player = {};
            $(this).hide();
            $('.player-info').show();
            $('.matrix-cell').attr('data-marker', 0).html('');
        }
    });



    $('.matrix-cell[data-marker="0"]').click(function(e) {
        if (count % 2 === 0) {
            $(this).attr('data-marker', '1');
            $(this).html(circle);
        } else {
            $(this).attr('data-marker', '-1');
            $(this).html(cross);
        }
        game.updateState();
        game.checkFinished();
        game.result();
        if (game.finished) {
            if (game.winner.length > 0) {
                $('label#winner').html(game.winner + " has won the game");
            } else {
                $('label#winner').html("It's draw");
            }
        }

        // Send status of the game across scocket
        game.lastPlayedBy = player.id;
        gameSocket.send(JSON.stringify(game));
        $('#matrix').addClass('pause');
        count++;
    });

});
