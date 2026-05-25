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
               |   Gemini 3.5 Flash API   |
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
We configure the **Gemini 3.5 Flash** model with deep system instructions to produce structured educational papers. We specify the requested question distributions, difficulty partitions (Easy / Moderate / Hard), and integrate extracted terms from your uploaded reference files.

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

---

## 🎁 Bonus Features Included (High Signal)

1. **📝 Interactive Live WYSIWYG Editor**:
   * Double-clicking or clicking "Edit Mode" on any generated assignment transforms sections, questions, marks, options, and solution sheets into editable fields. Edits are hot-saved back to either MongoDB Atlas or the JSON fallback database on the fly!
   * The AI Teacher's Toolkit includes a dual-pane live Markdown split editor so you can customize lesson plans or rubrics while previewing them in real-time.
2. **🟦 Native Microsoft Word (`.doc`) Exporter**:
   * Built a client-side vector HTML-to-Word converter. With one click, teachers can export structured exams (complete with CBSE headers, student info tables, Section partitions, and solution keys) directly into MS Word format for school template customization—with zero external package bloat!
3. **📊 Animated SVG Analytics & Stats Dashboard**:
   * Designed premium, responsive raw SVG components to visualize active teacher workloads:
     * **Difficulty Donut Chart**: Renders dynamic, glowing HSL curves representing easy/moderate/hard ratios.
     * **Syllabus Coverage Bar Chart**: Shows animated histograms representing core subject densities.
     * **Time Saved Ticker**: Calculates administration writing hours saved in real-time based on your generation volume.
4. **🪄 Scoped Gemini Single-Question "Re-roller / Refiner"**:
   * Made every single question in the generated paper editable on a granular level. Clicking the `🪄 Re-roll` action next to a question calls a specialized backend Gemini API endpoint to replace it with a new NCERT-compliant item matching the target marks and difficulty.
5. **🔒 Concurrent Database Concurrency Security (`AsyncLock` + Memory Caching)**:
   * Programmed an asynchronous mutex lock (`fileLock`) and memory cache buffer (`cachedData`) in `DBStore.ts` to coordinate simultaneous worker and route actions on `db_fallback.json`. Safely blocks write collisions and completely eliminates local database parsing wipeouts.
6. **🖨️ Glassmorphism Print Preferences Modal**:
   * Click **"Download as PDF"** to trigger a beautiful modal. Choose **"Print WITH Answers"** or **"Print WITHOUT Answers"** to dynamically restyle the entire page layout for student distribution using custom `@media print` rules.
7. **🛠️ Modern `pdf-parse` Class Compatibility**:
   * Modernized PDF reference uploads to correctly utilize named `{ PDFParse }` class instantiations, unlocking high-speed text extraction for extremely large PDF uploads on the backend server.
8. **🗣️ Interactive Speech Mockup**:
   * Click the **Microphone Icon** next to the instructions box to launch an animated audio pulse that drafts search prompts on Grade 8 Science NCERT chapters.

