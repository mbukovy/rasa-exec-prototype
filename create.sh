#!/bin/sh

if [ "$1" = "" ]
then
  echo "Usage: $0 <port>"
  exit
fi

cp -r ../rasa-template ../rasa-$1

cd ../rasa-$1

python3.6 -m rasa run --enable-api -p $1 > run.log 2>&1 &
