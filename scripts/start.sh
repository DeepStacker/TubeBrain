#!/bin/bash
set -euo pipefail

echo "Starting TubeBrain backend service..."

# Run migration bootstrap that recovers pre-existing schema states safely.
echo "Running database migration bootstrap..."
python scripts/run_migrations.py

# Start supervisord to manage both backend and worker
echo "Starting supervisord..."
exec supervisord -c /etc/supervisord.conf
