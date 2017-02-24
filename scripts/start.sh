#!/bin/sh

screen -S novelia -d -m nodemon server.js
screen -S grunt -d -m "webpack --watch"