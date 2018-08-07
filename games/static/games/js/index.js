$(function() {
    // create websocket to lobby consumer
    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var ws_path = `${ws_scheme}://${window.location.host}/lobby`;

    var socket = new ReconnectingWebSocket(ws_path);

    $('#sentChallenges, #receivedChallenges').on('click', 'button', event => {
        var button = $(event.target),
            response = button.val(),
            id = button.closest('li').attr('id').replace(/[^0-9]/g, "");
        socket.send(JSON.stringify({
            'command': 'respond',
            'id': id,
            'response': response
        }));
    });

    $('.send-challenge').on('click', event => {
        var id = $(event.target).data('user');
        socket.send(JSON.stringify({
            'command': 'new_challenge',
            'receiver_id': id
        }));
    });

    socket.onmessage = function(message) {
        var data = JSON.parse(message.data);

        if (data.challenge_sent) {
            var challenge = $(
                `<li class='list-group-item list-group-item-info'
                 id='challenge${data.id}'>
                    ${data.challenge}
                    <button value='N' class='btn btn-danger float-right'>Cancel</button>
                </li>`
            );
            $('.no-sent').remove();
            $('#sentChallenges').append(challenge);
        }

        if (data.challenge_received) {
            var challenge = $(
                `<li class='list-group-item list-group-item-info'
                 id='challenge${data.id}'>
                    ${data.challenge}
                    <div class='btn-group float-right'>
                        <button value='Y' class='btn btn-success'>Accept</button>
                        <button value='N' class='btn btn-danger'>Decline</button>
                    </div>
                </li>`
            );
            $('.no-received').remove();
            $('#receivedChallenges').append(challenge);
        }

        if (data.challenge_responded) {
            // if you have just responded to challenge, redirect to the new game's page
            if (data.label && data.responder) {
                window.location.replace(`/game/${data.label}`);
            }
            $(`#challenge${data.challenge}`).remove()
        }
    }
});
