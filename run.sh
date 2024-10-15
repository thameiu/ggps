#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <build|down>"
  exit 1
fi

# If the argument is 'build', perform the following actions
if [ "$1" == "build" ]; then
  sudo chmod -R 777 .

  cd ./backend/ggps-backend || { echo "Directory ./backend/ggps-backend does not exist."; exit 1; }

  docker compose up --build -d

  docker compose exec app php artisan migrate

  cd ../../frontend/app || { echo "Directory ../../frontend/app does not exist."; exit 1; }

  npm run dev


elif [ "$1" == "start" ]; then
  sudo chmod -R 777 .

  cd ./backend/ggps-backend || { echo "Directory ./backend/ggps-backend does not exist."; exit 1; }

  docker compose up -d

  cd ../../frontend/app || { echo "Directory ../../frontend/app does not exist."; exit 1; }

  npm run dev


elif [ "$1" == "down" ]; then
  cd ./backend/ggps-backend || { echo "Directory ./backend/ggps-backend does not exist."; exit 1; }

  docker compose down

  echo "Docker containers stopped."
  

else
  echo "Invalid argument. Use 'build' to build and start, or 'down' to stop the containers."
  exit 1
fi
