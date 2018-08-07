from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import User

from .models import Game, Challenge

class GamesConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        # get the label from the websocket and add the user to the group
        self.label = self.scope['url_route']['kwargs']['label']
        game = await get_game(self.label)
        await self.channel_layer.group_add(self.label, self.channel_name)
        await self.accept()
        await self.setup_board(game)

    async def receive_json(self, content):
        command = content.get('command', None)
        if command == 'move':
            await self.send_move(content['move'])
        elif command == 'end_game':
            await self.send_end(content['winner'])

    async def disconnect(self, close_code):
        # remove the user from the group associated with the game before closing
        await self.channel_layer.group_discard(self.label, self.channel_name)

    async def setup_board(self, game):
        # determine if the current user is playing and which position they are
        user = self.scope['user']
        playingWhite = False
        playingBlack = False

        if user == game.white_player:
            playingWhite = True
        if user == game.black_player:
            playingBlack = True

        history = game.parsed_history
        if game.status != 'O':
            turn = game.get_status_display()
        elif len(history) % 2 == 0:
            turn = "Black's Turn"
        else:
            turn = "White's Turn"

        # send the games history, the player's position, and
        # the current turn to the client
        await self.send_json({
            'setup': True,
            'history': history,
            'playingWhite': playingWhite,
            'playingBlack': playingBlack,
            'turn': turn
        })

    async def send_move(self, move):
        game = await get_game(self.label)
        game.add_move(move)
        if move[0] == 'w':
            turn = "Black's Turn"
        else:
            turn = "White's Turn"
        await self.channel_layer.group_send(
            self.label,
            {
                'type': 'game.move',
                'move': move,
                'turn': turn
            }
        )

    async def send_end(self, winner):
        game = await get_game(self.label)
        game.end_game(winner)
        await self.channel_layer.group_send(
            self.label,
            {
            'type': 'game.end',
            'winner': game.get_status_display()
            }
        )

    async def game_move(self, event):
        await self.send_json({
            'new_move': True,
            'move': event['move'],
            'turn': event['turn']
        })

    async def game_end(self, event):
        await self.send_json({
            'game_over': True,
            'winner': event['winner']
        })

class LobbyConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.username = self.scope['user'].username
        # create a group associated with the user's username so it can be found easily
        await self.channel_layer.group_add(self.username, self.channel_name)
        await self.accept()

    async def receive_json(self, content):
        command = content.get('command', None)
        if command == 'new_challenge':
            await self.send_challenge(content['receiver_id'])
        if command == 'respond':
            await self.send_response(content['id'], content['response'])

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.username, self.channel_name)

    async def send_challenge(self, receiver_id):
        user = self.scope['user']
        challenge, created = await get_or_create_challenge(user, receiver_id)
        if created:
            await self.channel_layer.group_send(
                challenge.receiver.username,
                {
                    'type': 'lobby.challenge',
                    'challenge': challenge
                }
            )
            await self.send_json({
                'challenge_sent': True,
                'id': challenge.id,
                'challenge': str(challenge)
            })

    async def send_response(self, id, response):
        notify = await respond_to_challenge(int(id), response)
        for user in notify['notees']:
            responder = user == self.scope['user']
            await self.channel_layer.group_send(
                user.username,
                {
                    'type': 'lobby.respond',
                    'label': notify['label'],
                    'responder': responder,
                    'challenge': id
                }
            )

    async def lobby_challenge(self, event):
        await self.send_json({
            'challenge_received': True,
            'id': event['challenge'].id,
            'challenge': str(event['challenge'])
        })

    async def lobby_respond(self, event):
        await self.send_json({
            'challenge_responded': True,
            'label': event['label'],
            'responder': event['responder'],
            'challenge': event['challenge']
        })


# function to query Django model asynchronously
@database_sync_to_async
def get_game(game_label):
    game = Game.objects.get(label=game_label)
    return game

# find the opponent based on id and create a challenge
@database_sync_to_async
def get_or_create_challenge(sender, receiver_id):
    receiver = User.objects.get(pk=receiver_id)
    # you should only be able to send one challenge to each user at a time
    info = Challenge.objects.get_or_create(sender=sender, receiver=receiver)
    return info

# find the challenge and either create a game or destroy the challenge
@database_sync_to_async
def respond_to_challenge(id, response):
    challenge = Challenge.objects.get(pk=id)
    # if the challenge was accepted, create a game between the two players
    if response == 'Y':
        game = Game.objects.create(
            white_player=challenge.sender,
            black_player=challenge.receiver
        )
        label = game.label
    else:
        label = None

    notees = [challenge.sender, challenge.receiver]
    # after the response, delete the challenge
    challenge.delete()
    return {
        'label': label,
        'notees': notees
    }
