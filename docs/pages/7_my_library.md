# Page Specification: My Library Repository

A digital repository serving as the teacher's filing cabinet, where they store saved question papers, textbooks, AI prompts, and reference documents.

---

## 💡 Teacher Perspective (Occupational Pains Solved)
- **Problem**: Locating saved worksheets, prompt configurations, or textbooks across different folders and semesters is slow.
- **Solution**: The page categorizes resources into colored digital folder cards. The searchable document datagrid filters results instantly, letting teachers open generated worksheets in 1 click.

---

## 🎨 Visual Layout & UI Specifications (Figma Grid)
- **Header**: Main title "My Library" with a search index, accompanied by a dynamic `Upload Resource` button.
- **Folder Drawer Row**: A horizontal grid of tabbed folder cards featuring custom colors:
  - *Term Papers Folder* (High-glow orange tab, document count)
  - *Class Quizzes Folder* (Blue tab, document count)
  - *PDF Textbooks Folder* (Purple tab, document count)
- **Documents Datagrid**: Searchable list showing:
  - Search bar with absolute search icon.
  - Datagrid table featuring columns: File Name, Category, Date Saved, File Size, and Action settings. Clicking `Open` routes the teacher directly to the paper output.

---

## 🗄️ Zustand State Store Information (Global State Map)

### 1. Selected Store Properties
- `assignments` (`IAssignment[]`): Queried to populate the "Question Papers" folder view.
- `libraryItems` (`ILibraryItem[]`): Custom array representing uploaded PDF files and templates.
- `activeFolder` (`string`): Tracks the selected folder category to filter datagrid rows on-the-fly.

### 2. Selected Store Actions
- `fetchLibraryItems` (`() => Promise<void>`): Retrieves all custom library uploads from the database on mount.
- `setActiveFolder` (`(folderName: string) => void`): Sets folder state filter criteria, triggering immediate re-renders in `0.05 seconds`.

---

## 🔌 E2E Backend & Prompt Pipelines
- **Data Filtering**: Clicking folders triggers frontend filtering inside Zustand state. This ensures instant dashboard rendering of documents without requesting backend database fetches!
- **Download pipelines**: Clicking download on PDF resources pipes secure static file streams directly from local upload endpoints.
