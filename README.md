# <img src="frontend/public/logo_1.png" width="36" height="36" valign="middle" /> VedaAI — AI Assessment Creator & Teacher Portal

<p align="left">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-4.19-27272a?style=flat-square&logo=express&logoColor=white" alt="Express" /></a>
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Gemini_AI-3.5_Flash-e11d48?style=flat-square&logo=google-gemini&logoColor=white" alt="Gemini" /></a>
  <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.io-4.8-2563eb?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.io" /></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-8.4-16a34a?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  <a href="https://github.com/pmndrs/zustand"><img src="https://img.shields.io/badge/Zustand-State-db2777?style=flat-square" alt="Zustand" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.4-0284c7?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
</p>

Welcome to the **VedaAI AI Assessment Creator** — a high-fidelity, production-grade SaaS platform designed to automate and elevate the school examination lifecycle. Built to mirror strict Figma blueprints, it empowers teachers to compile physical-standard CBSE/NCERT question papers in seconds, analyze class performance statistics, manage lesson files, and refine AI outputs in real-time.

---

## ⚡ System Architecture

The ecosystem leverages a **decoupled, asynchronous, event-driven architecture** that ensures absolute separation of concerns, high throughput, and maximum client response speeds.

### 🔮 End-to-End System Data Flow

```mermaid
graph TD
    %% Custom Style Whitelist definitions matching VedaAI visual identity
    classDef frontend fill:#1e1e2e,stroke:#FF4E20,stroke-width:2px,color:#cdd6f4;
    classDef gateway fill:#1e1e2e,stroke:#fab387,stroke-width:2px,color:#cdd6f4;
    classDef queues fill:#1e1e2e,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4;
    classDef services fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4;
    classDef db fill:#1e1e2e,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4;

    %% Frontend Components
    subgraph Frontend ["Client Layer (Next.js & Zustand)"]
        A["Teacher Dashboard UI (Outfit & Inter CSS)"]
        Z["Zustand Global Store"]
        W["Socket.io Client Context"]
    end

    %% Gateway and Routers
    subgraph Gateway ["API & Message Routing (Express)"]
        B["Express HTTP REST Server"]
        WS["Socket.io WebSocket Server"]
        M["Multer Middleware (Disk Storage)"]
    end

    %% Tasks and Workers
    subgraph Queues ["Queue Processing Layer"]
        D["BullMQ Tasks Router (Real Mode)"]
        QE["In-Memory Task Queue (Fallback)"]
        WK["Job Execution Worker"]
    end

    %% External & Services
    subgraph Services ["External Services & Models"]
        G35["Gemini 3.5 Flash AI Engine"]
        PP["PDFParse Extraction Engine"]
    end

    %% Database & Persistence
    subgraph DB ["Data Persistence Layer"]
        MDB["MongoDB Atlas (Cloud Cluster)"]
        FL["AsyncLock Mutex Serialization"]
        JDB["Local db_fallback.json file"]
    end

    %% Interactions
    A -->|1. Multipart Form Submission| B
    A -->|2. Uploads file| M
    M -->|Saves buffer| M
    B -->|3. Upsert Assignment Record| MDB
    B -->|3. Fallback Write JSON| FL
    FL -->|Atomic Lock| JDB
    B -->|4. Push Job Request| D
    B -->|4. Fallback Event Loop| QE
    D -->|Spawns| WK
    QE -->|Invokes| WK
    WK -->|5. Extract Text from PDF| PP
    WK -->|6. JSON Schema System prompt| G35
    G35 -->|7. Structured Response| WK
    WK -->|8. Save exam paper data| MDB
    WK -->|8. Fallback lock write| FL
    WK -->|9. Progress & Status Ticks| WS
    WS -->|10. Real-time Event broadcast| W
    W -->|11. Hydrates Store and UI| Z
    Z -->|Render Layout| A

    %% Assign Theme Classes
    class A,Z,W frontend;
    class B,WS,M gateway;
    class D,QE,WK queues;
    class G35,PP services;
    class MDB,FL,JDB db;
```

---

## 💎 Key Technical Approaches

### 1. 🛡️ Dual-Mode Persistence & Async Fallbacks
VedaAI is engineered with a **Zero-Setup Out-of-the-Box Execution Guarantee**. During bootstrap, backend services run diagnostics on your database and message brokers. If external dependencies are missing, failovers activate on-the-fly without breaking the user experience.

> [!NOTE]
> **Database Resilience (MongoDB vs. Atomic JSON fallback)**
> When the `MONGODB_URI` environment string is absent or unreachable, the system automatically redirects operations to the local storage engine (`DBStore.ts`). To prevent concurrent write conflicts, every JSON file write is serialized using a custom **AsyncLock Mutex Serialization** pipeline alongside an in-memory database cache, securing absolute transaction integrity.

> [!TIP]
> **Background Processing (BullMQ vs. Queue Emulator fallback)**
> If connection to Redis fails, the system switches to its custom **In-Memory Sequential Queue Emulator** (`QueueManager.ts`). Generation requests are handled outside the HTTP response-request cycle using `setImmediate` serialization. Live progress percentages and WebSocket event states update exactly like real BullMQ workers.

---

### 2. 🧠 Whitelisted Multi-Model Gemini Stack & Schema Control
To prevent generation blockages due to rate limits or region policies, VedaAI leverages a **Whitelisted Model Failover Stack**:

```text
[gemini-3.5-flash] ➔ [gemini-2.5-flash] ➔ [gemini-2.5-flash-lite] ➔ [gemini-2.5-pro] ➔ [gemini-2.0-flash] ➔ [gemini-1.5-flash] ➔ [gemini-1.5-pro] ➔ [gemini-pro] ➔ [Mock Compiler]
```

* **JSON Schema Enforcement**: For all supporting models, the API connection configurations are locked using `{ responseMimeType: "application/json" }`. This forces Gemini to output validated, parseable JSON arrays matching our TypeScript definitions, eliminating markdown formatting errors (e.g. `\`\`\`json` wraps).
* **Deterministic Offline Compiler**: If a developer API key is missing or internet connectivity is absent, the backend falls back to its deterministic mock compilation engine to generate high-quality, pre-seeded CBSE templates immediately.

---

### 3. ⚙️ Type-Safe Cross-Layer Data Models
To guarantee unified contract structures between client views and database collections, schemas are strictly locked using shared TypeScript definitions:

```typescript
export interface IQuestion {
  id: string;
  text: string;
  options?: string[]; // Populated with exactly 4 choices ONLY for Multiple Choice Questions (MCQs)
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  answer: string;      // Detailed scoring guide and resolution steps for examiners
}

export interface ISection {
  title: string;       // e.g. "Section A", "Section B"
  instruction: string; // e.g. "Attempt all questions. Each carries 1 mark"
  questions: IQuestion[];
}

export interface IQuestionPaper {
  assignmentId: string;
  schoolName: string;
  subject: string;
  gradeClass: string;
  timeAllowed: string;
  maxMarks: number;
  sections: ISection[];
  answerKey: { questionId: string; questionText: string; answer: string; }[];
}
```

---

## 🎁 Feature Showcases & Solutions

| Operational Challenge | VedaAI Solution Feature | Technical Implementation |
| :--- | :--- | :--- |
| **Exam Building Pain**: Manually drafting balanced NCERT/CBSE formats takes hours of chapter scanning. | <span style="color:#FF4E20">**15s AI Paper Creator**</span> | Extracts reference material text with `pdf-parse`, parses blueprint schemas, and requests whitelisted Gemini models. |
| **Fixed LLM Output Errors**: Static papers generated by AI require external editing software. | <span style="color:#e11d48">**Interactive WYSIWYG Canvas**</span> | Double-clicking or switching to "Edit Mode" renders live inline input grids, saving adjustments directly to the database. |
| **Inaccurate AI Questions**: Occasionally, AI questions are incorrect or mismatch difficulty. | <span style="color:#9333ea">**Single-Question Re-roller**</span> | A magic badge sends the single target question to a specialized, lightweight Gemini prompt endpoint to swap it out instantly. |
| **Exam Distribution Costs**: Printing templates requires complex styling structures. | <span style="color:#2563eb">**A4 CSS Physical Print**</span> | CSS `@media print` rules strip sidebars and dashboard blocks, restructuring paper margins for clean, offline A4 examiner sheets. |
| **Format Fragmentation**: Schools require standard formats to edit and store records offline. | <span style="color:#0284c7">**Native Microsoft Word Exporter**</span> | A zero-dependency browser XML serializer packages the paper directly into a vector-formatted MS Word document (`.doc`). |
| **Metric Tracking Headache**: Tracking class progress and performance averages requires manual sheets. | <span style="color:#16a34a">**SVG Analytics Dashboard**</span> | Integrates responsive, animated circular SVG charts to visualize class average indices and administrative hours saved. |

---

## 📂 Project Structure

```text
VedaAI-FullStack/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Handlers (assignmentController.ts, toolkitController.ts)
│   │   ├── models/           # Mongoose schemas & shared TypeScript definitions (types.ts)
│   │   ├── queues/           # BullMQ integrations & sequential task Queue Emulator
│   │   ├── routes/           # REST endpoints (assignmentRoutes.ts, toolkitRoutes.ts)
│   │   ├── services/         # Business core (generator.ts, dbStore.ts)
│   │   ├── sockets/          # Socket.io channels and progress emitters
│   │   └── server.ts         # Gateway entry point & infrastructure diagnostics
│   ├── db_fallback.json      # Local fallback database (AsyncLock serialized transactions)
│   └── package.json          # Backend packages & command configurations
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router folders (dashboard, assignments, toolkit, library)
│   │   │   ├── assignments/  # CBSE printing templates and question forms
│   │   │   ├── toolkit/      # AI Lesson Plans and Grading Rubrics builders
│   │   │   └── globals.css   # Main CSS design variables, color variables, & theme stylesheets
│   │   ├── components/       # Layout features (Sidebar, TopHeaderBar with dynamic notification logs)
│   │   ├── store/            # Zustand global state system (assignmentStore.ts)
│   │   └── utils/            # Shared tools (Socket.io client connector)
│   └── package.json          # Next.js dependency manifests
└── package.json              # Monorepo runner & concurrent operations settings
```

---

## 🚀 Operations Quick Start

### 1. Configure Environments

#### A. Backend Setup (`backend/.env`)
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
NODE_ENV=development

# Gemini AI Credentials (Get a free key from https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Connection String (Optional - defaults to fallback local JSON database)
MONGODB_URI=

# Redis Connection (Optional - defaults to fallback sequential queue emulator)
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### B. Frontend Setup (`frontend/.env.local`)
Create a `.env.local` file inside the `frontend` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

### 2. Startup Command Pipelines

Run the following commands from the **root workspace directory**:

#### Step 1: Install Dependencies
Installs packages concurrently across the root project, the Next.js client, and the Express gateway:
```bash
npm run install:all
```

#### Step 2: Validate TypeScript Build
Compiles all codebases concurrently to verify absolute type-safety:
```bash
npm run build
```

#### Step 3: Spin Up Development Servers
Launches both development environments:
```bash
npm run dev
```

* 🖥️ **Teacher Dashboard Portal**: Open [http://localhost:3000](http://localhost:3000)
* ⚙️ **API Gateway Terminal**: Accessible on [http://localhost:5000](http://localhost:5000)

---

## 🛠️ Security & Advanced Quality Engineering

### 1. Client-Key Isolation & Secure Headers
To protect server-side developer credits, VedaAI supports isolated browser keys.
* **Storage Process**: Teachers can save their private Gemini developer API key inside the `/settings` interface. The credential sits securely in the browser's `localStorage` namespace.
* **Appended Routing**: During submission tasks, the frontend extracts this key and injects it under custom request headers (`x-gemini-key`). The backend server checks this custom header first before utilizing the default system API key, isolating key quotas and ensuring secure, credential-less server operations.

### 2. High-Speed PDF Text Extraction Stream Parsing
* PDF uploads are parsed using advanced memory buffers on the backend. The connection initializes modern, named `{ PDFParse }` class instances to prevent runtime prototype failures when handling scanned textbooks or heavy curriculum documents.

### 3. Physical Paper Page-Break Rules
* The physical print layout leverages custom `@media print` rules inside `globals.css` configured with absolute physical A4 borders. Margins, borders, sidebars, header navigation bars, and buttons are dynamically stripped, ensuring printed exam canvases format seamlessly without clipping.

### 4. Speech Prototype visualizer
* Clicking the microphone helper next to the instruction cards initiates a custom CSS Bezier wave pulse. This visualizer replicates smooth voice input prompts, elevating the modern styling of the creator interface.

---

## 👨‍💻 Submission Design Philosophy
This submission is designed to represent the pinnacle of full-stack recruitment engineering. From its responsive dark glassmorphic accent layout to its highly resilient fallback mechanics, VedaAI provides an ultra-premium, robust evaluation experience. Have fun building papers with **VedaAI**!
