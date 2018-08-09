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

        if (data.setup) {
            playingWhite = data.playingWhite;
            playingBlack = data.playingBlack;

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

            if (playingWhite && data.turn == "White's Turn")
                onHover(whiteTile, 'white', socket, addClick);
            else if (playingBlack && data.turn == "Black's Turn")
                onHover(blackTile, 'black', socket, addClick);

            $('.d-none').removeClass('d-none');

            $('#turnDisplay').text(data.turn);
        }

        if (data.new_move) {
            $('#emptyList').remove();
            var color = data.move[0],
                cell = data.move.substring(1);

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

        if (data.game_over) {
            $('#turnDisplay').text(data.winner);
        }
    }

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
