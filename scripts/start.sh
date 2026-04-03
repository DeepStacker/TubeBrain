#!/bin/bash
set -e

echo "🚀 Starting YouTube Genius Backend..."

# Run database migrations
echo "📦 Running database migrations..."
python -m alembic upgrade head

# Start supervisord to manage both backend and worker
echo "🔧 Starting supervisord..."
exec supervisord -c /etc/supervisord.conf
