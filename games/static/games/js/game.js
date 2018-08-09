$(function() {
    // create websocket path from current url
    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var ws_path = `${ws_scheme}://${window.location.host}${window.location.pathname}`;

    var socket = new ReconnectingWebSocket(ws_path);

    // create variables for game tiles and player color
    const whiteTile = document.createElement('div');
        whiteTile.className = 'tile-white';
    const blackTile = document.createElement('div');
        blackTile.className = 'tile-black';

    var playingWhite,
        playingBlack;

    // setup the initial board state
    $('#44, #55, #whiteScore').append(whiteTile.outerHTML);
    $('#45, #54, #blackScore').append(blackTile.outerHTML);


    socket.onmessage = function (message) {
        var data = JSON.parse(message.data);

        // setup event will be sent to client upon connection
        if (data.setup) {
            // determine which side the user is playing
            playingWhite = data.playingWhite;
            playingBlack = data.playingBlack;

            // go through the game's history and play out each move
            for (let i = 0; i < data.history.length; i++) {
                let color = data.history[i][0],
                    cell = data.history[i].substring(1);


                if (color == 'w') {
                    $(`#${cell}`).append(whiteTile.outerHTML);
                    flipTiles(cell, 'white');
                }
                else {
                    $(`#${cell}`).append(blackTile.outerHTML);
                    flipTiles(cell, 'black');
                }
            }

            // only add hover (and click) events if it is the player's turn
            if (playingWhite && data.turn == "White's Turn")
                onHover(whiteTile, 'white', socket, addClick);
            else if (playingBlack && data.turn == "Black's Turn")
                onHover(blackTile, 'black', socket, addClick);

            // wait until the board is up to date before revealing it
            $('.d-none').removeClass('d-none');

            $('#turnDisplay').text(data.turn);
        }

        // whenever a move is sent, update the board
        if (data.new_move) {
            // for new games, make sure "no moves yet" is removed from the history
            $('#emptyList').remove();
            var color = data.move[0],
                cell = data.move.substring(1);

            // flip tiles and add hover events as appropriate
            if (color == 'w') {
                $(`#${cell}`).append(whiteTile.outerHTML);
                flipTiles(cell, 'white');

                if (playingBlack && data.turn == "Black's Turn")
                    onHover(blackTile, 'black', socket, addClick);
            } else {
                $(`#${cell}`).append(blackTile.outerHTML);
                flipTiles(cell, 'black');

                if (playingWhite && data.turn == "White's Turn")
                    onHover(whiteTile, 'white', socket, addClick);
            }

            $('#turnDisplay').text(data.turn);
            $('#historyList').append($(`<li class=mx-3>${data.move}</li>`));
        }

        // display the proper message for ended games
        if (data.game_over) {
            $('#turnDisplay').text(data.winner);
        }
    }

    // for online games, making a valid move should only directly remove events
    // and send the move through the websocket
    // updating the board will happen after the move is sent back from the server
    function addClick (square, color) {
        var id = square.attr('id'),
            move = `${color[0]}${id}`;

        square.on('click', () => {
            square.addClass('table-success').removeClass('table-warning');
            $('.reversi-cell').off('mouseenter mouseleave click');
            socket.send(JSON.stringify({
                "command": 'move',
                "move": move
            }));
        });
    }
});
