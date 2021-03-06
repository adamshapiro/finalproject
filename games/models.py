from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.urls import reverse

import string, random

# give each Game a random string label which will be used as the url
def get_random_label():
    while True:
        new_label = ''.join(random.choices(
            string.ascii_lowercase + string.digits,
            k=12
        ))
        if not Game.objects.filter(label=new_label).exists():
            return new_label

# Create your models here.
class Game(models.Model):
    STATUS_OPTIONS = (
        ('O', 'Ongoing'),
        ('W', 'White Victory'),
        ('B', 'Black Victory')
    )
    white_player = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="white_games")
    black_player = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        blank=True, null=True,
        related_name="black_games"
    )
    status = models.CharField(max_length=1, choices=STATUS_OPTIONS, default='O')
    history = models.CharField(max_length=240, default='')
    label = models.CharField(max_length=12, unique=True, default=get_random_label)

    def add_move(self, move):
        self.history += f"x{move}"
        self.save()

    def end_game(self, winner):
        self.status = winner
        self.save()

    # parse the game's history into a list of moves
    # since each move in the history will start with 'x', the list will start
    # with an empty value, so splice it out
    @property
    def parsed_history(self):
        return self.history.split('x')[1:]

    # shorthand to check if a user is a player in a game
    @property
    def players(self):
        return [self.white_player, self.black_player]

    @property
    def single_player(self):
        return self.white_player == self.black_player

    def get_absolute_url(self):
        return reverse('game', args=[self.label])

# a model for challenges sent directly to other players
class Challenge(models.Model):
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_challenges"
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_challenges"
    )

    def __str__(self):
        return f"Challenge from {self.sender.username} to {self.receiver.username}"
