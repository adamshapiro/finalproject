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

    async def receive_json(self, content):
        pass

    async def disconnect(self, close_code):
        # remove the user from the group associated with the game before closing
        await self.channel_layer.group_discard(self.label, self.channel_name)

# function to query Django model asynchronously
@database_sync_to_async
def get_game(game_label):
    game = Game.objects.get(label=game_label)
    return game
