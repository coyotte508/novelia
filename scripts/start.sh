#!/bin/sh

screen -S novelia -d -m nodemon server.js
screen -S webpack -d -m webpack --watch
