#!/bin/bash
set -e

echo "🚀 Setting up Converso development environment..."

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.11"

if [ "$python_version" != "$required_version" ]; then
    echo "❌ Python $required_version is required, but $python_version is installed."
    echo "Please install Python $required_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing requirements..."
pip install -r requirements.txt

# Install pre-commit hooks
echo "🎣 Installing pre-commit hooks..."
pre-commit install
pre-commit install --hook-type commit-msg

# Create .env file from example if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your API keys"
fi

# Initialize secret scanning baseline
echo "🔒 Initializing secret scanning..."
detect-secrets scan > .secrets.baseline

# Run initial format
echo "🎨 Formatting code..."
make format

echo "
✅ Development environment setup complete!

Next steps:
1. Update .env with your API keys
2. Run 'make dev' to start the development server
3. Run 'make test' to run tests
4. Run 'make lint' to check code quality

Linting commands:
- make lint           # Run all linters
- make format         # Auto-format code
- make lint-flake8    # Run flake8
- make lint-mypy      # Run type checking
- make lint-pylint    # Run pylint
- make lint-bandit    # Run security checks

Pre-commit hooks are installed and will run automatically on git commit.
"