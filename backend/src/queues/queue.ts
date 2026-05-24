import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { DBStore } from '../services/dbStore';
import { AIGeneratorService } from '../services/generator';
import { 
  emitAssignmentProgress, 
  emitAssignmentCompleted, 
  emitAssignmentFailed 
} from '../sockets/socket';

export class QueueManager {
  private static redisConnection: Redis | null = null;
  private static bullQueue: Queue | null = null;
  private static bullWorker: Worker | null = null;
  private static activeEmulator: boolean = false;

  public static async init(): Promise<void> {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);

    console.log(`[QueueManager] Checking Redis availability on ${host}:${port}...`);

    try {
      const password = process.env.REDIS_PASSWORD || undefined;
      const useTls = process.env.REDIS_TLS === 'true';

      // Set a connection timeout to prevent long hangs on startup
      const connection = new Redis({
        host,
        port,
        password,
        tls: useTls ? {} : undefined,
        connectTimeout: 5000, // 5s timeout for remote cloud databases
        maxRetriesPerRequest: null, // Required by BullMQ
        showFriendlyErrorStack: true
      });

      await new Promise<void>((resolve, reject) => {
        connection.once('ready', () => {
          console.log('[QueueManager] Redis is connected and ready! Enabling BullMQ...');
          resolve();
        });
        connection.once('error', (err) => {
          reject(err);
        });
      });

      this.redisConnection = connection;
      this.bullQueue = new Queue('assignment-generation', { connection });

      // Start the BullMQ worker
      this.initBullWorker(connection);

    } catch (error) {
      console.warn('[QueueManager] Failed to connect to Redis. Enabling In-Memory Queue Emulator Fallback.');
      this.activeEmulator = true;
    }
  }

  // --- Real BullMQ Worker Setup ---

  private static initBullWorker(connection: Redis): void {
    this.bullWorker = new Worker(
      'assignment-generation',
      async (job: Job) => {
        const { assignmentId, sourceText, uploadedFiles } = job.data;
        console.log(`[BullMQ Worker] Processing job ${job.id} for assignment ${assignmentId}`);

        // Set state to processing
        await DBStore.updateAssignment(assignmentId, { status: 'processing', progress: 0 });
        emitAssignmentProgress(assignmentId, 0, 'Assignment starting...');

        try {
          // Generate paper
          const questionPaper = await AIGeneratorService.generateQuestionPaper(
            await DBStore.getAssignmentById(assignmentId) as any,
            sourceText,
            async (progress, statusText) => {
              // Update state & notify frontend
              await DBStore.updateAssignment(assignmentId, { progress });
              emitAssignmentProgress(assignmentId, progress, statusText);
            },
            uploadedFiles
          );

          // Save paper & set assignment status as completed
          await DBStore.saveQuestionPaper(questionPaper);
          await DBStore.updateAssignment(assignmentId, { status: 'completed', progress: 100 });
          emitAssignmentCompleted(assignmentId, questionPaper);

          console.log(`[BullMQ Worker] Job ${job.id} completed successfully!`);
        } catch (err: any) {
          console.error(`[BullMQ Worker] Job ${job.id} failed:`, err);
          await DBStore.updateAssignment(assignmentId, { status: 'failed' });
          emitAssignmentFailed(assignmentId, err.message || 'AI Generation failed.');
          throw err;
        }
      },
      { connection }
    );

    this.bullWorker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed in Queue:`, err);
    });
  }

  // --- Public Interface ---

  public static async addJob(
    assignmentId: string, 
    sourceText?: string,
    uploadedFiles?: Array<{ path: string; mimetype: string }>
  ): Promise<void> {
    if (this.activeEmulator || !this.bullQueue) {
      console.log(`[QueueManager] Queueing job in Emulator for assignment ${assignmentId}`);
      this.runEmulatorJob(assignmentId, sourceText, uploadedFiles);
    } else {
      console.log(`[QueueManager] Queueing job in BullMQ for assignment ${assignmentId}`);
      await this.bullQueue.add(
        `generate-${assignmentId}`,
        { assignmentId, sourceText, uploadedFiles },
        { removeOnComplete: true, removeOnFail: true }
      );
    }
  }

  // --- In-Memory Queue Emulator ---

  private static async runEmulatorJob(
    assignmentId: string, 
    sourceText?: string,
    uploadedFiles?: Array<{ path: string; mimetype: string }>
  ): Promise<void> {
    // Process asynchronously outside the HTTP request-response cycle
    setImmediate(async () => {
      console.log(`[Emulator Queue] Starting sequential generation for assignment ${assignmentId}`);
      
      await DBStore.updateAssignment(assignmentId, { status: 'processing', progress: 0 });
      emitAssignmentProgress(assignmentId, 0, 'Queueing background generation task...');

      try {
        const assignment = await DBStore.getAssignmentById(assignmentId);
        if (!assignment) {
          throw new Error('Assignment not found in store.');
        }

        const questionPaper = await AIGeneratorService.generateQuestionPaper(
          assignment,
          sourceText,
          async (progress, statusText) => {
            // Update database and emit real-time WebSocket progress
            await DBStore.updateAssignment(assignmentId, { progress });
            emitAssignmentProgress(assignmentId, progress, statusText);
          },
          uploadedFiles
        );

        // Persist generated CBSE question paper
        await DBStore.saveQuestionPaper(questionPaper);
        await DBStore.updateAssignment(assignmentId, { status: 'completed', progress: 100 });
        emitAssignmentCompleted(assignmentId, questionPaper);

        console.log(`[Emulator Queue] Finished generation for assignment ${assignmentId}`);
      } catch (err: any) {
        console.error(`[Emulator Queue] Failed generation for ${assignmentId}:`, err);
        await DBStore.updateAssignment(assignmentId, { status: 'failed' });
        emitAssignmentFailed(assignmentId, err.message || 'AI Generation failed.');
      }
    });
  }
}
