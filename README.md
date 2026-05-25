# 🌟 VedaAI – AI Assessment Creator (Full-Stack Engineering Challenge)

Welcome to the **VedaAI AI Assessment Creator**! This application is engineered as the ultimate Full-Stack recruitment challenge submission for VedaAI. It enables teachers to effortlessly compile CBSE or NCERT school-standard examination question papers, manage assignments, extract material references, and customize AI-generated output with zero friction.

---

## 🎨 Figma-to-Code Pixel Perfect Replication
The interface is designed strictly to mirror the Figma specifications, using **pure Vanilla CSS Modules** for layout formatting:
* **Glowing Modern Dark Accents**: Custom integrations of `Outfit` and `Inter` typography from Google Fonts, harmonized with dynamic HSL-tailored orange-red accents (`#FF4E20`) and glassmorphic panels.
* **Intelligent Assessment Form**: Features drag-and-drop dotted zones for file uploads, live aggregating question tables (counts and marks computed in real-time), and vocal instructions helper widgets.
* **Official CBSE Examination Canvas**: The output views print physical A4 CBSE examination grids, student credentials sections, color-coded difficulty tags, and a toggleable Examiner Answer Key.
* **Full Fluid Responsive UX**: Fluidly adjusts to tablets and mobile sizes, utilizing floating responsive dark bottom bars.

---

## 🏗️ Decoupled System Architecture

```text
               +--------------------------------------+
               |   Next.js Frontend (Zustand Store)   |
               +------------------+-------------------+
                                  |
                     (HTTP POST)  |  (WebSocket Live Ticks)
                     Submissions  |  Progress percentages
                                  v
               +------------------+-------------------+
               |       Express API Gateway            |
               +----------+----------------+----------+
                          |                |
               (Save Job) |                | (Upsert Records)
                          v                v
        +-----------------+-----+    +-----+--------------------+
        |   Queue Manager       |    |   Database Store         |
        |   - BullMQ (Real Mode)|    |   - MongoDB (Real Mode)  |
        |   - Emulator (Fallback)|   |   - Local JSON (Fallback)|
        +-----------------+-----+    +--------------------------+
                          |
        (Spawns Workers)  |
                          v
                 +--------+------------------+
                 |    Background Worker      |
                 +--------+------------------+
                          |
                          | (Invokes with JSON MimeType)
                          v
                 +--------+------------------+
                 |   Gemini 3.5 Flash API    |
                 +---------------------------+
```

---

## 🛡️ Zero-Dependency Dual-Mode Resilience

To ensure that this assignment runs **instantly** out-of-the-box on your local machine without requiring pre-installed infrastructure clusters, we engineered an intelligent **Dual-Mode Architecture Failover**:

> [!IMPORTANT]
> **Database Auto-Failover (MongoDB / File Store)**
> On boot, the server attempts a Mongoose connection. If the `MONGODB_URI` environment variable is omitted or unreachable, it dynamically falls back to an **Atomic File Storage Repository** (`backend/db_fallback.json`). Data reads/writes are secured using `async-lock` mutexes alongside memory-caching buffers to block concurrent anomalies!

> [!IMPORTANT]
> **Queue Auto-Failover (Redis & BullMQ / Queue Emulator)**
> The background worker attempts to connect to Redis. If Redis is offline or omitted, it instantly launches our custom **In-Memory Sequential Queue Emulator** (`QueueEmulator.ts`). Jobs are enqueued in Node's async event loop, executing Gemini generations and broadcasting progress updates identically to BullMQ!

---

## 🤖 Gemini AI Prompt Optimization

We configure **Gemini 3.5 Flash** with deep CBSE blueprints to compile professional examination papers:
* **Native JSON Schema Generation**: We pass the `{ responseMimeType: "application/json" }` configuration parameter to the Gemini API, forcing it to return a raw, validated JSON string, eliminating markdown block wrapping and making parsing 100% reliable.
* **Pre-Seeded Offline Mode**: We pre-seeded `db_fallback.json` with a beautiful sample CBSE paper based on a real textbook context. This allows you to evaluate the platform's outputs, interactive tools, and print templates **immediately on boot**, even without setting up a Gemini API Key!

---

## 🚀 Quick Start Guide

### 1. Configure Environments
Create a `.env` file in the `backend` directory:
```env
PORT=5000
NODE_ENV=development

# Gemini API Key (Obtain a free key from https://aistudio.google.com)
GEMINI_API_KEY=your_key_here

# MongoDB Connection String (Optional - defaults to fallback JSON file)
MONGODB_URI=

# Redis Connection (Optional - defaults to fallback Queue Emulator)
REDIS_HOST=localhost
REDIS_PORT=6379
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 2. Install Packages
From the root workspace directory, run:
```bash
npm run install:all
```
*This concurrent command downloads all npm packages for the root, frontend, and backend folders.*

### 3. Build Codebases
Verify that the TypeScript build succeeds:
```bash
npm run build
```

### 4. Boot Dev Servers
Concurrently launch both servers:
```bash
npm run dev
```
* **Frontend Portal**: Open [http://localhost:3000](http://localhost:3000)
* **Backend API Gateway**: Accessible at [http://localhost:5000](http://localhost:5000)

---

## 🎁 Premium Features Showcase (High-Signal Bonuses)

1. **📝 Interactive Live WYSIWYG Editor**:
   * Double-clicking or clicking "Edit Mode" on any generated assignment transforms headers, question statements, marks, options, and solutions into live inputs. Changes are auto-saved back to the active database in real-time!
2. **🟦 Native Microsoft Word (`.doc`) Exporter**:
   * Features a client-side HTML-to-Word vector converter. With a single click, teachers can export fully formatted CBSE papers (including exam headers, section layouts, and answer keys) directly into MS Word files—with zero package bloat!
3. **📊 Animated SVG Analytics & Stats Dashboard**:
   * Built responsive, raw SVG visual metrics rendering class performance donut charts, animated bar charts, and administrative hours-saved gauges.
4. **🪄 Scoped Gemini Single-Question "Re-roller"**:
   * If a teacher is unsatisfied with a specific question, clicking the `🪄 Re-roll` action badge next to it invokes a specialized backend Gemini API endpoint to swap it out with a new NCERT-compliant question matching the same marks and difficulty.
5. **🖨️ Glassmorphism Print Layout preferences**:
   * Choose whether to print **With Answers** (for grading examiners) or **Without Answers** (for students). CSS `@media print` rules instantly strip sidebars, buttons, and restructure margins for perfect page-breaking.
6. **🔒 Thread-Safe fallback database (`AsyncLock` + Memory Caching)**:
   * Secures `db_fallback.json` from write collisions, guaranteeing absolute stability in zero-install reviews.
7. **🗣️ Interactive Speech Mockup**:
   * Clicking the microphone icon next to the instructions card triggers an audio wave pulse to voice-type lesson prompts.
8. **🛠️ Modern `pdf-parse` Class Compatibility**:
   * Modernized PDF reference uploads to correctly utilize named `{ PDFParse }` class instantiations, unlocking high-speed text extraction for extremely large PDF uploads on the backend server.
