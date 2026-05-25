import { create } from 'zustand';
import { IAssignment, IQuestionPaper, IToolkitItem } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface AssignmentState {
  assignments: IAssignment[];
  toolkitItems: IToolkitItem[];
  currentPaper: IQuestionPaper | null;
  activeAssignmentId: string | null;
  generationProgress: number;
  generationStatusText: string;
  isGenerating: boolean;
  error: string | null;
  
  // Actions
  fetchAssignments: () => Promise<void>;
  createAssignment: (formData: FormData) => Promise<IAssignment>;
  deleteAssignment: (id: string) => Promise<void>;
  fetchQuestionPaper: (assignmentId: string) => Promise<void>;
  fetchToolkitItems: () => Promise<void>;
  addToolkitItem: (item: IToolkitItem) => void;
  updateQuestionPaper: (assignmentId: string, paper: IQuestionPaper) => Promise<void>;
  regenerateSingleQuestion: (assignmentId: string, questionId: string) => Promise<void>;
  updateToolkitItem: (itemId: string, content: string) => Promise<void>;
  
  // Real-time updates via Socket.io
  startGeneration: (assignmentId: string) => void;
  updateGenerationProgress: (assignmentId: string, progress: number, text: string) => void;
  completeGeneration: (assignmentId: string, paper: IQuestionPaper) => void;
  failGeneration: (assignmentId: string, errorMsg: string) => void;
  resetGenerationState: () => void;
  clearCurrentPaper: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  toolkitItems: [],
  currentPaper: null,
  activeAssignmentId: null,
  generationProgress: 0,
  generationStatusText: '',
  isGenerating: false,
  error: null,

  fetchAssignments: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assignments`);
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = (await res.json()) as IAssignment[];
      set({ assignments: data, error: null });
      
      // Dynamically import the socket helper to prevent cyclic bundler dependencies
      const { getSocket } = await import('../utils/socket');
      const socket = getSocket();
      
      // Auto-subscribe client to rooms of all active generating papers
      data.forEach(a => {
        if (a.status === 'processing' || a.status === 'pending') {
          socket.emit('join_assignment_room', a.id);
          console.log(`[WebSocket] Dynamic auto-subscription for active job room: ${a.id}`);
        }
      });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        console.warn('⚠️ [VedaAI API] Backend server is unreachable. Please ensure the Express backend is running on port 5000.');
        set({ error: 'Backend server is currently offline. Please start the backend running on port 5000.' });
      } else {
        console.error('[VedaAI API] Error fetching assignments:', err?.message || err);
        set({ error: err.message || 'Failed to sync assignments.' });
      }
    }
  },

  createAssignment: async (formData: FormData) => {
    set({ isGenerating: true, generationProgress: 0, generationStatusText: 'Uploading data...', error: null });
    try {
      const res = await fetch(`${API_BASE}/api/assignments`, {
        method: 'POST',
        body: formData, // Sending multipart form data directly (with files)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit assignment');
      }

      const newAssignment = (await res.json()) as IAssignment;
      
      // Update local state list and track active ID
      set(state => ({
        assignments: [newAssignment, ...state.assignments],
        activeAssignmentId: newAssignment.id,
        generationProgress: 0,
        generationStatusText: 'Enqueuing assignment generator...'
      }));
      
      return newAssignment;
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      set({ isGenerating: false, activeAssignmentId: null, error: err.message || 'Failed to submit.' });
      throw err;
    }
  },

  deleteAssignment: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/assignments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete assignment');
      
      set(state => ({
        assignments: state.assignments.filter(a => a.id !== id),
        currentPaper: state.currentPaper?.assignmentId === id ? null : state.currentPaper
      }));
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      set({ error: err.message || 'Failed to delete.' });
    }
  },

  fetchQuestionPaper: async (assignmentId: string) => {
    set({ error: null });
    try {
      const res = await fetch(`${API_BASE}/api/assignments/${assignmentId}/output`);
      if (!res.ok) {
        set({ currentPaper: null, error: 'Question paper has not completed generation yet.' });
        return;
      }
      const data = await res.json();
      set({ currentPaper: data, error: null });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.warn('[Zustand] Syncing paper failed:', err?.message || err);
      set({ currentPaper: null, error: 'Question paper has not completed generation yet.' });
    }
  },

  // --- Real-time Websocket Hooks ---

  startGeneration: (assignmentId: string) => {
    set({
      activeAssignmentId: assignmentId,
      isGenerating: true,
      generationProgress: 0,
      generationStatusText: 'Starting generation...',
      error: null
    });
  },

  updateGenerationProgress: (assignmentId: string, progress: number, text: string) => {
    const { activeAssignmentId } = get();
    // Only update if it belongs to our active tracking window
    if (activeAssignmentId === assignmentId) {
      set({
        generationProgress: progress,
        generationStatusText: text
      });
    }

    // Dynamic list updates to show the progress badge in real-time inside lists
    set(state => ({
      assignments: state.assignments.map(a => 
        a.id === assignmentId 
          ? { ...a, status: 'processing', progress } 
          : a
      )
    }));
  },

  completeGeneration: (assignmentId: string, paper: IQuestionPaper) => {
    const { activeAssignmentId } = get();
    if (activeAssignmentId === assignmentId) {
      set({
        isGenerating: false,
        generationProgress: 100,
        generationStatusText: 'Complete!',
        currentPaper: paper,
        activeAssignmentId: null
      });
    }

    set(state => ({
      assignments: state.assignments.map(a => 
        a.id === assignmentId 
          ? { ...a, status: 'completed', progress: 100 } 
          : a
      )
    }));
  },

  failGeneration: (assignmentId: string, errorMsg: string) => {
    const { activeAssignmentId } = get();
    if (activeAssignmentId === assignmentId) {
      set({
        isGenerating: false,
        activeAssignmentId: null,
        error: errorMsg
      });
    }

    set(state => ({
      assignments: state.assignments.map(a => 
        a.id === assignmentId 
          ? { ...a, status: 'failed' } 
          : a
      )
    }));
  },

  resetGenerationState: () => {
    set({
      isGenerating: false,
      generationProgress: 0,
      generationStatusText: '',
      activeAssignmentId: null
    });
  },

  clearCurrentPaper: () => {
    set({ currentPaper: null });
  },

  fetchToolkitItems: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/toolkit`);
      if (!res.ok) throw new Error('Failed to fetch toolkit items');
      const data = (await res.json()) as IToolkitItem[];
      set({ toolkitItems: data });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('[VedaAI API] Error fetching toolkit items:', err);
    }
  },

  addToolkitItem: (item: IToolkitItem) => {
    set(state => ({
      toolkitItems: [item, ...state.toolkitItems]
    }));
  },

  updateQuestionPaper: async (assignmentId: string, paper: IQuestionPaper) => {
    try {
      const res = await fetch(`${API_BASE}/api/assignments/${assignmentId}/output`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paper)
      });
      if (!res.ok) throw new Error('Failed to save paper changes.');
      const data = await res.json();
      set({ currentPaper: data });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('[Zustand] Error saving paper changes:', err);
      alert(err.message || 'Failed to save paper.');
    }
  },

  regenerateSingleQuestion: async (assignmentId: string, questionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/assignments/${assignmentId}/regenerate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionId })
      });
      if (!res.ok) throw new Error('Failed to re-roll question.');
      const data = await res.json();
      set({ currentPaper: data });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('[Zustand] Error re-rolling question:', err);
      throw err;
    }
  },

  updateToolkitItem: async (itemId: string, content: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/toolkit/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Failed to save toolkit item.');
      const data = await res.json() as IToolkitItem;
      set(state => ({
        toolkitItems: state.toolkitItems.map(item => item.id === itemId ? data : item)
      }));
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('[Zustand] Error saving toolkit item:', err);
      alert(err.message || 'Failed to save edits.');
    }
  }
}));
