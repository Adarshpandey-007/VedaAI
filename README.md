# VedaAI – AI Assessment Creator (Full-Stack Challenge)

Welcome to the **VedaAI AI Assessment Creator**! This application is built as part of the Full-Stack Developer recruitment challenge. It allows teachers to create assignments, upload reference materials, configure dynamic question types, and generate structured school examination question papers using cutting-edge AI engines.

---

## 🎨 Figma-to-Code Pixel Perfect Replication
The frontend layout has been crafted using **pure Vanilla CSS Modules** to strictly match the visual aesthetics from the Figma files:
- **Glowing Accent Theme**: Leveraging custom Outfit & Inter typography with HSL Tailored color variables and custom shadows matching the orange-red button borders (`#FF4E20`).
- **Dynamic Creation Form**: Features interactive sliders, file upload dotted zones, dynamic question row aggregates (count + marks calculated live), and voice feedback widgets.
- **CBSE Examination Print Layout**: Output exams render standard CBSE school headers, student credentials panels, difficulty tags, and toggleable Examiner Answer Keys.
- **Full Responsive UX**: Adapts to mobile devices using a dark floating bottom navigation tab bar matching standard application panels.

---

## 🏗️ High-Level System Architecture

```text
               +----------------------------------+
               |  Next.js Frontend (Zustand State) |
               +----------------+-----------------+
                                |
                   (HTTP POST)  |  (WebSocket Live Ticks)
                   Submissions  |  Progress percentages
                                v
               +----------------+-----------------+
               |      Express API Gateway         |
               +--------+----------------+--------+
                        |                |
             (Save Job) |                | (Upsert Records)
                        v                v
      +-----------------+-----+    +-----+--------------------+
      |  Queue Manager        |    | Database Store           |
      |  - BullMQ (Real Mode) |    | - MongoDB (Real Mode)    |
      |  - Emulator (Fallback)|    | - Local JSON (Fallback)  |
      +-----------------+-----+    +--------------------------+
                        |
      (Spawns Workers)  |
                        v
               +--------+-----------------+
               |  Background Worker       |
               +--------+-----------------+
                        |
                        | (Invokes with JSON MimeType)
                        v
               +--------+-----------------+
               |      Gemini 1.5 API      |
               +--------------------------+
```

---

## 🛡️ Dual-Mode Resilience (Zero-Dependency Setup)
To ensure this application runs **instantly** out-of-the-box on your Windows machine without requiring pre-installed system servers, we engineered an intelligent **Dual-Mode Repository & Queue Fallback**:

1. **Database Layer (MongoDB Fallback)**: On boot, the server attempts connection to your MongoDB URI. If omitted or unreachable, it dynamically falls back to a **Local File Store Repository** (`backend/db_fallback.json`). All CRUD actions (create, delete, list) write to this local file using atomic asynchronous locks.
2. **Task Queue Layer (Redis & BullMQ Fallback)**: The background worker attempts connection to your Redis coordinates. If offline, it activates our custom **In-Memory Sequential Queue Emulator** (`QueueEmulator`). Jobs are enqueued in Node's async event loop, executing AI routines and broadcasting WebSockets updates identically to BullMQ!

*If your local MongoDB and Redis instances are running, the server connects normally using Mongoose and BullMQ.*

---

## 🤖 AI Prompt Structuring Engine
We configure the **Gemini 1.5 Flash** model with deep system instructions to produce structured educational papers. We specify the requested question distributions, difficulty partitions (Easy / Moderate / Hard), and integrate extracted terms from your uploaded reference files.

- **Native JSON Generation**: We pass `{ responseMimeType: "application/json" }` configuration parameters to the Gemini API. This instructs the model's native syntax parser to return a raw, validated JSON string, eliminating markdown block wrappings and making parsing 100% reliable.
- **Fail-Safe Mock Engine**: If no `GEMINI_API_KEY` is provided, the service activates an educational mock generator that compiles structured CBSE exams in real-time, letting you verify the Socket progress overlay and printable pages immediately.

---

## 🚀 Getting Started & Setup Guide

### 1. Configure Environmental Settings
Create a `.env` file in the `backend` directory:
```env
PORT=5000
NODE_ENV=development

# Gemini API Key (Obtain a free key from https://aistudio.google.com)
GEMINI_API_KEY=your_key_here

# MongoDB Connection String (Optional - defaults to fallback JSON file)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/veda_db

# Redis Connection (Optional - defaults to fallback Queue Emulator)
REDIS_HOST=localhost
REDIS_PORT=6379
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 2. Fast-Install All Folders
From the workspace root directory, run:
```bash
npm run install:all
```
*This concurrently downloads npm packages for root, frontend, and backend folders.*

### 3. Spin Up Development Servers
Launch both servers concurrently:
```bash
npm run dev
```
- **Frontend Panel**: Open `http://localhost:3000` to access the main Teacher Dashboard.
- **Backend API**: Accessible at `http://localhost:5000`.

---

## 🎁 Bonus Features Included (High Signal)

1. **High-Fidelity PDF Vector Print**: We designed modular CSS print pipelines (`@media print` rules inside `globals.css`). Clicking **"Download as PDF"** centers A4 printable pages, scales exam lines, and strips out sidebar navigations and action overlays, outputting high-resolution vector files using the browser's native engine.
2. **Interactive Speech Mockup**: Click the **Microphone Icon** next to the Additional Instructions textarea. It launches a glowing pulse animation and automatically drafts a structured science lesson search query.
3. **Teacher Portal HUD Analytics**: The homepage is styled as a premium dashboard portal showing live assessment volumes, active enqueued workers, and total marks metrics.
4. **Examiner Solution Key**: Generated outputs append a separate Answer Key drawer block. Teachers can click **"Show Full Solutions"** to expand step-by-step guidelines for scoring.
