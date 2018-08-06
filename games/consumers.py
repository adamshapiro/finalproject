from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models import Game

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

# function to query Django model asynchronously
@database_sync_to_async
def get_game(game_label):
    game = Game.objects.get(label=game_label)
    return game
