#!/bin/bash
set -e

echo "🧪 Running Converso Tests..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS: brew services start postgresql"
    echo "   On Linux: sudo systemctl start postgresql"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first."
    echo "   On macOS: brew services start redis"
    echo "   On Linux: sudo systemctl start redis"
    exit 1
fi

# Create test database if it doesn't exist
echo "📦 Setting up test database..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'converso_test'" | grep -q 1 || createdb -U postgres converso_test

# Run tests
echo "🏃 Running tests..."
pytest $@

echo "✅ Tests completed!"