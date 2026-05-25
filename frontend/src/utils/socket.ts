import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '../store/assignmentStore';
import { IQuestionPaper } from '../types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    console.log(`[WebSocket] Connecting to Socket.io server at ${SOCKET_URL}...`);
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    // Handle connection lifecycle
    socket.on('connect', () => {
      console.log(`[WebSocket] Connected to server: ${socket?.id}`);
    });

    // Real-time generator progress listener
    socket.on('assignment_progress', (data: { assignmentId: string; progress: number; statusText: string }) => {
      console.log(`[WebSocket] Received progress: ${data.progress}% - ${data.statusText}`);
      useAssignmentStore.getState().updateGenerationProgress(
        data.assignmentId,
        data.progress,
        data.statusText
      );
    });

    // Real-time generator completed listener
    socket.on('assignment_completed', (data: { assignmentId: string; data: unknown }) => {
      console.log(`[WebSocket] Received completion for ${data.assignmentId}`);
      useAssignmentStore.getState().completeGeneration(
        data.assignmentId,
        data.data as IQuestionPaper
      );
    });

    // Real-time generator failed listener
    socket.on('assignment_failed', (data: { assignmentId: string; error: string }) => {
      console.log(`[WebSocket] Generation failed for ${data.assignmentId}: ${data.error}`);
      useAssignmentStore.getState().failGeneration(
        data.assignmentId,
        data.error
      );
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from server');
    });
  }

  return socket;
};

// Client room subscription helper
export const subscribeToAssignment = (assignmentId: string) => {
  const s = getSocket();
  if (s) {
    s.emit('join_assignment_room', assignmentId);
    useAssignmentStore.getState().startGeneration(assignmentId);
    console.log(`[WebSocket] Subscribed to room: ${assignmentId}`);
  }
};
