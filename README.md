# Closet 👔

**Smart Fashion** — Know what you have, wear what you love.

Closet helps users digitize their wardrobe, plan outfits, and reduce fashion waste.

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | FastAPI (Python)        |
| Database  | PostgreSQL              |
| ORM       | SQLAlchemy + Alembic    |
| Storage   | S3-compatible (MinIO)   |
| Mobile    | React Native (Expo)     |

## Project Structure

```
closet/
├── backend/    # FastAPI application
├── mobile/     # React Native (Expo) app
├── docker/     # Docker Compose & configs
└── docs/       # Documentation & specs
```

## Getting Started

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Mobile
cd mobile
npm install
npx expo start
```

## License

MIT
