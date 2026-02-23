### 1. Product Overview
The **Closet** app addresses the "Smart Fashion" challenge: the fashion industry's detrimental effect on daily life, where people buy excessively but only wear approximately **50% of their wardrobe**. This leads to **$500 billion lost annually** due to under-wearing and failure to recycle. By helping users "know what they have," the app eliminates the **stressful mornings** spent picking outfits and reduces fashion waste. The MVP focuses on the first two steps of the journey: **knowing your clothes** and **finding your personal style** through digital organization.

### 2. Core Features (MVP)
*   **Account Creation / Login:** Secure authentication using **JWT**.
*   **Upload Clothing Item Photo:** Capture or upload photos to **S3-compatible storage**.
*   **AI Clothing Detection:** Automatic categorization (e.g., "Tops," "Bottoms") to help users **digitize their closet** efficiently.
*   **Closet Management:** A central "space" to view the value and volume of owned items.
*   **Outfit Creation:** Tools to **plan daily outfits in advance** to eliminate selection stress.
*   **Tags / Categories:** System-driven categories (Color, Material) and custom tags.
*   **Search & Filtering:** Fast retrieval of items to find "effective styles".
*   **Favorites:** Quick access to preferred items and outfit combinations.

### 3. User Flow
*   **Onboarding:** Sign-up -> Overview of the "Smart Fashion" philosophy (minimizing waste, maximizing wardrobe value).
*   **Step 1: Know Your Clothes:** User taps "+", uploads a photo, AI detects the category, and the item is saved to the digital wardrobe.
*   **Step 2: Find Your Personal Style:** User selects "Create Outfit," mixes saved items, and views recommendations to enjoy a **stress-free morning**.
*   **Browsing Closet:** A grid view of all clothing, filterable by category, to remind the user of items that might otherwise be "sleeping" in their physical closet.

### 4. System Architecture
*   **Mobile App:** **React Native (Expo)**. Handles UI, camera permissions, and state management.
*   **Backend:** **FastAPI (Python)**. Manages business logic, AI orchestration, and S3 pre-signed URLs.
*   **Database:** **PostgreSQL**. Stores relational data for users, items, and outfit compositions.
*   **Storage:** **S3-compatible** (AWS/MinIO). Hosts clothing images.
*   **AI Service:** An internal module in FastAPI using a **pre-trained model** (like MobileNetV2 or an external API) for classification.

**Architecture Diagram Description:**
The **React Native client** sends requests to the **FastAPI server**. For uploads, the server generates an **S3 Pre-signed URL**; the client uploads directly to **S3**. The server then triggers the **AI Classification Service** to tag the image. Metadata is stored in **PostgreSQL**.

### 5. Database Schema
*   **users:** `id` (UUID, PK), `email` (Unique), `hashed_password`, `created_at`.
*   **clothing_items:** `id` (UUID, PK), `user_id` (FK), `image_url` (String), `category` (String), `color` (String), `is_favorite` (Boolean), `created_at`.
*   **outfits:** `id` (UUID, PK), `user_id` (FK), `name` (String), `description` (Text), `created_at`.
*   **outfit_items:** `id` (PK), `outfit_id` (FK), `item_id` (FK).
*   **tags:** `id` (PK), `name` (String, Unique).
*   **item_tags:** `item_id` (FK), `tag_id` (FK).

### 6. Backend API Design (FastAPI)
*   **POST /auth/register:** Input: `email`, `password`. Output: `access_token`.
*   **POST /clothes/upload-url:** Request a pre-signed S3 URL for image upload.
*   **POST /clothes:** Save item metadata.
    *   *Request Body:* `{"image_url": "...", "category": "Tops", "color": "Blue", "tags": ["casual"]}`
*   **GET /clothes:** Query parameters for `category`, `color`, and `is_favorite`.
*   **POST /outfits:** Save a collection of items.
    *   *Request Body:* `{"name": "Work Look", "item_ids": ["uuid1", "uuid2"]}`
*   **GET /outfits:** Returns all saved outfits for the authenticated user.

### 7. AI Clothing Detection
The agent must implement a **classification service** that:
1.  Receives the `image_url`.
2.  Processes the image through a classifier (e.g., PyTorch model trained on DeepFashion).
3.  Returns a **JSON object** with top-3 predicted categories and the dominant color.

### 8. File Structure
**Backend:**
```text
backend/
├── app/
│   ├── api/ v1/ (auth.py, clothes.py, outfits.py)
│   ├── core/ (config.py, security.py)
│   ├── models/ (user.py, item.py, outfit.py)
│   ├── schemas/ (pydantic_models.py)
│   ├── services/ (s3_service.py, ai_service.py)
│   └── main.py
├── alembic/ (migrations)
└── Dockerfile
```
**Frontend:**
```text
mobile/
├── src/
│   ├── components/ (ImagePicker, ItemCard, OutfitGrid)
│   ├── screens/ (LoginScreen, ClosetScreen, OutfitCreatorScreen)
│   ├── services/ (api.js, auth.js)
│   ├── store/ (useStore.js - Zustand)
│   └── App.js
└── package.json
```

### 9. Development Roadmap
*   **Phase 1 – Project Setup:** Dockerize the backend; initialize the Expo project with Nativewind (Tailwind) for styling.
*   **Phase 2 – Authentication:** Full JWT implementation (Sign up, Sign in, Token refresh).
*   **Phase 3 – Closet CRUD:** Implement image uploading to S3 and item metadata storage.
*   **Phase 4 – AI Integration:** Connect the AI service to suggest tags automatically during upload.
*   **Phase 5 – Outfit Generator:** Build the many-to-many relationship UI to link clothing items into outfits.
*   **Phase 6 – Search & UX:** Add filtering, search bars, and "Favorite" toggles.

### 10. Git Strategy
The agent must follow a **feature-branch workflow**:
1.  Initialize `main`.
2.  Create branches for specific tasks (e.g., `feature/api-auth`, `feature/s3-integration`).
3.  Commit messages must be **imperative** (e.g., "Add Pydantic schemas for items").
4.  Push small, testable increments (maximum 5 files per commit).

### 11. Testing Strategy
*   **Backend:** Use `pytest` for all API endpoints. Ensure 100% coverage on `auth` and `upload` logic.
*   **Frontend:** Use **Jest** for utility functions and **React Native Testing Library** for the Closet and Outfit screens.

### 12. Future Features
*   **Resale Marketplace:** Functionality to **sell unwanted clothes** and buy "pre-loved" items to complete the "Smart Fashion" lifecycle.
*   **Weather-based Suggestions:** Integration with a weather API to recommend appropriate daily styles.
*   **Social Sharing:** Allow users to share their digital closet or specific outfits for social validation.