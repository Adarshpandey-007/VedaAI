import { Request, Response } from 'express';
import { DBStore } from '../services/dbStore';
import { QueueManager } from '../queues/queue';
import { IQuestionType } from '../models/types';
import fs from 'fs/promises';

export class AssignmentController {
  // GET /api/assignments - List all assignments
  public static async listAssignments(req: Request, res: Response) {
    try {
      const assignments = await DBStore.getAssignments();
      return res.status(200).json(assignments);
    } catch (error: any) {
      console.error('[Controller] Error listing assignments:', error);
      return res.status(500).json({ error: 'Failed to retrieve assignments.' });
    }
  }

  // GET /api/assignments/:id/output - Get generated question paper
  public static async getAssignmentOutput(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const questionPaper = await DBStore.getQuestionPaperByAssignmentId(id);
      if (!questionPaper) {
        return res.status(404).json({ error: 'Question paper not generated yet or not found.' });
      }
      return res.status(200).json(questionPaper);
    } catch (error: any) {
      console.error('[Controller] Error getting question paper:', error);
      return res.status(500).json({ error: 'Failed to retrieve question paper.' });
    }
  }

  // POST /api/assignments - Create new assignment & schedule AI task
  public static async createAssignment(req: Request, res: Response) {
    try {
      const { title, dueDate, questionTypes, additionalInstructions, examClass, examSection, examSubject, schoolName } = req.body;

      if (!title || !dueDate || !questionTypes) {
        return res.status(400).json({ error: 'Missing required fields: title, dueDate, questionTypes' });
      }

      // Parse questionTypes if it's sent as a string (often happens in form-data uploads)
      let parsedQuestionTypes: IQuestionType[] = [];
      try {
        parsedQuestionTypes = typeof questionTypes === 'string' 
          ? JSON.parse(questionTypes) 
          : questionTypes;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid questionTypes format. Must be a valid JSON array.' });
      }

      if (!Array.isArray(parsedQuestionTypes) || parsedQuestionTypes.length === 0) {
        return res.status(400).json({ error: 'questionTypes must be a non-empty array.' });
      }

      // Calculations and Form Validations
      let totalQuestions = 0;
      let totalMarks = 0;

      for (const qt of parsedQuestionTypes) {
        const count = parseInt(qt.count as any, 10);
        const marks = parseInt(qt.marksPerQuestion as any, 10);

        if (isNaN(count) || count <= 0 || isNaN(marks) || marks <= 0) {
          return res.status(400).json({ error: 'Question count and marks must be greater than zero.' });
        }

        totalQuestions += count;
        totalMarks += (count * marks);
      }

      // Handle file upload
      let fileUrl = '';
      let fileName = '';
      let sourceText = '';

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Just storing the first file's URL and name for legacy compatibility
        // You could update your database to support multiple `fileUrls`
        fileName = req.files[0].originalname;
        fileUrl = `/uploads/${req.files[0].filename}`;
        
        for (const file of req.files) {
          if (file.mimetype.startsWith('text/') || file.originalname.endsWith('.txt')) {
            try {
              sourceText += `\n\n--- Content from ${file.originalname} ---\n`;
              sourceText += await fs.readFile(file.path, 'utf-8');
            } catch (readErr) {
              console.error('[Multer] Failed to read uploaded text file:', readErr);
            }
          } else if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
            try {
              const { PDFParse } = require('pdf-parse');
              const dataBuffer = await fs.readFile(file.path);
              const parser = new PDFParse({ data: dataBuffer });
              const pdfData = await parser.getText();
              sourceText += `\n\n--- Extracted Text from PDF: ${file.originalname} ---\n`;
              sourceText += pdfData.text;
              console.log(`[pdf-parse] Successfully extracted ${pdfData.text.length} characters from PDF: ${file.originalname}`);
            } catch (pdfErr) {
              console.error(`[pdf-parse] Failed to parse PDF ${file.originalname}:`, pdfErr);
              sourceText += `\n\n--- Content from PDF: ${file.originalname} ---\nNote: The PDF parser encountered an error. Please base questions on ${title}.\n`;
            }
          } else {
             // Let Gemini handle image processing natively, but give a hint
             sourceText += `\n\n--- Content from ${file.originalname} ---\nNote: The user uploaded an image. Please thoroughly extract visual/textual information from it to formulate the test questions accurately about ${title}.\n`;
          }
        }
      }

      // Create Assignment in database/file
      const newAssignment = await DBStore.createAssignment({
        title,
        dueDate,
        questionTypes: parsedQuestionTypes,
        additionalInstructions,
        examClass,
        examSection,
        examSubject,
        schoolName,
        fileUrl,
        fileName,
        totalQuestions,
        totalMarks,
      });

      // Queue background job
      const uploadedFiles = req.files && Array.isArray(req.files)
        ? req.files.map(f => ({ path: f.path, mimetype: f.mimetype }))
        : [];
      await QueueManager.addJob(newAssignment.id, sourceText, uploadedFiles);

      return res.status(201).json(newAssignment);

    } catch (error: any) {
      console.error('[Controller] Error creating assignment:', error);
      return res.status(500).json({ error: error.message || 'Failed to create assignment.' });
    }
  }

  // DELETE /api/assignments/:id - Delete assignment & output
  public static async deleteAssignment(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const success = await DBStore.deleteAssignment(id);
      if (!success) {
        return res.status(404).json({ error: 'Assignment not found.' });
      }
      return res.status(200).json({ message: 'Assignment deleted successfully.' });
    } catch (error: any) {
      console.error('[Controller] Error deleting assignment:', error);
      return res.status(500).json({ error: 'Failed to delete assignment.' });
    }
  }

  // PUT /api/assignments/:id/output - Save edited question paper
  public static async updateQuestionPaper(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const updatedPaper = await DBStore.updateQuestionPaper(id, req.body);
      if (!updatedPaper) {
        return res.status(404).json({ error: 'Question paper not found.' });
      }
      return res.status(200).json(updatedPaper);
    } catch (error: any) {
      console.error('[Controller] Error updating question paper:', error);
      return res.status(500).json({ error: 'Failed to update question paper.' });
    }
  }

  // POST /api/assignments/:id/regenerate-question - Re-roll single question
  public static async regenerateQuestion(req: Request, res: Response) {
    const { id } = req.params;
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({ error: 'Missing required parameter: questionId' });
    }

    try {
      const assignment = await DBStore.getAssignmentById(id);
      const paper = await DBStore.getQuestionPaperByAssignmentId(id);

      if (!assignment || !paper) {
        return res.status(404).json({ error: 'Assignment or question paper not found.' });
      }

      // Find the specific question
      let targetQ: any = null;
      let targetSecIdx = -1;
      let targetQIdx = -1;

      for (let sIdx = 0; sIdx < paper.sections.length; sIdx++) {
        const sec = paper.sections[sIdx];
        const qIdx = sec.questions.findIndex(q => q.id === questionId);
        if (qIdx !== -1) {
          targetQ = sec.questions[qIdx];
          targetSecIdx = sIdx;
          targetQIdx = qIdx;
          break;
        }
      }

      if (!targetQ) {
        return res.status(404).json({ error: 'Question not found in paper.' });
      }

      // Re-roll using Gemini
      const isMcq = !!(targetQ.options && targetQ.options.length > 0);
      
      const { AIGeneratorService } = await import('../services/generator');
      const newQDetails = await AIGeneratorService.regenerateSingleQuestion(
        assignment,
        targetQ.text,
        targetQ.difficulty,
        targetQ.marks,
        isMcq
      );

      // Swap in paper
      paper.sections[targetSecIdx].questions[targetQIdx] = {
        ...targetQ,
        text: newQDetails.text,
        options: newQDetails.options,
        answer: newQDetails.answer
      };

      // Swap in answerKey
      const keyIdx = paper.answerKey.findIndex(k => k.questionId === questionId);
      if (keyIdx !== -1) {
        paper.answerKey[keyIdx] = {
          questionId,
          questionText: newQDetails.text,
          answer: newQDetails.answer
        };
      }

      // Save changes back to DB
      await DBStore.saveQuestionPaper(paper);

      return res.status(200).json(paper);
    } catch (error: any) {
      console.error('[Controller] Error re-rolling question:', error);
      return res.status(500).json({ error: error.message || 'Failed to re-roll question.' });
    }
  }
}
