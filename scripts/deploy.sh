#!/bin/sh

npm test && ssh coyotte508@www.00h30.com 'cd novelia && bash -s' < scripts/update.sh