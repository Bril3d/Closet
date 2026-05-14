# 👗 Closet — Smart Fashion BI/AI Application

> **Digitize your wardrobe. Get AI-powered outfit recommendations. Reduce fashion waste.**

Closet is a state-of-the-art, full-stack mobile application that helps users manage their wardrobe intelligently. By combining zero-shot AI garment classification, real-time weather integration, and business intelligence analytics, Closet acts as your personal digital stylist.

---

## ✨ Key Features

### 🤖 AI-Powered Classification
- **Zero-Shot Garment Recognition:** Powered by [Marqo FashionSigLIP](https://huggingface.co/Marqo/marqo-fashionSigLIP) — instantly detects clothing without prior training.
- **Deep Metadata Extraction:** Automatically identifies **category** (Tops, Bottoms, Shoes), **subcategory** (T-Shirt, Jeans), **color**, **style**, **pattern**, and **fabric**.
- **Smart Tagging:** Generates relevant tags autonomously based on visual features.
- **Background Removal:** Clean, uniform closet item photos powered by [rembg](https://github.com/danielgatis/rembg) (U²-Net).

### 💅 The AI Stylist (New!)
- **Daily Mix:** A dedicated engine that generates harmonious, stylish daily outfits by rotating your closet items, ensuring your least-worn pieces get the love they deserve.
- **Weather Match:** Input any city globally (with an intelligent autocomplete dropdown) to fetch real-time OpenWeatherMap data and receive an outfit tailored specifically for the current temperature, humidity, and rain conditions.
- **Color Harmony Engine:** Employs advanced color theory (complementary and analogous rules) to guarantee your suggested outfits look incredible together.

### 📊 BI Analytics Dashboard
- **Style Score:** A proprietary diversity metric based on category, color, and outfit variety.
- **Wardrobe Composition:** Interactive, beautifully rendered pie charts mapping category distributions.
- **Color Palette:** A visual breakdown mapping your exact wardrobe color usage.
- **Sleeping Items:** Identifies items sitting unused in your closet, encouraging sustainable fashion habits.
- **Cost Per Wear:** Tracks the financial efficiency of your purchases.

### 📱 Premium Mobile App
- **Built with React Native & Expo SDK 54:** Delivering a flawless cross-platform experience.
- **4-Tab Navigation:** Seamlessly switch between Closet, Outfits, Insights, and the Stylist.
- **Outfit Creation:** Drag-and-drop mechanics to build custom outfits manually.
- **Persistent Storage:** Secure authentication and state management utilizing `expo-secure-store` and Zustand.

---

## 🏗️ System Architecture

```text
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

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Mobile** | React Native, Expo SDK 54, TypeScript |
| **State Management** | Zustand, Expo Secure Store |
| **Data Visualization** | react-native-gifted-charts |
| **Backend API** | FastAPI, Python 3.12 |
| **Database** | PostgreSQL, SQLAlchemy ORM, Alembic |
| **Object Storage** | MinIO (S3-Compatible Object Storage) |
| **AI Models** | Marqo FashionSigLIP, OpenCV, scikit-learn |
| **Background Removal** | rembg (U²-Net Architecture) |
| **External APIs** | OpenWeatherMap (Weather & Geocoding) |
| **Infrastructure** | Docker, Docker Compose |

---

## 🚀 Quick Start Guide

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ & npm
- Expo CLI (`npm install -g expo-cli`)

### 1. Initialize the Backend Environment

```bash
git clone https://github.com/Bril3d/Closet.git
cd Closet

# Copy the environment file
cp backend/.env.example backend/.env

# Important: Edit backend/.env to add your OPENWEATHER_API_KEY
# Ensure MINIO_ENDPOINT_PUBLIC is set to your local machine IP if testing on a physical device.

# Boot up the infrastructure (FastAPI, PostgreSQL, MinIO)
docker-compose up -d
```

### 2. Run Database Migrations

```bash
docker-compose exec backend alembic upgrade head
```

### 3. Launch the Mobile Application

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your iOS or Android device.

> **Network Note:** The mobile app fetches images via a robust backend proxy (`/api/v1/images/`) to ensure seamless image loading across all physical devices and emulators, bypassing restrictive localhost storage issues.

---

## 📂 Repository Structure

```text
Closet/
├── backend/                    # Core Python API
│   ├── app/
│   │   ├── api/v1/            # API Route definitions
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic data validation schemas
│   │   ├── services/          # Core business & AI logic
│   │   │   ├── ai_service.py  # Zero-shot classification & background removal
│   │   │   ├── weather_service.py # OpenWeather integration & Geocoding
│   │   │   └── recommendation_service.py # Outfit generation engine
│   │   └── core/              # Configuration & Database connection
│   ├── tests/                 # Comprehensive pytest suite
│   ├── alembic/               # Database migration scripts
│   └── Dockerfile             # Container configuration
├── mobile/                    # React Native Application
│   ├── app/
│   │   ├── (tabs)/            # Main navigation screens (Closet, Outfits, Insights, Stylist)
│   │   ├── auth/              # Registration & Login flows
│   │   └── items/             # Detailed item management
│   ├── store/                 # Zustand state managers
│   └── services/              # Axios API client wrapper
├── garment-recognition/       # Auxiliary ML training scripts & notebooks
└── docker-compose.yml         # Multi-container orchestration
```

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Authenticate & retrieve JWT |
| POST | `/api/v1/items/` | Upload image, auto-remove background, classify, & save |
| GET | `/api/v1/items/` | Retrieve user wardrobe with optional filters |
| GET | `/api/v1/outfits/` | Retrieve curated outfits |
| GET | `/api/v1/images/{file_key}` | Proxy endpoint serving MinIO images to mobile |
| GET | `/api/v1/analytics/summary` | Fetch core BI metrics & Style Score |
| GET | `/api/v1/suggestions/cities?query=X` | Autocomplete Geocoding for valid city names |
| GET | `/api/v1/suggestions/weather?city=X` | Fetch weather-optimized outfit recommendations |
| GET | `/api/v1/suggestions/outfit` | Fetch AI daily mix outfit recommendation |

---

## 👥 The Team

Built as a capstone Business Intelligence & Artificial Intelligence project by:

- **Oussama Ferchichi**
- **Khaled Briki**
- **Mohamed Amine Guesmi**

---

## 📄 License

This project is intended for educational purposes and academic demonstration.
