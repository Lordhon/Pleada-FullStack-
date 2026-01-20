#!/bin/sh


: "${POSTGRES_HOST:?Need to set POSTGRES_HOST}"
: "${POSTGRES_PORT:?Need to set POSTGRES_PORT}"

echo "Waiting for database at $POSTGRES_HOST:$POSTGRES_PORT..."
while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
  sleep 1
done
echo "Database is up!"

python manage.py migrate


gunicorn config.wsgi:application --bind 0.0.0.0:8000
