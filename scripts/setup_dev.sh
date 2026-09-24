#!/usr/bin/env bash
set -e

echo "=========================================="
echo " Setting up CrisisLens AI Development Env"
echo "=========================================="

# 1. Environment file check
if [ ! -f .env ]; then
  echo "--> Creating .env from .env.example"
  cp .env.example .env
fi

# 2. Backend setup
echo "--> Installing backend dependencies..."
cd backend
python3 -m venv venv || virtualenv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install pytest pytest-asyncio
cd ..

# 3. Frontend setup
echo "--> Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "=========================================="
echo " CrisisLens AI Environment Ready!"
echo " Start backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo " Start frontend: cd frontend && npm run dev"
echo " Or run with Docker: docker-compose up"
echo "=========================================="
