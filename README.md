# 👗 Closet — Smart Fashion BI/AI Application


Closet is a state-of-the-art, full-stack mobile application that transforms your smartphone into a personal digital stylist. By merging zero-shot AI garment classification, real-time geocoding, and advanced business intelligence, Closet empowers users to make sustainable, stylish, and data-driven fashion choices every day.

---

## 📱 Visual Walkthrough

Explore the core experience of Closet through these feature demonstrations.

| **Secure Authentication** | **AI Garment Recognition** | **Wardrobe Intelligence** |
|:---:|:---:|:---:|
| <img src="./demo/1.gif" width="200" style="border-radius: 10px;" /> | <img src="./demo/2.gif" width="200" style="border-radius: 10px;" /> | <img src="./demo/3.gif" width="200" style="border-radius: 10px;" /> |
| *Seamless login & registration with persistent session management.* | *Instant zero-shot classification & background removal.* | *Interactive closet management with category filtering.* |

| **Outfit Engineering** | **BI Insights Dashboard** | **AI Daily Stylist** |
|:---:|:---:|:---:|
| <img src="./demo/4.gif" width="200" style="border-radius: 10px;" /> | <img src="./demo/5.gif" width="200" style="border-radius: 10px;" /> | <img src="./demo/6.gif" width="200" style="border-radius: 10px;" /> |
| *Intuitive drag-and-drop builder for custom style combinations.* | *Deep analytics on style score, color palette, and usage.* | *Personalized mix generated from color harmony logic.* |

| **Weather-Sync Stylist** |
|:---:|
| <img src="./demo/7.gif" width="250" style="border-radius: 10px;" /> |
| *Real-time weather integration for location-perfect outfit matching.* |

---

## ✨ Key Features

### 🤖 AI-Powered Classification
- **Zero-Shot Garment Recognition:** Powered by [Marqo FashionSigLIP](https://huggingface.co/Marqo/marqo-fashionSigLIP) — instantly detects clothing without prior training.
- **Deep Metadata Extraction:** Automatically identifies **category**, **subcategory**, **color**, **style**, **pattern**, and **fabric**.
- **Smart Tagging:** Generates relevant tags autonomously based on visual features.
- **Background Removal:** Clean, uniform closet item photos powered by [rembg](https://github.com/danielgatis/rembg) (U²-Net).

### 💅 The AI Stylist
- **Daily Mix:** A dedicated engine that generates harmonious daily outfits by rotating your closet items, ensuring your least-worn pieces get the love they deserve.
- **Weather Match:** Input any city globally (with an intelligent autocomplete dropdown) to fetch real-time OpenWeatherMap data and receive an outfit tailored for current conditions.
- **Color Harmony Engine:** Employs advanced color theory (complementary and analogous rules) to guarantee your suggested outfits look incredible together.

### 📊 BI Analytics Dashboard
- **Style Score:** A proprietary diversity metric based on category, color, and outfit variety.
- **Wardrobe Composition:** Interactive, beautifully rendered pie charts mapping category distributions.
- **Color Palette:** A visual breakdown mapping your exact wardrobe color usage.
- **Sleeping Items:** Identifies items sitting unused in your closet, encouraging sustainable fashion habits.
- **Cost Per Wear:** Tracks the financial efficiency of your purchases.

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
cp backend/.env.example backend/.env
# Edit backend/.env to add your OPENWEATHER_API_KEY
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

---

## 👥 The Team

Built as a capstone Business Intelligence & Artificial Intelligence project by:

- **Oussama Ferchichi**
- **Khaled Briki**
- **Mohamed Amine Guesmi**

---

## 📄 License

This project is intended for educational purposes and academic demonstration.
