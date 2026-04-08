#!/bin/bash
set -e

# Load frontend env vars so docker compose can use them as build args
set -a
source .env.frontend
set +a

docker compose build "$@"
docker compose up -d
