# Page Specification: Assignment Creator Form

An interactive, step-by-step creation form enabling teachers to upload reference materials, configure question categories, select dates, and launch background AI generators.

---

## 💡 Teacher Perspective (Occupational Pains Solved)
- **Problem**: Configuring question counts and marks manually requires tedious arithmetic to prevent negative or inconsistent values. 
- **Solution**: The form includes reactive increment/decrement counters that automatically sum up *Total Questions* and *Total Marks* dynamically.
- **Voice Typing Pain**: Dictating custom prompts by hand can be slow.
- **Solution**: Includes a glowing Microphone icon that auto-drafts structured prompts upon trigger.

---

## 🎨 Visual Layout & UI Specifications (Figma Grid)
- **Breadcrumbs Header**: Curved back arrow pointing to `/assignments` list dashboard.
- **Progress Line Slider**: Linear progress bar (`height: 4px`) at the top, showing Step 1 (50% progress fill) in orange HSL gradient.
- **Form Canvas**: A spacious white card container presenting:
  - **Dotted Upload Dropzone**: A dashed light gray container (`#F8FAFC`) with a cloud upload icon. Highlights in glowing orange dashed lines upon drag-enter, and renders a green file indicator bar once a file is dropped.
  - **Date Picker**: Input field with calendar selector.
  - **Question Type Aggregator**: Responsive rows featuring a dropdown selector (Multiple Choice, Short Questions, Diagrams, Numericals), decrement `-` and increment `+` counter buttons, and trash delete icons.
  - **Voice Instructions Card**: Textarea with a microphone icon positioned absolutely on the right. Starts a glowing pulse animation on click.
- **Action Controls**: Left outline button *"Previous"* and right glowing dark button *"Next &rarr;"*.

---

## 🗄️ Zustand State Store Information (Global State Map)

### 1. Selected Store Properties
- `isGenerating` (`boolean`): If `true`, spawns a blurred glassmorphic overlay progress HUD in the browser.
- `generationProgress` (`number`): Feeds the percentage counter inside the HUD (`0% -> 100%`).
- `generationStatusText` (`string`): Feeds the status text inside the HUD (e.g., *"Formatting requirements & prompts..."*).
- `activeAssignmentId` (`string | null`): Tracks the ID of the enqueued job currently processing.
- `error` (`string | null`): If a generation fails, the overlay HUD is closed, and this property is loaded to render a red warning banner at the top of the form.

### 2. Selected Store Actions
- `createAssignment` (`(formData: FormData) => Promise<IAssignment>`): Compiles text fields, question config arrays, and local file buffers, and submits a POST request to Express APIs.
- `resetGenerationState` (`() => void`): Invoked on component mount to flush previous execution states and logs.

### 3. WebSocket / Socket.io Store Triggers
- **Submit Action**: Firing `createAssignment` uploads the form data. Upon receiving the new assignment object, the client calls `subscribeToAssignment(id)` to listen on room-specific WebSocket channels.
- **Instant Redirect**: The client is **immediately redirected to `/assignments`** upon click to watch the live progress card in the dashboard grid, completely bypassing full-screen overlay blockages.

---

## 🔌 E2E Backend & Prompt Pipelines
- **REST Gateway**: `POST /api/assignments` processes the multipart form via Multer, saves the Assignment record in Mongoose Atlas or fallback, and enqueues a background generation job.
- **Text Extraction**: The controller extracts raw text from uploaded `.txt` files to feed into the AI context block.
