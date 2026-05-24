# VedaAI Educational SaaS Platform: Complete Page & Product Handbook

This handbook documents the visual architecture, user operation workflows, E2E technical flows, and **solutions to key teacher pain points** for every page in the VedaAI ecosystem.

---

## 🛡️ Solved Pain Points (The "Why" & The "Pain" Operations)

Teaching is one of the most resource-intensive professions. VedaAI is designed specifically to eliminate the core operational "pains" teachers experience daily:

1. **The Exam Compilation Pain**: Drafting high-quality CBSE-standard question papers takes hours of researching textbook chapters, balancing difficulty distributions, and writing answer keys. 
   - *VedaAI Solution*: Standardizes inputs via a dynamic builder and uses Gemini 2.5 Flash-Lite to compile structured question papers and examiner scoring keys in 15 seconds.
2. **The Metric Tracking Pain**: Calculating class average performance scores and monitoring enqueued tasks requires tedious spreadsheet entries.
   - *VedaAI Solution*: Automatically aggregates student records and renders real-time circular SVG dashboard progress graphs.
3. **The Deployment Pain**: Setting up database connections (MongoDB) and cache task managers (Redis) locally can crash applications and frustrate developers.
   - *VedaAI Solution*: Pre-wires intelligent local file-based database stores (`db_fallback.json`) and event-driven sequential Queue Emulators, guaranteeing 100% platform availability out-of-the-box.

---

## 📂 Page-by-Page Comprehensive Blueprint

```carousel
### 1. Home Dashboard Portal
Visual representation of statistics, quick toolkit actions, and recent E2E jobs.
<!-- slide -->
### 2. Assignments List
Zero-state and filled-state list boards managing completed and processing papers.
<!-- slide -->
### 3. Create Assignment Form
Dotted drag-and-drop reference uploads, question constructors, and Voice Typing mocks.
<!-- slide -->
### 4. CBSE Question Paper Output
A4 printable sheets, dynamic difficulty tags, and expandable answers drawers.
<!-- slide -->
### 5. My Groups Portal
SVG circular class averages, student metrics, and creation modals.
<!-- slide -->
### 6. AI Teacher's Toolkit
Generative lesson planners, rubrics table compilers, and classroom activity wizards.
<!-- slide -->
### 7. My Library cabinet
Repository folders and searchable datagrids managing textbooks and notes.
<!-- slide -->
### 8. Settings Panel
School customizers, default exam time variables, and Local Storage API Key managers.
```

---

### 1. Home Dashboard Portal (`/`)

#### A. Visual Layout & UI Elements
- **Greeting Banner**: Wide, deep navy card (`#1E293B`) presenting a clean Outfit welcome message: *"Welcome back, John Doe"*. Features a glowing orange-red `+ Create Assignment` button on the right.
- **Analytics Row**: Four glassmorphic stats cards detailing:
  - Total Assessments (Purple badge)
  - Completed Papers (Green badge)
  - Active AI Jobs (Orange badge)
  - Cumulative Marks Generated (Blue badge)
- **Main Dashboard Split**:
  - **Left (2/3 width)**: "Recent Generation Jobs" card table listing latest papers, creation timestamps, and live progress pills (e.g. `completed` or `Generating (90%)`).
  - **Right (1/3 width)**: "AI Teacher's Toolkit" quick actions list with cartoonish vector indicators (e.g., CBSE Prompt Generator, Dynamic Rubrics).

#### B. User Operation Workflow
1. The teacher logs into the dashboard to check overall status.
2. They click the `+ Create Assignment` button inside the banner to launch a new exam build.
3. They review the "Recent Generation Jobs" list to see completed or generating papers and click any active row to enter their printable output views.

#### C. Technical E2E Pipelines
- **Data Flow**: On component mount, Next.js calls `fetchAssignments()`. Mongoose retrieves documents from MongoDB Atlas, sorting them by creation timestamp, and hydrates the Zustand global state.
- **WebSocket Ticks**: The page establishes connection to Socket.io and listens for background generation steps, dynamically updating stats cards and progress badges in the grid in real-time.

---

### 2. Assignments List Dashboard (`/assignments`)

#### A. Visual Layout & UI Elements
- **Header**: Active green indicator dot next to the "Assignments" title, accompanied by an orange total counter badge and a secondary `+ Create Assignment` button.
- **Filters Utility Bar**: A search input wrapper with a search glass icon, and a dropdown selector ("Filter By: All Statuses, Completed, Generating, Failed").
- **Grid Datagrid**:
  - **0-State (Empty runs)**: Magnifying glass vector with a red X badge, showing *No assignments yet* title, description, and an empty-run trigger button.
  - **Filled-State (Grid)**: Rounded cards presenting the paper title, assigned/due dates, total questions/marks count, and three-dots settings menus.
  - **Dropdown Menu**: Pops up when three-dots are clicked, showing: `View Assignment` (routes to paper output) and `Delete` (removes assignment).
- **Float Control**: A circular floating button in the bottom-right corner representing `+` that routes to `/assignments/new`.

#### B. User Operation Workflow
1. The teacher filters their list by selecting a status (e.g., "Generating") or typing a term into the search bar.
2. They click three-dots on a completed card to view the paper, or delete it, triggering a browser confirmation modal.

#### C. Technical E2E Pipelines
- **WebSocket Subscriptions**: When the dashboard mounts, Next.js loops through all fetched assignments. For any card showing a status of `'processing'` or `'pending'`, the socket manager automatically emits `join_assignment_room` to synchronize live updates.
- **API Handler**: Clicking delete triggers a `DELETE /api/assignments/:id` Express endpoint. Mongoose deletes both the Assignment document and its corresponding generated QuestionPaper document, emitting structural updates.

---

### 3. Create Assignment Form (`/assignments/new`)

#### A. Visual Layout & UI Elements
- **Breadcrumbs Header**: Curved back arrow pointing to the Assignments list.
- **Form Card**: A large white container (`border-radius: 24px`) containing:
  - **Dotted Dropzone**: Upload area for notes/textbooks with limits helper (*JPEG, PNG, TXT upto 10MB*). Appends a green file indicator bar once uploaded.
  - **Due Date Field**: HTML5 calendar selector.
  - **Question Type Aggregator**: Interactive rows consisting of a question category selector (e.g., Short Questions, Numericals), decrement/increment buttons for counts/marks, and delete icons.
  - **Microphone Texarea**: Additional instructions field containing a **Microphone Icon** on the right side.
- **Submit Controls**: Left-aligned "Previous" button and right-aligned glowing "Next &rarr;" button.

#### B. User Operation Workflow
1. The teacher enters the title and drags reference notes into the dropzone.
2. They configure question types (e.g., click `+` to add a Short Questions row, increment to 5 questions, and set marks to 2). The aggregates (*Total Questions: 5, Total Marks: 10*) adjust live at the bottom.
3. They click the **Microphone Icon** to auto-type instructions and click **Next &rarr;**.

#### C. Technical E2E Pipelines
- **Data Packaging**: Submitting compiles a `multipart/form-data` package containing the text fields, question configuration arrays, and the uploaded file buffer.
- **Queue Handshake**: The Express endpoint `/api/assignments` processes the files via Multer, saves the Assignment record in Mongoose, and enqueues a background job in `QueueManager` (BullMQ or QueueEmulator).
- **Instant Redirect**: Next.js redirects the teacher **immediately** to the dashboard `/assignments`, where the newly enqueued card shows its live percentage bar!

---

### 4. Question Paper Output Page (`/assignments/[id]/output`)

#### A. Visual Layout & UI Elements
- **AI Banner**: Dark Slate blue banner (`#1E293B`) presenting the AI assistant confirmation text: *"Certainly! Here is your optimized question paper..."* and a wide `Download as PDF` button.
- **A4 Physical Exam Card**: Replicates CBSE exam papers:
  - Centered institutional details: *Delhi Public School, Sector-4, Bokaro*.
  - Subject, grade, and metadata row (*Time Allowed: 45 minutes, Maximum Marks: 60*).
  - Blank underlines for Name, Roll Number, and Section.
  - Section dividers (Section A, Section B...) with specific instructions.
  - Numbered list of questions with custom badges showing difficulty (`Easy`, `Moderate`, `Hard`) and marks tags.
- **Solutions Drawer**: An expandable section at the bottom showing detailed examiner solutions.

#### B. User Operation Workflow
1. The teacher reviews the generated questions and difficulty balances.
2. They click `Show Full Solutions` to verify that the generated answer key is correct.
3. They click `Download as PDF`. The browser print dialog pops up showing a formatted, centered exam sheet ready to print or save as a vector PDF.

#### C. Technical E2E Pipelines
- **JSON Cleansing & Parsing**: The worker retrieves the Gemini 2.5 Flash-Lite API response. Our custom cleansing engine strips any markdown block enclosures (`\`\`\`json` and `\`\`\``) and parses the text into our strict CBSE QuestionPaper schema.
- **Print Overrides**: Standard print stylesheets (`@media print` rules inside `globals.css`) strip the Sidebar, dark banner, buttons, and solutions drawer, centering and adjusting the paper boundaries for physical print.

---

### 5. My Groups Portal (`/groups`)

#### A. Visual Layout & UI Elements
- **Grid Layout**: Responsive list of student groups. Each class is represented by a curved white container (`border-radius: 20px`).
- **Student Stats Badge**: Displays total students (e.g. `32 Students`) and active assigned exams (e.g. `3 Active Exams`).
- **Circular SVG Score Progress**: Renders a premium, animated SVG circle gauge showing the class average performance (e.g., `84%` in high-glow orange).
- **Interactive Trigger**: Top-right `+ Create Group` button that spawns an overlay modal form.

#### B. User Operation Workflow
1. The teacher monitors general performance indexes.
2. They click `+ Create Group`. A modal asks for Class Name (e.g. *Class 10th*), Section (*Section B*), Subject (*Physics*), and Student Count (*35*). They click submit, and the new card appears in the grid.

#### C. Technical E2E Pipelines
- **Dynamic SVGs**: The circle progress circle uses CSS `stroke-dasharray` and `stroke-dashoffset` calculated dynamically:
  $$\text{Offset} = \text{Circumference} - \left(\frac{\text{Score}}{100} \times \text{Circumference}\right)$$
  ensuring smooth vector rendering on load.
- **Local Persistence**: Created groups are saved directly to Zustand state and local database stores, linking them to assignment selectors.

---

### 6. AI Teacher's Toolkit (`/toolkit`)

#### A. Visual Layout & UI Elements
- **Wizard Sidebar**: Tabbed choices on the left: *Lesson Planner AI*, *Rubrics Generator*, and *Activity Planner*.
- **Generative Workspace**: Interactive forms on the right (e.g., input Topic: *Photosynthesis*, Grade: *Grade 7*).
- **Real-Time LLM Output Card**: A beautiful, spacious slate container showing markdown-formatted AI lesson plans or tabular rubrics grids, featuring quick `Copy to Clipboard` actions.

#### B. User Operation Workflow
1. The teacher selects *Lesson Planner AI*, enters the topic *"electroplating"* and grade *"Class 8"*, and clicks **Generate Plan**.
2. A progress loader bar shows: *"AI compiling objectives..."*
3. The Markdown lesson plan compiles on the screen, ready to copy or print.

#### C. Technical E2E Pipelines
- **Specialized API Endpoints**: Generates plans via a new endpoint `POST /api/toolkit/generate`.
- **Targeted AI Prompts**: The backend routes a specialized prompt to **Gemini 2.5 Flash-Lite**:
  - For Lesson Plans: Requires strict markdown with bold objectives, timelines, and homework assignments.
  - For Rubrics: Requires a formatted HTML table matching criteria scores.

---

### 7. My Library cabinet (`/library`)

#### A. Visual Layout & UI Elements
- **Folder Drawer Row**: Grid of folder cards with custom colored tabs (e.g., "Term Papers" in orange, "Quizzes" in blue, "PDF Textbooks" in purple).
- **Documents Datagrid Table**: Lists all generated assignments and reference files. Displays a searchable table featuring columns: Document Name, Type, Date Saved, and Action menus.

#### B. User Operation Workflow
1. The teacher clicks the "Term Papers" folder to filter the document list instantly.
2. They search for a specific paper, and click `Open` to route directly to the printable output page.

#### C. Technical E2E Pipelines
- **Data Filtering**: Clicking folders triggers frontend filtering in the Zustand state, updating the rendered Datagrid rows in `0.05 seconds` without requiring page re-requests.

---

### 8. Settings Panel (`/settings`)

#### A. Visual Layout & UI Elements
- **Account / School Details Block**: Form fields to modify School Name (*Delhi Public School*), Branch (*Sector-4, Bokaro*), and default avatars.
- **Key Manager Panel**: Secure password-styled input field showing **"Gemini Developer API Key"** and a toggle eye icon.
- **Defaults Dashboard**: Sets default exam durations (e.g. 45 mins) and grade levels.
- **Theme Selection Cards**: Visual selector cards representing "Sleek Light Mode" (white background) and "Harmonious Dark Mode" (charcoal background).

#### B. User Operation Workflow
1. The teacher updates their school branch details.
2. They paste their new Gemini API key into the secure field and click **Save Settings**.
3. They toggle the theme to Dark Mode. The application colors transition smoothly.

#### C. Technical E2E Pipelines
- **Local Storage API Key Isolation**: The API key is stored securely in the browser's `localStorage` context. When a teacher submits a paper request, Next.js appends this custom key under request headers, allowing their custom developer quota to be utilized directly at the API gateway!
- **Dynamic CSS Variables**: The theme selector changes CSS variables in `globals.css` dynamically (e.g. `--bg-app`, `--bg-card`), triggering immediate visual transitions.
