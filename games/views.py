from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.utils.http import is_safe_url
from django.db.models import Q
from django.db import connections

from .forms import RegisterForm, LoginForm
from .models import Game
# Create your views here.

@login_required(login_url='login')
def index(request):
    user=request.user
    # get list for all current games
    games = Game.objects.filter(status='O')
    # get all a users games, divided into ongoing or complete
    my_games = games.filter(Q(white_player=user) | Q(black_player=user))
    old_games = Game.objects.exclude(status='O').\
        filter(Q(white_player=user) | Q(black_player=user))

    sent = user.sent_challenges.all()
    received = user.received_challenges.all()
    others = User.objects.exclude(pk=user.id).exclude(is_superuser=True)
    # users should not be able to send a challenge to the admin account
    context = {
        'user': user,
        'games': games,
        'my_games': my_games,
        'old_games': old_games,
        'sent_challenges': sent,
        'received_challenges': received,
        'users': others
    }
    connections.close_all()
    return render(request, 'games/index.html', context)

@login_required(login_url='login')
def game(request, game_label):
    try:
        game = Game.objects.get(label=game_label)
    except Game.DoesNotExist:
        return HttpResponseRedirect(reverse('index'))

    user = request.user

    # on joining a game with only one player (who is not the current user)
    # join as the opponent
    if not game.black_player and user != game.white_player:
        game.black_player = user
        game.save()

    connections.close_all()
    context = {
        'user': user,
        'game': game,
    }
    return render(request, 'games/game.html', context)

# create a new game with the user as the white player and redirect to it
@login_required(login_url='login')
def new_game(request):
    user = request.user
    hosted = Game.objects.create(white_player=user)

    connections.close_all()
    return HttpResponseRedirect(reverse('game', args=[hosted.label]))

# create a new solo game with the user as both players and redirect to it
@login_required(login_url='login')
def solo_game(request):
    user = request.user
    solo = Game.objects.create(white_player=user, black_player=user)

    connections.close_all()
    return HttpResponseRedirect(reverse('game', args=[solo.label]))

def login_view(request):
    # retain the 'next' context and sanitize it
    redirect_to = request.POST.get('next', request.GET.get('next', reverse('index')))
    redirect_to = (redirect_to
                    if is_safe_url(redirect_to, request.get_host())
                    else reverse('index'))

    # On a POST, get the form data
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            # authenticate the user and log in if they exist
            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)
                return HttpResponseRedirect(redirect_to)

            # add an error and continue to rendering the login page if user doesn't exist
            form.add_error(None, 'That username and password do not match any user')
    else:
        # generate an empty form on a GET request
        form = LoginForm()
    context = {
        'form': form,
        'new_user': False,
        'next': redirect_to
    }
    connections.close_all()
    return render(request, 'games/login.html', context)

# similar to login_view (even uses the same html!) but creates a user
# rather than authenticating an existing one
def register_view(request):
    # retain the 'next' context and sanitize it
    redirect_to = request.POST.get('next', request.GET.get('next', reverse('index')))
    redirect_to = (redirect_to
                    if is_safe_url(redirect_to, request.get_host())
                    else reverse('index'))

    # On a POST, get the form data
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        # if the form is valid, create a new user and log in
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['username']
            email = form.cleaned_data['email']
            first_name = form.cleaned_data['first_name']
            last_name = form.cleaned_data['last_name']
            user = User.objects.create_user(username, email, password)
            user.first_name = first_name
            user.last_name = last_name
            user.save()
            login(request, user)
            return HttpResponseRedirect(redirect_to)
    else:
        form = RegisterForm()
    context = {
        'form': form,
        'new_user': True,
        'next': redirect_to
    }
    connections.close_all()
    return render(request, 'games/login.html', context)

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse('login'))
