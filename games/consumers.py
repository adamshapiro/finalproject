from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.exceptions import StopConsumer

from .models import Game

class GamesConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.label = self.scope['url_route']['kwargs']['label']
        game = await get_game(self.label)
        await self.channel_layer.group_add(self.label, self.channel_name)
        await self.accept()

    async def receive_json(self, content):
        pass

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.label, self.channel_name)
        raise StopConsumer

@database_sync_to_async
def get_game(game_label):
    game = Game.objects.get(label=game_label)
    return game
