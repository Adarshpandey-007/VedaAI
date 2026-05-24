# Page Specification: CBSE Question Paper Output View

A premium, CBSE-standard physical exam worksheet rendering centered school headers, student credential blanks, difficulty-labeled questions, and expandable answer keys.

---

## 💡 Teacher Perspective (Occupational Pains Solved)
- **Problem**: In traditional systems, teachers get raw, unformatted AI text blocks that require tedious manual copypasta, editing, and formatting inside Microsoft Word.
- **Solution**: Renders a beautiful, centered A4 sheet that is styled out-of-the-box like a physical CBSE worksheet, complete with examiner keys and a vector print engine!

---

## 🎨 Visual Layout & UI Specifications (Figma Grid)
- **AI Response Banner**: Slate-blue container (`#1E293B`) presenting the prompt parsing confirmation: *"Certainly! Here is your customized question paper..."* and a wide white button `Download as PDF` containing a download icon.
- **A4 Physical Exam Card**: White boundary card displaying:
  - Centered headers: *Delhi Public School, Sector-4, Bokaro*.
  - Subject, grade, and meta row (*Time Allowed: 45 minutes, Maximum Marks: 60*).
  - Blank credentials sheet: Name, Roll Number, and Section details bordered by dashed underlines.
  - Section banners (Section A, Section B...) displaying instruction lines.
  - Question items display: displays the question text, a responsive colored difficulty tag (`Easy` in green, `Moderate` in orange, `Hard` in red), and marks tags.
- **Examiner Answers Drawer**: Dashed separator line leading to an *Answer Key* header. Clicking `Show Full Solutions` expands step-by-step solutions for grading.

---

## 🗄️ Zustand State Store Information (Global State Map)

### 1. Selected Store Properties
- `currentPaper` (`IQuestionPaper | null`): The active CBSE question paper object containing sections, questions, and solutions.
- `error` (`string | null`): If the backend was unable to fetch the generated paper (e.g. still compiling), this captures the error and displays a retry banner instead of an empty page.

### 2. Selected Store Actions
- `fetchQuestionPaper` (`(id: string) => Promise<void>`): Retrieves the generated question paper from the backend using the dynamic `id` route parameter.
- `clearCurrentPaper` (`() => void`): Invoked inside a clean-up `useEffect` return hook when navigating away from the page, flushing active papers from memory.

---

## 🔌 E2E Backend & Prompt Pipelines
- **REST Endpoint**: `GET /api/assignments/:id/output` queries the locked storage database and returns the generated CBSE QuestionPaper document.
- **Print stylesheet overrides**:
  - Global CSS print media rules (`@media print`) automatically hide the Sidebar navigation panels, slate banner, action buttons, and solutions key.
  - Center and scale the physical paper card boundary to match Standard A4 borders, exporting high-resolution vector PDFs directly using the browser's print engine!
