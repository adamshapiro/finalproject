$(function() {
    // create websocket path from current url
    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var ws_path = `${ws_scheme}://${window.location.host}${window.location.pathname}`;

    var socket = new ReconnectingWebSocket(ws_path);

    // create elements for game tiles
    const whiteTile = document.createElement('div');
        whiteTile.className = "tile-white";
    const blackTile = document.createElement('div');
        blackTile.className = "tile-black";


    $('.reversi-cell').hover(event => {
        // event handler for 'mouseenter'
        var square = $(event.target);
        if (square.is(':empty') && isValidSquare(square)) {
            square.removeClass('table-success').addClass('table-info');
            square.on('click', () => {
                square.addClass('table-success').removeClass('table-info');
                square.append(whiteTile.outerHTML);
                flipTiles(square);
                square.off('mouseenter mouseleave');
            });
        }
    }, event => {
        // event handler for 'mouseleave'
        var square = $(event.target);
        square.addClass('table-success').removeClass('table-info');
        square.off('click');
    });

    // setup the initial board state
    $('#44, #55').append(whiteTile.outerHTML).off('mouseenter mouseleave');
    $('#45, #54').append(blackTile.outerHTML).off('mouseenter mouseleave');
});

// function to determine if a table cell constitutes a valid move
function isValidSquare(square) {
    // deconstruct the cell's id into  row and column #s
    [row, col] = square.attr('id').split('').map(n => +n);

    // get the colors for oneself and the opponent
    var color = 'white',
        own = color == 'white' ? 'tile-white' : 'tile-black',
        opposing = color == 'white' ? 'tile-black' : 'tile-white';

    // check all adjacent squares, making sure not to go off the board
    for (let r = row - 1; r <= row + 1; r++) {
        if (0 < r < 9) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (0 < c < 9) {
                    let adj = $(`#${r}${c}`);
                    if (adj.children().hasClass(opposing)) {
                        let a = r,
                            b = c,
                            rmove = r - row,
                            cmove = c - col;

                        // if the adjacent tile is the opposite color,
                        // continue moving in the same direction until a
                        // non-opposing cell is reached
                        while ($(`#${a + rmove}${b + cmove}`)
                            .children().hasClass(opposing)) {
                            a += rmove;
                            b += cmove;
                        }

                        // if an own cell is reached, the move is valid
                        if ($(`#${a + rmove}${b + cmove}`)
                            .children().hasClass(own)) {
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
function flipTiles(square) {
    // deconstruct the cell's id into  row and column #s
    [row, col] = square.attr('id').split('').map(n => +n);

    // get the colors for oneself and the opponent
    var color = 'white',
        own = color == 'white' ? 'tile-white' : 'tile-black',
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

                        // if an own cell is reached, the move is valid
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
}
