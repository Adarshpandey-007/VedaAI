# Setup & Getting Started Guide

Follow this guide to install dependencies, configure environment variables, and run both the Frontend and Backend servers.

---

## Prerequisites
- **Node.js**: v18.0.0 or higher (Your version: `v22.9.0`)
- **NPM**: v9.0.0 or higher (Your version: `10.8.3`)

---

## Configuration Variables (.env)

We provide `.env.example` templates in both `frontend` and `backend` directories. Here are the core variables you need to configure:

### Backend Configuration (`backend/.env`)
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
NODE_ENV=development

# Gemini API Key (Required for real AI generation)
# Obtain a free key from https://aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Settings (Optional)
# If omitted or connection fails, the server uses a local JSON fallback file automatically.
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/veda_db

# Redis Settings (Optional)
# If omitted or connection fails, the server uses an in-memory queue emulator.
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend Configuration (`frontend/.env`)
Create a `.env` file inside the `frontend` folder:
```env
# URL of the Backend Express Server
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Quick Start (Run Both Frontend & Backend)

From the root workspace folder:

### Step 1: Install All Dependencies
This command uses concurrently to download npm packages for root, frontend, and backend folders:
```bash
npm run install:all
```

### Step 2: Start Development Servers
This runs both servers concurrently. The backend will watch for TS edits, and frontend will boot Next.js in hot-reloading mode:
```bash
npm run dev
```

- **Frontend**: Runs on `http://localhost:3000`
- **Backend API**: Runs on `http://localhost:5000`

---

## Architectural Features Showcase

1. **📝 Interactive Live WYSIWYG Editor**: Click **"Edit Mode"** on any generated exam paper to change titles, instructions, marks, options, or answer keys. All edits hot-save automatically back to your active database!
2. **🟦 Microsoft Word (`.doc`) Export**: Seamlessly download exam papers and lesson plans into native `.doc` files formatted for direct use in MS Word.
3. **📊 Animated SVG Analytics Dashboard**: Rich visual indicators (donut charts, bar charts, and efficiency counters) rendering live stats from Zustand.
4. **🪄 Scoped Question Re-roller**: Granular replacement of individual questions. Click the `🪄 Re-roll` icon beside a question to swap it instantly in both the paper and answer key via the Gemini API.
5. **🖨️ Glassmorphism Print preferences Modal**: Triggers elegant popup selections to print papers with or without solutions.
6. **🔒 Thread-Safe fallback database (`AsyncLock` + Cache buffer)**: Coordinates concurrent server operations, guaranteeing that `db_fallback.json` will never be corrupted or reset.
7. **🛠️ Modern `pdf-parse` Class Compatibility**: Handles extremely large PDF reference uploads swiftly on the backend server.
8. **Upload Section**: Drop files (JPEG, PNG, PDF, TXT) and let the AI process terms and criteria directly.
9. **Form Aggregator**: Dynamic form tables allow addition/deletion of question rows, with marks and counts aggregated automatically.
10. **Queue HUD**: Submission kicks off a real-time progress monitor HUD using WebSockets, rendering active percentages: `Structuring Paper Layout...` -> `Formulating Section A Questions...` -> `Saving Output...` -> `Completed`.
11. **Answer Key Drawer**: The Output view has a dedicated, expandable Answer Key section showing comprehensive guidelines for examiners.
12. **Print Layout**: Download PDF triggers standard page-size breaking and hides system menus to print clean CBSE-style physical exam sheets.
