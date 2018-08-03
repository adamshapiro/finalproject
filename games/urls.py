from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('game/<game_label>', views.game, name="game"),
    path('new_game', views.new_game, name="new_game"),
    path("login", views.login_view, name="login"),
    path("register", views.register_view, name="register"),
    path("logout", views.logout_view, name="logout")
]
