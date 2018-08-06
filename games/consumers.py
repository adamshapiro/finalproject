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

    async def disconnect(self, close_code):
        # remove the user from the group associated with the game before closing
        await self.channel_layer.group_discard(self.label, self.channel_name)

    async def setup_board(self, game):
        # determine if the current user is playing and which position they are
        if self.scope['user'] == game.white_player:
            position = 'white'
        elif self.scope['user'] == game.black_player:
            position = 'black'
        else:
            position = 'spectating'

        history = game.parsed_history
        if len(history) % 2 == 0:
            turn = 'black'
        else:
            turn = 'white'

        # send the games history, the player's position, and
        # the current turn to the client
        await self.send_json({
            'setup': True,
            'history': history,
            'position': position,
            'turn': turn
        })

    async def send_move(self, move):
        game = await get_game(self.label)
        game.add_move(move)
        if move[0] == 'w':
            turn = 'black'
        else:
            turn = 'white'
        await self.channel_layer.group_send(
            self.label,
            {
                'type': 'game.move',
                'move': move,
                'turn': turn
            }
        )

    async def game_move(self, event):
        await self.send_json({
            'new_move': True,
            'move': event['move'],
            'turn': event['turn']
        })

# function to query Django model asynchronously
@database_sync_to_async
def get_game(game_label):
    game = Game.objects.get(label=game_label)
    return game
