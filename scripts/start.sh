#!/bin/sh

screen -S novelia -d -m nodemon --harmony server.js
screen -S webpack -d -m "webpack --watch"