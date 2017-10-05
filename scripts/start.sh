#!/bin/sh

screen -S novelia -d -m nodemon server.js
screen -S webpack -d -m webpack --watch
docker run -d -p 27017:27017 mongo
