from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models import Game

class GamesConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        pass

    async def receive_json(self, content):
        pass

    async def disconnect(self):
        pass

@database_sync_to_async
def get_game(game_label):
    game = Game.objects.get(label=label)
    return game
