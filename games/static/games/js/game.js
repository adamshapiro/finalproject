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

    var playerPosition;

    // setup the initial board state
    $('#44, #55, #whiteScore').append(whiteTile.outerHTML);
    $('#45, #54, #blackScore').append(blackTile.outerHTML);


    socket.onmessage = function (message) {
        var data = JSON.parse(message.data);

        if (data.setup) {
            playerPosition = data.position;

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

            if (playerPosition == 'white' && data.turn == 'white')
                onHover(whiteTile, 'white', socket);
            else if (playerPosition == 'black' && data.turn == 'black')
                onHover(blackTile, 'black', socket);
        }

        if (data.new_move) {
            var color = data.move[0],
                cell = data.move.substring(1);

            if (color == 'w') {
                $(`#${cell}`).append(whiteTile.outerHTML);
                flipTiles(cell, 'white');

                if (playerPosition == 'black' && data.turn == 'black')
                    onHover(blackTile, 'black', socket);
            } else {
                $(`#${cell}`).append(blackTile.outerHTML);
                flipTiles(cell, 'black');

                if (playerPosition == 'white' && data.turn == 'white')
                    onHover(whiteTile, 'white', socket);
            }

            $('#historyList').append($(`<li class=mx-3>${data.move}</li>`));
        }
    }
});

function onHover (tile, color, socket) {
    $('#board .reversi-cell:empty').hover(event => {
        // event handler for 'mouseenter'
        var square = $(event.target),
            id = square.attr('id');
        if (square.is(':empty') && isValidSquare(id, color)) {
            square.removeClass('table-success').addClass('table-info');
            square.on('click', () => {
                square.addClass('table-success').removeClass('table-info');
                $('.reversi-cell').off('mouseenter mouseleave click');
                socket.send(JSON.stringify({
                    "command": 'move',
                    "move": `${color[0]}${square.attr('id')}`
                }));
            });
        }
    }, event => {
        // event handler for 'mouseleave'
        var square = $(event.target);
        square.addClass('table-success').removeClass('table-info');
        square.off('click');
    });
}

// function to determine if a table cell constitutes a valid move
function isValidSquare(square, color) {
    // deconstruct the cell's id into  row and column #s
    [row, col] = square.split('').map(n => +n);

    // get the colors for oneself and the opponent
    var own = color == 'white' ? 'tile-white' : 'tile-black',
        opposing = color == 'white' ? 'tile-black' : 'tile-white';

    // check all adjacent squares, making sure not to go off the board
    for (let r = row - 1; r <= row + 1; r++) {
        if (0 < r < 9) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (0 < c < 9) {
                    let adj = $(`#${r}${c}`);
                    if (adj.children().hasClass(opposing)) {
                        let rmove = r - row,
                            cmove = c - col,
                            a = r + rmove,
                            b = c + cmove;

                        // if the adjacent tile is the opposite color,
                        // continue moving in the same direction until a
                        // non-opposing cell is reached
                        while ($(`#${a}${b}`).children().hasClass(opposing)) {
                            a += rmove;
                            b += cmove;
                        }

                        // if an own cell is reached, the move is valid
                        if ($(`#${a}${b}`).children().hasClass(own)) {
                            return true;
                        }
                    }
                }
            }
        }
    }

    // if no adjacent tiles are valid, the move is invalid
    return false;
}

// function to flip opponent's tiles based starting from a valid cell
function flipTiles(square, color) {
    // deconstruct the cell's id into  row and column #s
    [row, col] = square.split('').map(n => +n);

    // get the colors for oneself and the opponent
    var own = color == 'white' ? 'tile-white' : 'tile-black',
        opposing = color == 'white' ? 'tile-black' : 'tile-white';

    // check all adjacent squares, making sure not to go off the board
    for (let r = row - 1; r <= row + 1; r++) {
        if (0 < r < 9) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (0 < c < 9) {
                    let adj = $(`#${r}${c}`);
                    if (adj.children().hasClass(opposing)) {
                        let rmove = r - row,
                            cmove = c - col,
                            a = r + rmove,
                            b = c + cmove
                            check = $(`#${a}${b}`),
                            flipping = [adj];

                        // if the adjacent tile is the opposite color,
                        // continue moving in the same direction until a
                        // non-opposing cell is reached, adding each opposing
                        // cell to a list to be flipped
                        while (check.children().hasClass(opposing)) {
                            flipping.push(check);
                            a += rmove;
                            b += cmove;
                            check = $(`#${a}${b}`);
                        }

                        // if an own cell is reached, flip all tiles in between
                        if (check.children().hasClass(own)) {
                            flipping.forEach(cell => {
                                cell.children().addClass(own).removeClass(opposing);
                            });
                        }
                    }
                }
            }
        }
    }

    $('#whiteCount').text(
        `Score: ${$('#board .tile-white').length} Tiles`
    );
    $('#blackCount').text(
        `Score: ${$('#board .tile-black').length} Tiles`
    );
}
