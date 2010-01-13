#!/usr/bin/env bash

curl http://127.0.0.1:8000/
curl http://127.0.0.1:8000/notThereYet
curl http://127.0.0.1:8000/shorten?
curl http://127.0.0.1:8000/shorten?url=
curl http://127.0.0.1:8000/shorten?url=http://www.google.de/
curl http://127.0.0.1:8000/shorten?url=http://www.yahoo.de/
curl http://127.0.0.1:8000/shorten?url=http://www.google.de/
curl http://127.0.0.1:8000/~
