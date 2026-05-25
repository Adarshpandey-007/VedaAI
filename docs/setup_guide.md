# VedaAI AI Assessment Creator: Setup & Operations Guide

Welcome to the comprehensive setup and operations manual for the **VedaAI AI Assessment Creator**. Follow this guide to configure, build, and deploy the full-stack system in development or production.

---

## 💻 System Prerequisites

Ensure your machine meets the following environment baselines:
* **Node.js**: `v18.0.0` or higher (Tested on `v22.9.0`)
* **NPM**: `v9.0.0` or higher (Tested on `10.8.3`)
* **Internet Connection**: Required for Gemini API endpoints (if running in real mode).

---

## 🛠️ Environmental Settings Configuration

Both the frontend and backend require `.env` configurations. We provide template `.env.example` configurations in their respective directories.

### 1. Backend Environment Setup (`backend/.env`)
Create a `.env` file inside the `backend` folder and populate it with:
```env
# Server Port Configuration
PORT=5000
NODE_ENV=development

# Gemini API Key (Obtain a free key from https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Connection String (Optional)
# Leave blank to automatically activate the Zero-Dependency Local File fallback database
MONGODB_URI=

# Redis Configuration (Optional)
# Leave blank to automatically activate the sequential in-memory task runner emulator
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. Frontend Environment Setup (`frontend/.env.local`)
Create a `.env.local` file inside the `frontend` folder:
```env
# Gateway API Coordinators
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Step-by-Step Quick Start

From the root workspace directory, run these simple routines to get the entire ecosystem up and running:

### Step A: Download All Package Dependencies
We configure concurrently to download npm packages for root, frontend, and backend folders with a single command:
```bash
npm run install:all
```

### Step B: Build the Services for Verification
Ensure both TypeScript modules compile perfectly in production mode:
```bash
npm run build
```

### Step C: Boot the Development Clusters
Concurrently launch both servers in watch modes:
```bash
npm run dev
```
* **Frontend Portal**: Navigate to [http://localhost:3000](http://localhost:3000) inside your browser.
* **Backend API Gateway**: Open [http://localhost:5000/health](http://localhost:5000/health) to inspect health check logs.

---

## 🌟 Premium Features Showcase

Explore the premium features pre-engineered into VedaAI:

> [!NOTE]
> **📝 Interactive Live WYSIWYG Editor**
> Double-click any text block (Headers, Questions, Options, or Solutions) on the generated exam sheet output to enter **Edit Mode**. Edits are updated and hot-saved instantly back to either MongoDB or the Local JSON Fallback database!

> [!TIP]
> **🪄 Scoped Single-Question Re-rolling**
> Unsatisfied with a specific question? Click the `🪄 Re-roll` action badge next to it. The system contacts Gemini with the question context, difficulty weight, and marks value to generate and replace that question—and its answer key entry—without rebuilding the entire paper!

> [!IMPORTANT]
> **🟦 Client-Side Vector MS Word (`.doc`) Exporter**
> Teachers can export fully structured exams (complete with blank student credential underlines, section headings, difficulty badges, and examiner solutions sheets) directly into Microsoft Word documents, completely formatted and ready for official printouts—with zero external package bloat!

> [!IMPORTANT]
> **🖨️ Glassmorphism Print Layouts**
> Clicking **"Download as PDF"** opens a premium modal window. Choose whether to print **With Answers** (for grading examiners) or **Without Answers** (for classrooms). Advanced `@media print` rules instantly strip sidebars, banner widgets, and solutions, restructuring page-breaks for a standard physical exam paper.

---

## 📂 Project Directory Structure

```text
VedaAI-FullStack/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route logic handlers (Assignments, Re-roller, Toolkit)
│   │   ├── models/           # Mongoose schemas & Typescript interfaces
│   │   ├── queues/           # BullMQ & sequential QueueEmulator queues
│   │   ├── routes/           # REST endpoints
│   │   ├── services/         # AI prompt engines, atomic DBStores
│   │   ├── sockets/          # WebSocket event rooms (Socket.io)
│   │   └── server.ts         # Main gateway bootstrapping
│   ├── uploads/              # Text/PDF uploaded reference storage (.gitkeep)
│   ├── db_fallback.json      # Pre-seeded local fallback database
│   ├── tsconfig.json         # Backend TS settings
│   └── package.json          # Node dependencies
├── docs/                     # Architectural & Page documentation
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages (dashboard, library, groups, toolkit)
│   │   ├── components/       # Scoped layout parts (Sidebar, Glassmorphic Headers)
│   │   ├── store/            # Zustand global client-side store
│   │   ├── types/            # App interfaces
│   │   └── utils/            # Helper formats
│   ├── public/               # Asset logos & icons
│   ├── next.config.ts        # Next.js configurations
│   └── package.json          # Frontend packages
├── package.json              # Concurrently root script coordinator
└── README.md                 # Project homepage
```
