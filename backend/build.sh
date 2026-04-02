#!/usr/bin/env bash

pip install -r requirements.txt

# Fix token_blacklist tables if missing
python manage.py migrate token_blacklist zero --fake 2>/dev/null || true
python manage.py migrate token_blacklist

# Fix content migration state if musiclistenhistory table is missing
python manage.py migrate content 0026 --fake 2>/dev/null || true

python manage.py migrate
python manage.py collectstatic --noinput
