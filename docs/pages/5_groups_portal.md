# Page Specification: My Groups Classroom Portal

A classroom management portal where teachers monitor student lists, manage sections, track assigned examinations, and analyze average performance scores.

---

## 💡 Teacher Perspective (Occupational Pains Solved)
- **Problem**: Finding average class performance indexes across multiple sections requires manual math and ledger searches.
- **Solution**: The portal displays immediate class metrics in a clean grid of cards, featuring glowing circular SVG indicators tracking class averages dynamically.

---

## 🎨 Visual Layout & UI Specifications (Figma Grid)
- **Header**: Main title "My Groups" with a total sections counter badge, accompanied by a glowing `+ Create Group` button.
- **Classroom Cards Grid**: Multi-column responsive layout displaying cards:
  - **Header**: Class Title (e.g. *Grade 8 Science*), Section name (*Section B*), and settings icons.
  - **Body Metrics**: Student count badge (*32 Students*) and active exam counters (*3 Active Assessments*).
  - **SVG Circular Progress Widget**: High-glow circular circle gauge showing average scores (e.g., `84%` in orange). Circle contours transition dynamically on load.
- **Create Group Modal**: Overlay modal requesting:
  - Class Name (input field)
  - Section Name (input field)
  - Subject (dropdown selector)
  - Total Students (number incrementer)

---

## 🗄️ Zustand State Store Information (Global State Map)

### 1. Selected Store Properties
- `groups` (`IGroup[]`): Local array of student classes, filterable on-the-fly.
- `assignments` (`IAssignment[]`): Queried to compute active assigned exams for each specific group.

### 2. Selected Store Actions
- `fetchGroups` (`() => Promise<void>`): Syncs the list of classes from database records on mount.
- `createGroup` (`(groupData: Omit<IGroup, 'id'>) => Promise<IGroup>`): Submits new classroom credentials to the server, instantly updating local card grids.

---

## 🔌 E2E Backend & Prompt Pipelines
- **SVG Stroke Calculation**: CSS `stroke-dasharray` is locked to standard circumferential dimensions. The `stroke-dashoffset` is computed on the fly using standard percentage math to render smooth progress indicators:
  $$\text{Offset} = \text{Circumference} - \left(\frac{\text{Class Average}}{100} \times \text{Circumference}\right)$$
- **Database Schema (Mongoose)**:
  ```typescript
  interface IGroup {
    name: string;
    section: string;
    subject: string;
    studentCount: number;
    averageScore: number; // 0 to 100
  }
  ```
