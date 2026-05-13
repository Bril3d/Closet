# 👗 Closet — Smart Fashion BI/AI Application

> **Digitize your wardrobe. Get AI-powered outfit recommendations. Reduce fashion waste.**

Closet is a full-stack mobile application that helps users manage their wardrobe intelligently using AI classification, weather-based outfit suggestions, and business intelligence analytics.

---

## ✨ Features

### 🤖 AI-Powered Classification
- **Zero-shot garment recognition** using [Marqo FashionSigLIP](https://huggingface.co/Marqo/marqo-fashionSigLIP) — no training required
- Detects **category** (Tops, Bottoms, Shoes, etc.), **subcategory** (T-Shirt, Jeans, Sneakers), **color**, **style**, **pattern**, **sleeve length**, and **fabric**
- **Smart tag suggestions** generated from AI classification
- **Background removal** using [rembg](https://github.com/danielgatis/rembg) for clean item photos

### 📊 BI Analytics Dashboard
- **Style Score** — diversity metric based on category, color, and outfit variety
- **Wardrobe Composition** — interactive pie chart of category distribution
- **Color Palette** — visual breakdown of your wardrobe colors
- **Sleeping Items** — items never used in outfits, encouraging sustainable fashion
- **Cost Per Wear** — track price vs. usage for smart purchasing decisions

### 🌤️ Weather-Based Outfit Suggestions
- Real-time weather data via [OpenWeatherMap API](https://openweathermap.org/)
- Temperature-aware clothing recommendations (freezing → hot)
- Rain detection with waterproof layer suggestions

### 👔 Smart Outfit Recommendations
- **Color harmony engine** using complementary color rules
- **Diversity boosting** — prioritizes least-worn items
- **Category-balanced** outfits (top + bottom or dress + accessories)

### 📱 Mobile App
- Built with **React Native** + **Expo SDK 54**
- 3-tab navigation: Closet, Outfits, Insights
- Item detail, edit, and delete screens
- Outfit creation with drag-and-drop item selection
- Persistent auth using AsyncStorage + Zustand

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────────────┐     ┌──────────┐
│   Mobile App    │────▶│   FastAPI Backend        │────▶│ PostgreSQL│
│  React Native   │     │                         │     └──────────┘
│  Expo SDK 54    │     │  ┌─────────────────────┐│     ┌──────────┐
└─────────────────┘     │  │ AI Service           ││────▶│  MinIO   │
                        │  │ (FashionSigLIP)      ││     │  (S3)    │
                        │  ├─────────────────────┤│     └──────────┘
                        │  │ Weather Service      ││
                        │  │ (OpenWeatherMap)     ││
                        │  ├─────────────────────┤│
                        │  │ Recommendation       ││
                        │  │ Engine               ││
                        │  └─────────────────────┘│
                        └─────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native, Expo SDK 54, TypeScript |
| **State Management** | Zustand + AsyncStorage persistence |
| **Charts** | react-native-gifted-charts |
| **Backend** | FastAPI, Python 3.12 |
| **Database** | PostgreSQL + SQLAlchemy ORM + Alembic |
| **Object Storage** | MinIO (S3-compatible) |
| **AI Model** | Marqo FashionSigLIP (zero-shot classification) |
| **Color Detection** | OpenCV + scikit-learn KMeans |
| **Background Removal** | rembg (U²-Net) |
| **Weather** | OpenWeatherMap API |
| **DevOps** | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ & npm
- Expo CLI (`npm install -g expo-cli`)

### 1. Clone & Setup Backend

```bash
git clone https://github.com/Bril3d/Closet.git
cd Closet

# Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your settings (especially OPENWEATHER_API_KEY)

# Start all services (backend + PostgreSQL + MinIO)
docker-compose up -d
```

### 2. Run Database Migrations

```bash
docker-compose exec backend alembic upgrade head
```

### 3. Setup & Run Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

> **Note:** For mobile → backend connectivity, set `MINIO_ENDPOINT_PUBLIC` in your `.env` to your machine's IP (e.g., `http://192.168.1.100:9000`).

---

## 📂 Project Structure

```
Closet/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/            # API Routes
│   │   │   ├── auth.py        # Authentication (register/login)
│   │   │   ├── items.py       # CRUD + AI classification
│   │   │   ├── outfits.py     # Outfit management
│   │   │   ├── analytics.py   # BI dashboard endpoints
│   │   │   └── suggestions.py # Weather + outfit suggestions
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   │   ├── ai_service.py  # FashionSigLIP classification
│   │   │   ├── weather_service.py
│   │   │   ├── recommendation_service.py
│   │   │   └── storage.py     # MinIO integration
│   │   └── core/              # Config, DB, security
│   ├── tests/                 # pytest test suite
│   ├── alembic/               # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── mobile/                    # React Native App
│   ├── app/
│   │   ├── (tabs)/            # Tab screens
│   │   │   ├── index.tsx      # Closet (item grid)
│   │   │   ├── two.tsx        # Outfits
│   │   │   └── three.tsx      # Insights (analytics)
│   │   ├── items/
│   │   │   ├── [id].tsx       # Item detail
│   │   │   └── edit/[id].tsx  # Item edit
│   │   ├── outfits/           # Outfit screens
│   │   └── upload.tsx         # Add item with AI scan
│   ├── store/                 # Zustand state
│   └── services/              # API client
├── garment-recognition/       # ML training scripts
├── docker-compose.yml
└── README.md
```

---

## 🧪 Testing

```bash
cd backend
pip install pytest httpx
python -m pytest tests/ -v
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| GET | `/api/v1/items/` | List user's items (with filters) |
| POST | `/api/v1/items/` | Upload item (auto AI classify) |
| POST | `/api/v1/items/classify` | Classify image without saving |
| GET | `/api/v1/items/{id}` | Item detail |
| PATCH | `/api/v1/items/{id}` | Update item |
| DELETE | `/api/v1/items/{id}` | Delete item |
| GET | `/api/v1/outfits/` | List outfits |
| POST | `/api/v1/outfits/` | Create outfit |
| DELETE | `/api/v1/outfits/{id}` | Delete outfit |
| GET | `/api/v1/analytics/summary` | Wardrobe summary stats |
| GET | `/api/v1/analytics/category-distribution` | Category pie chart data |
| GET | `/api/v1/analytics/color-distribution` | Color palette data |
| GET | `/api/v1/analytics/sleeping-items` | Unused items |
| GET | `/api/v1/suggestions/weather?city=X` | Weather outfit suggestion |
| GET | `/api/v1/suggestions/outfit` | AI outfit recommendation |

---

## 👥 Team

Built as a university BI/AI project by:

- **Oussama Ferchichi**
- **Khaled Briki**
- **Mohamed Amine Guesmi**

---

## 📄 License

This project is for educational purposes.
