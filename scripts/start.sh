#!/bin/sh

screen -S novelia -d -m nodemon server.js
screen -S webpack -d -m webpack --watch
screen -S mongo -d -m mongod --bind_ip 127.0.0.1
