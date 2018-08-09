# Final Project

### Web Programming with Python and JavaScript

This website allows visitors, after signing up, to play in or spectate games of
Reversi, both online and offline.
The following files are used:

### HTML
---
* [index.html](/games/templates/games/index.html): The lobby where players can
    view, join, and create games, as well as send and respond to challenges.


* [login.html](/games/templates/games/login.html): A login/register form.

* [layout.html](/games/templates/games/layout.html): The basic layout extended
    by all other HTML pages. Includes the JS scripts and navbar.

### CSS
---
* [game.css](/games/static/games/game.css): Styling to enforce square cells on
    the reversi board. All other styling is done through Bootstrap and JQuery

### JavaScript
---
* [index.js](/games/static/games/index.js): Controls challenging functionality.

* [game.js](/games/static/games/game.js): Controls functionality for
    playing online games.

* [solo.js](/games/static/games/solo.js): Controls functionality for
    playing offline games.

* [game_utils.js](/games/static/games/game_utils.js): Helper functions used by
    both online and offline games, to reduce redundancy.

* [login.js](/games/static/games/login.js): Assists display functionality for
    the login and register forms.

### Python
---
* [urls.py](/games/urls.py): Controls rules for connecting URL routes to views.

* [views.py](/games/views.py): Controls server side functionality of rendering
    HTML pages and submitting data to the database.

* [forms.py](/games/forms.py): Form information for the register and login views.

* [models.py](/games/models.py): Django ORM models for DB tables. includes:
    * Game: model for a game, including players, history, and status
    * Challenge: model for direct challenges between players

* [consumers.py](/games/consumers.py): Contains server-side functionality for
    websockets.

* [routing.py](/reversio/routing.py): Controls routing for websockets between
    client and server (similar to urls.py).

### MISC
---
* [Pipfile](/Pipfile): A list of python modules that must be installed for the
    app to run. Uses pipenv to create a virtual environment. To run:
        pip install pipenv
        pipenv install
        pipenv shell
    Dependencies include channels and channels-redis to allow websockets, and
    django-heroku and dj-database-url to assist hosting.

* [Procfile](/Procfile): File used by heroku to spin up dynos. Uses daphne and
    asgi rather than the standard gunicorn and wsgi to allow Django Channels
    to function.
