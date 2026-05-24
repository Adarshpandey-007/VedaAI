# Page Specification: AI Teacher's Toolkit Workspace

An interactive workspace packed with specialized AI-powered assistants generating syllabus-standard lesson plans, detailed grading rubrics, and engaging activities.

---

## 💡 Teacher Perspective (Occupational Pains Solved)
- **Problem**: Lesson planning and rubric creation are tedious writing tasks. Teachers spend hours aligning curriculum objectives and drafting rubrics matrices in Word.
- **Solution**: unifies these tasks! Using Gemini 2.5 Flash-Lite, teachers can instantly generate structured NCERT lesson plans and grading tables in seconds, with quick clipboard actions.

---

## 🎨 Visual Layout & UI Specifications (Figma Grid)
- **Wizard Sidebar**: Responsive vertical selector tabs on the left:
  - *Lesson Planner AI* (Objectives, warmth-ups, activities planner).
  - *Rubric Generator* (Grading matrix constructor).
  - *Activity Planner* (Experiments, interactive group games).
- **Configuration Canvas**: Input panels on the right containing:
  - Topic/Syllabus Focus (input field)
  - Grade/Class level (dropdown selector)
  - Specific Instructions (textarea)
  - Primary button `Generate with AI` (charcoal themed, containing a wand icon).
- **Generative Markdown Box**: A beautiful slate card displaying:
  - Markdown-styled lesson outlines or formatted HTML table rubrics grids.
  - Floated Action Bar presenting: `Copy to Clipboard` and `Print Outline`.

---

## 🗄️ Zustand State Store Information (Global State Map)

### 1. Selected Store Properties
- `toolkitOutput` (`string | null`): Holds generated markdown plan or rubric HTML output.
- `isToolkitLoading` (`boolean`): If `true`, renders a glowing loading bar: *"Gemini compiling objectives..."*
- `toolkitError` (`string | null`): Captures API connection issues.

### 2. Selected Store Actions
- `generateToolkitResource` (`(type: string, topic: string, grade: string) => Promise<void>`): Dispatches prompt variables to Express endpoints, fetching parsed LLM returns.
- `clearToolkitWorkspace` (`() => void`): Flushes previously compiled outlines when switching between wizard tabs.

---

## 🔌 E2E Backend & Prompt Pipelines
- **REST Gateway**: `POST /api/toolkit/generate` receives the topic, grade, and type parameters.
- **Targeted AI Prompting**:
  - **Lesson Plans Prompt**: Requires bold formatting, objective definitions, classroom activities timeline, and homework sections.
  - **Rubrics Prompt**: Requires a clean HTML `<table>` matrix mapping criteria (e.g. *Understanding, Delivery*) against mastery levels (*Excellent, Good, Poor*).
- **Markdown Renderer**: Frontend dynamically compiles text strings into high-fidelity HTML nodes using a secure markdown-to-HTML parser.
