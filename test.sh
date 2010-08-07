#!/usr/bin/env bash
set -e

function start {
  # Start a djuio server instance
  echo -n "Starting server... "
  node node.js start $1 > /dev/null &
  # Don't care about messages, especially when node is stopped
  disown $!
  # Wait a bit until it's up and running
  sleep 1 
  echo "done."
}

function stop {
  # Stop the server (if not crashed)
  echo -n "Stopping server... "
  node node.js stop > /dev/null  
  echo "done."
}

function cleanup {
  # Delete the temp database
  rm -f "test/test.db"  
}

# Don't change the test's fixture database
cp "test/fixtures/test.db" "test/test.db"
start "test/test.db"
# Stop the server and clean up in any case
trap "stop ; cleanup ; exit" INT TERM EXIT
# Run the tests
echo -n "Starting tests "
node ./test/statics.js
echo -n "."
node ./test/shorten.js
echo -n "."
node ./test/expand.js
echo -n "."
echo " done."
trap - INT TERM EXIT
stop
cleanup
