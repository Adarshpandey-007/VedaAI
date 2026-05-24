# Page Specification: Assignments Listing Dashboard

The primary workplace dashboard listing all created assignments, featuring custom search filters, active card grids, three-dots operations popovers, and floated action controls.

---

## 💡 Teacher Perspective (Occupational Pains Solved)
- **Problem**: When managing multiple terms, finding specific quizzes or deleting legacy papers is tedious.
- **Solution**: Provides interactive search bars, status filter drop-downs, and popover actions. Shows real-time generation feedback directly on each card so teachers never have to wait on loading pages.

---

## 🎨 Visual Layout & UI Specifications (Figma Grid)
- **Header Section**: Contains a small green status dot, "Assignments" title text, orange total count pill, and `+ Create Assignment` primary button.
- **Filters Utility Panel**:
  - **Left**: Dropdown select wrapper labeled *"Filter By: All Statuses, Completed, Generating, Failed"*.
  - **Right**: Search bar with input field (`border-radius: 12px`) and absolute search magnifying glass icon on the left.
- **Workplace Grid**:
  - **0-State Layout**: Beautiful folder vector containing a red X magnifier. Shows *No assignments yet* text and large slate button `+ Create Your First Assignment`.
  - **Filled-State Cards Grid**: Multi-column cards grid. Cards display paper Title, Assigned date, Due date, dynamic total counts (e.g. *17 Questions • 60 Marks*), a three-dots menu icon, and reactive status pills (`Generating`, `Completed`, `Failed`).
- **Floated Trigger**: Circular float button in the bottom-right corner representing `+` with an absolute shadow.

---

## 🗄️ Zustand State Store Information (Global State Map)

### 1. Selected Store Properties
- `assignments` (`IAssignment[]`): The array of all created assignments, filtered locally on-the-fly based on search inputs and dropdown selections.
- `error` (`string | null`): Captures E2E queue errors.

### 2. Selected Store Actions
- `fetchAssignments` (`() => Promise<void>`): Hydrates the assignment grid from Mongoose or the JSON fallback database on mount.
- `deleteAssignment` (`(id: string) => Promise<void>`): Triggers Express deletion APIs and deletes both database records and locally saved elements.

### 3. WebSocket / Socket.io Auto-Subscription Loop
To keep card progress pills active regardless of page changes:
- Upon calling `fetchAssignments`, the Zustand store loops through all returned data.
- If any assignment has a status of `'processing'` or `'pending'`, it immediately runs a dynamic socket handshake:
  ```typescript
  socket.emit('join_assignment_room', assignment.id);
  ```
- **Socket event `assignment_progress`**: Binds progress updates to the target card, changing `progress` values live in the `assignments` array.
- **Socket event `assignment_completed`**: Transitions the card's status to `'completed'` and enables `View Paper` popup actions instantly.
- **Socket event `assignment_failed`**: Transitions the card's status to `'failed'` and logs the warning.

---

## 🔌 E2E Backend & Prompt Pipelines
- **REST Endpoints**:
  - `GET /api/assignments`: Retrieves card listings.
  - `DELETE /api/assignments/:id`: Express controller deletes assignment and paper records from Mongoose Atlas or the fallback JSON file.
- **Mongoose Cascade Deletion**: Deleting an assignment triggers cascade hooks in Mongoose or fallback repositories to automatically purge corresponding generated question paper documents.
