# ⚡ QuickMess – College Mess Finder & Queue Saver

> **Beat the lunch queue. Find your mess in seconds.**  
> A full-stack web application engineered for college students who have short lunch breaks and waste valuable time wandering around campus searching for open messes and waiting in long lines.

---

## 🍽️ The Problem & QuickMess Solution

- **The Problem:** Between back-to-back lectures, college students typically have a short 40–50 minute lunch break. Students waste 20–25 minutes walking in the heat, checking if food is available, finding out of stock items, and standing in long token queues.
- **The Solution:** **QuickMess** provides a centralized platform to check today's live meal menus, starting prices, real-time crowd levels, estimated queue waiting times, and walking distance from campus gates before leaving the classroom. Students can compare messes side-by-side and generate an instant **QuickMess Lunch Pass** to head straight to the counter.

---

## ✨ Features & Pages

| Page / Feature | Description |
| :--- | :--- |
| **🏠 1. Home Page** | Problem-solution hero, quick search bar, instant filter chips (`<5m wait`, `Pure Veg`, `Under ₹80`), campus queue stats, and popular/nearby mess cards. |
| **🔍 2. Find Mess** | Complete directory with live multi-filter controls: **Price**, **Food Type** (*Pure Veg, Veg & Non-Veg, South Indian*), **Crowd Level** (*Low, Moderate, High*), **Max Queue Wait Time** (*<5m, <10m, <15m*), and **Open Status**. Sort by shortest wait, lowest price, rating, or distance. |
| **🍲 3. Mess Details** | Mess name, today's chef specials, full menu items with pricing, timings, current crowd level indicator, estimated waiting time badge, rating, address, landmark, features (*Unlimited Rotis, RO Water, AC Seating*), and **"Confirm This Mess"** CTA. |
| **⚖️ 4. Compare Mess** | Side-by-side comparison table for **2–3 messes** comparing price, today's menu, crowd meter, waiting time, timings, student rating, and distance with highlighted winner badges (*Fastest Queue, Lowest Price, Top Rated*). |
| **🎟️ 5. Confirm Mess & Lunch Pass** | Confirmation summary with selected meal, party size, total bill, and an instant digital **QuickMess Lunch Pass** (`QM-XXXX`), arrival countdown timer, and 1-click Google Maps walking directions. |
| **⭐ 6. Student Reviews** | Community hub displaying student reviews with reported wait times, crowd experiences, helpful upvoting, and a modal form to submit new reviews. |
| **📱 7. Responsive Navigation & Footer** | Mobile-friendly navigation header with live compare counter badge, active lunch pass alert, and footer with rush-hour break tips. |

---

## 🛠️ Technology Stack

- **Frontend:**
  - **React 19** + **Vite 8**
  - **Tailwind CSS v4** for clean, modern, student-focused UI
  - **Lucide React** for crisp icons
- **Backend:**
  - **Node.js** & **Express 5**
  - RESTful API design with clean modular architecture
- **Database:**
  - **SQLite3** (`server/quickmess.sqlite`)
  - Automatically seeds realistic college messes, menus, and student reviews on first run
- **Architecture:**
  - Unified single-repository setup where Express serves both API endpoints and the built Vite React client in production.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+ or later)
- npm (v9+ or later)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/QuickMess.git
cd QuickMess
```

### 2. Install all dependencies
```bash
npm run install-all
```
*(This installs root dependencies and client dependencies in one command).*

### 3. Start development server
```bash
npm run dev
```
- **Backend Server:** `http://localhost:5000`
- **Frontend App:** `http://localhost:5173` (Vite dev server with API proxy)

### 4. Run automated test suite
```bash
npm test
```
Verifies all 9 core API endpoints, filters, reviews, and static serving end-to-end.

---

## 🌐 Production Build

To build the client for production:
```bash
npm run build
npm start
```
The server will launch on `http://localhost:5000` serving both the `/api/*` routes and the production React single-page application.

---

## ☁️ Deployment Guide (Render + GitHub Ready)

This repository is pre-configured for **Render** 1-click or standard Web Service deployment.

### Option A: Standard Render Web Service
1. Push your code to a **GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of QuickMess"
   git remote add origin https://github.com/<your-username>/quickmess.git
   git branch -M main
   git push -u origin main
   ```
2. Log in to [Render](https://render.com) and click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Fill in the following settings:
   - **Name:** `quickmess`
   - **Environment:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm run install-all && npm run build`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
6. Click **Deploy Web Service**.

### Option B: Render Blueprint (`render.yaml`)
A `render.yaml` blueprint is already included in the root directory. On Render, simply choose **New +** > **Blueprint**, connect your repo, and Render will automatically configure the build and start commands.

---

## 📡 API Reference

### Messes
- `GET /api/messes` – Get all messes (supports query filters: `search`, `foodType`, `maxPrice`, `crowdLevel`, `maxWait`, `openOnly`, `sortBy`).
- `GET /api/messes/popular` – Get top messes for homepage cards.
- `GET /api/messes/:id` – Get single mess details with joined reviews.
- `PATCH /api/messes/:id/crowd` – Update live crowd level and wait time.
- `GET /api/stats` – Get campus mess count, average wait time, and passes confirmed.

### Confirmations (Lunch Passes)
- `POST /api/confirm` – Confirm a mess meal and generate a `QM-XXXX` digital pass.
- `GET /api/confirm/:id` – Retrieve a pass by ID or code.
- `GET /api/confirmations` – Get recent student confirmations.

### Reviews
- `GET /api/reviews` – Get recent student reviews across all campus messes.
- `POST /api/reviews/mess/:id` – Submit a review for a specific mess.
- `POST /api/reviews/:id/helpful` – Upvote a review as helpful.

---

## 📂 Project Structure

```
MessMate/
├── client/                      # Vite + React 19 Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CrowdBadge.jsx   # Live crowd & queue badge
│   │   │   ├── MessCard.jsx     # High-contrast mess card
│   │   │   ├── Navbar.jsx       # Header with active pass & compare pills
│   │   │   ├── Footer.jsx       # Footer with break tips
│   │   │   ├── CompareFloatingBar.jsx # Cross-page compare drawer
│   │   │   └── ReviewModal.jsx  # Interactive student review form
│   │   ├── context/
│   │   │   └── AppContext.jsx   # State management (Compare, Passes, Routes)
│   │   ├── pages/
│   │   │   ├── HomePage.jsx     # Hero & fast queue picks
│   │   │   ├── FindMessPage.jsx # Full filtering & directory
│   │   │   ├── MessDetailPage.jsx # Menu, timings, crowd & confirm
│   │   │   ├── ComparePage.jsx  # 2-3 mess side-by-side comparison
│   │   │   ├── ConfirmPage.jsx  # Digital Lunch Pass & timer
│   │   │   └── ReviewsPage.jsx  # Student reviews & ratings hub
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                      # Node.js + Express 5 Backend
│   ├── routes/
│   │   ├── messRoutes.js        # Mess endpoints & filters
│   │   ├── reviewRoutes.js      # Student reviews & votes
│   │   └── confirmRoutes.js     # Lunch pass confirmations
│   ├── db.js                    # SQLite database & sample seed data
│   └── server.js                # Express entry point & static SPA host
├── .env.example
├── .gitignore
├── package.json                 # Root scripts (dev, build, start, test)
├── render.yaml                  # 1-click Render blueprint
├── test-server.js               # End-to-end automated test runner
└── README.md
```

---

## 🎓 License
MIT License. Built for college students everywhere.
