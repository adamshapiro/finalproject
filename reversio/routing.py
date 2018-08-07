from django.urls import path

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from games.consumers import GamesConsumer, LobbyConsumer

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter([
            path('game/<label>', GamesConsumer),
            path('lobby', LobbyConsumer)
        ])
    )
})
