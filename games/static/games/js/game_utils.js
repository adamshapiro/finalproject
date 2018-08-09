// abstract utility functions to separate JS file to be used for both online and
// offline games


// function to apply a hover event to valid tiles
function onHover (tile, color, socket, callback) {
    // filter cells to only those pertaining to valid moves
    var valid = $('#board .reversi-cell:empty').filter(function (index) {
        let id = $(this).attr('id');
        return isValidSquare(id, color);
    });

    // if there are still valid moves, apply the hover event
    if (valid.length > 0) {
        valid.hover(event => {
            // event handler for 'mouseenter'
            var square = $(event.target);

                square.removeClass('table-success').addClass('table-warning');

                // add a different onclick event to the button depending on if
                // the game is on- or offline
                callback(square, color);
        }, event => {
            // event handler for 'mouseleave'
            var square = $(event.target);
            square.addClass('table-success').removeClass('table-warning');
            square.off('click');
        });
    } else {
        // if there are no valid moves, the game is over.
        var whiteScore = $('#board .tile-white').length,
            blackScore = $('#board .tile-black').length;

        // whoever has more tiles down wins
        var winner = whiteScore > blackScore ? 'W' : 'B';
        socket.send(JSON.stringify({
            "command": 'end_game',
            "winner": winner
        }));
    }
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

    // after flipping tiles, update scores
    $('#whiteCount').text(
        `Score: ${$('#board .tile-white').length} Tiles`
    );
    $('#blackCount').text(
        `Score: ${$('#board .tile-black').length} Tiles`
    );
}
