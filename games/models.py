from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.urls import reverse

import string, random

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
    white_player = models.ForeignKey(User, on_delete=models.CASCADE, related_name="white")
    black_player = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        blank=True, null=True,
        related_name="black"
    )
    status = models.CharField(max_length=1, choices=STATUS_OPTIONS, default='O')
    history = models.CharField(max_length=240, default='')
    label = models.CharField(max_length=12, unique=True, default=get_random_label)

    def add_moves(self, moves):
        for move in moves:
            self.history += f"x{move}"
        self.save()

    @property
    def parsed_history(self):
        return self.history.split('x')

    def get_absolute_url(self):
        return reverse('game', args=[self.label])

    def clean(self):
        if self.white_player == self.black_player:
            raise ValidationError('A single person cannot play both sides.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
