=======
sails-blog
==========

An heroku ready blogging engine built with sails.js

## Features Include:
* RSS
* Import from any existing blog via RSS
* Blog creation, editing, and deletion.
* Free tagging
* Markdown

## Installation Instructions
1. Install Sails.js
2. Create a user in mongodb://localhost:27017/sails/user, i.e. {username:"", password:"bcrypt hashed password"} <- see create-user.js
3. Run Sails via "sails lift"

## Heroku Deployment
1. Create a heroku project by running "heroku create" from project root
2. Run "heroku labs:enable websockets -a myapp" to enable websockets
3. Add Mongolab integration "heroku addons:add mongolab"
4. Deploy with "git push heroku master"