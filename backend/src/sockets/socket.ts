import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initWebSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allow connection from Next.js client
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Join a room for a specific assignment ID
    socket.on('join_assignment_room', (assignmentId: string) => {
      socket.join(assignmentId);
      console.log(`[WebSocket] Client ${socket.id} joined room: ${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('[WebSocket] Socket.io has not been initialized yet!');
  }
  return io;
};

// Utility function to broadcast progress to a specific assignment room
export const emitAssignmentProgress = (assignmentId: string, progress: number, statusText: string) => {
  if (io) {
    io.to(assignmentId).emit('assignment_progress', {
      assignmentId,
      progress,
      statusText
    });
    console.log(`[WebSocket] Progress emitted for ${assignmentId}: ${progress}% - ${statusText}`);
  }
};

export const emitAssignmentCompleted = (assignmentId: string, data: any) => {
  if (io) {
    io.to(assignmentId).emit('assignment_completed', {
      assignmentId,
      data
    });
    console.log(`[WebSocket] Completed emitted for ${assignmentId}`);
  }
};

export const emitAssignmentFailed = (assignmentId: string, error: string) => {
  if (io) {
    io.to(assignmentId).emit('assignment_failed', {
      assignmentId,
      error
    });
    console.log(`[WebSocket] Failed emitted for ${assignmentId}: ${error}`);
  }
};
