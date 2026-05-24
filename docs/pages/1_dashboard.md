# Page Specification: Home Dashboard Portal

A consolidated portal serving as the centralized command center for teachers, displaying statistics, enqueued job status, and quick AI tools.

---

## 💡 Teacher Perspective (Occupational Pains Solved)
- **Problem**: Teachers waste time navigating multiple panels to check if their exam papers have finished generating, or how many assessments are due.
- **Solution**: The dashboard aggregates all metrics in a single landing card view. Active enqueued worker tasks show live compilation percentages directly in their recent card rows, keeping teachers updated instantly.

---

## 🎨 Visual Layout & UI Specifications (Figma Grid)
- **Greeting Card**: Solid charcoal slate container (`#1E293B`) presenting a clean white title: *"Welcome back, John Doe"*. Accompanying button `+ Create Assignment` rendered in glowing high-contrast HSL orange (`#FF4E20`) with smooth hover scales.
- **Statistic Widgets Row**: Four-column responsive grid displaying cards:
  - Card 1: Total Assessments volume (Indigo themed, rounded).
  - Card 2: Completed Papers count (Emerald themed).
  - Card 3: Active background jobs queue (Orange themed).
  - Card 4: Cumulative Marks generated (Blue themed).
- **Operations Split Panel**:
  - **Left (66% width)**: "Recent Generation Jobs" card, listing the top 4 latest assignments, complete with creation date, card title, status pill badge (e.g. `completed` or `Generating (90%)`), and a chevron navigability icon.
  - **Right (33% width)**: "AI Teacher's Toolkit" menu presenting specialized assistant cards (e.g. Lesson Plan Wizards, Rubrics Aggregators) complete with tab indicators.

---

## 🗄️ Zustand State Store Information (Global State Map)

The Home Dashboard binds directly to our global store properties to maintain immediate reactivity:

### 1. Selected Store Properties
- `assignments` (`IAssignment[]`): Selected to count total assessments, compute completed papers count (`assignments.filter(a => a.status === 'completed').length`), count active background queue jobs (`status === 'processing' || status === 'pending'`), and sum up cumulative marks.
- `generationProgress` (`number`): Renders the live percentage text on enqueued jobs cards.
- `generationStatusText` (`string`): Feeds the status pill text during active runs.

### 2. Selected Store Actions
- `fetchAssignments` (`() => Promise<void>`): Invoked inside a `useEffect` mount hook to sync the latest runs from Mongoose or the JSON fallback database.

### 3. WebSocket / Socket.io Store Triggers
- **Trigger event `assignment_progress`**: Updates the targeted card's progress percentage and status variables in the `assignments` array, rendering live status pills (`Generating (25%)` -> `Generating (90%)`) instantly without refreshing.
- **Trigger event `assignment_completed`**: Triggers state mutations, changing the status of the target assignment card in the `assignments` array to `'completed'` and enabling redirect views.

---

## 🔌 E2E Backend & Prompt Pipelines
- **Express Handshake**: Resolves via `GET /api/assignments` which queries the locked storage database (Mongoose Atlas or JSON file fallback) and returns a list array sorted by creation date descending.
- **Concurrency Support**: Supports background jobs without thread blockages. The dashboard continues to serve requests cleanly while enqueued workers run LLM prompts.
