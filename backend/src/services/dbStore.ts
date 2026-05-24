import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { AssignmentModel } from '../models/Assignment';
import { QuestionPaperModel } from '../models/QuestionPaper';
import { ToolkitItemModel } from '../models/ToolkitItem';
import { IAssignment, IQuestionPaper, IToolkitItem } from '../models/types';

const FALLBACK_FILE_PATH = path.join(__dirname, '../../db_fallback.json');

// Interface for our JSON file schema
interface IFallbackDB {
  assignments: IAssignment[];
  questionPapers: IQuestionPaper[];
  toolkitItems?: IToolkitItem[];
}

export class DBStore {
  private static useMongoStorage: boolean = false;

  public static setStorageMode(useMongo: boolean) {
    this.useMongoStorage = useMongo;
    console.log(`[DBStore] Database Storage Mode locked to: ${useMongo ? 'MongoDB Atlas' : 'Local JSON Fallback'}`);
  }

  private static isConnectedToMongo(): boolean {
    return this.useMongoStorage;
  }

  private static async getFallbackData(): Promise<IFallbackDB> {
    try {
      const data = await fs.readFile(FALLBACK_FILE_PATH, 'utf-8');
      return JSON.parse(data) as IFallbackDB;
    } catch (error) {
      // If file doesn't exist, create it with empty collections
      const initialData: IFallbackDB = { assignments: [], questionPapers: [] };
      await fs.writeFile(FALLBACK_FILE_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
  }

  private static async writeFallbackData(data: IFallbackDB): Promise<void> {
    await fs.writeFile(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2));
  }

  // --- Assignments CRUD Operations ---

  public static async getAssignments(): Promise<IAssignment[]> {
    if (this.isConnectedToMongo()) {
      const assignments = await AssignmentModel.find().sort({ createdAt: -1 });
      return assignments.map(a => a.toJSON() as IAssignment);
    } else {
      const db = await this.getFallbackData();
      // Sort by createdAt descending
      return [...db.assignments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }

  public static async getAssignmentById(id: string): Promise<IAssignment | null> {
    if (this.isConnectedToMongo()) {
      const assignment = await AssignmentModel.findById(id);
      return assignment ? (assignment.toJSON() as IAssignment) : null;
    } else {
      const db = await this.getFallbackData();
      return db.assignments.find(a => a.id === id) || null;
    }
  }

  public static async createAssignment(assignmentData: Omit<IAssignment, 'id' | 'status' | 'progress' | 'createdAt'>): Promise<IAssignment> {
    if (this.isConnectedToMongo()) {
      const assignment = new AssignmentModel({
        ...assignmentData,
        status: 'pending',
        progress: 0,
      });
      await assignment.save();
      return assignment.toJSON() as IAssignment;
    } else {
      const db = await this.getFallbackData();
      const newAssignment: IAssignment = {
        ...assignmentData,
        id: Math.random().toString(36).substring(2, 11),
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
      };
      db.assignments.push(newAssignment);
      await this.writeFallbackData(db);
      return newAssignment;
    }
  }

  public static async updateAssignment(id: string, updates: Partial<IAssignment>): Promise<IAssignment | null> {
    if (this.isConnectedToMongo()) {
      const assignment = await AssignmentModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
      return assignment ? (assignment.toJSON() as IAssignment) : null;
    } else {
      const db = await this.getFallbackData();
      const idx = db.assignments.findIndex(a => a.id === id);
      if (idx === -1) return null;

      db.assignments[idx] = {
        ...db.assignments[idx],
        ...updates
      };
      await this.writeFallbackData(db);
      return db.assignments[idx];
    }
  }

  public static async deleteAssignment(id: string): Promise<boolean> {
    if (this.isConnectedToMongo()) {
      const deleteAss = await AssignmentModel.findByIdAndDelete(id);
      // Delete associated question paper if any
      await QuestionPaperModel.deleteOne({ assignmentId: id });
      return !!deleteAss;
    } else {
      const db = await this.getFallbackData();
      const assCountBefore = db.assignments.length;
      db.assignments = db.assignments.filter(a => a.id !== id);
      db.questionPapers = db.questionPapers.filter(q => q.assignmentId !== id);
      await this.writeFallbackData(db);
      return db.assignments.length < assCountBefore;
    }
  }

  // --- Question Paper Operations ---

  public static async getQuestionPaperByAssignmentId(assignmentId: string): Promise<IQuestionPaper | null> {
    if (this.isConnectedToMongo()) {
      const qp = await QuestionPaperModel.findOne({ assignmentId });
      return qp ? (qp.toJSON() as IQuestionPaper) : null;
    } else {
      const db = await this.getFallbackData();
      return db.questionPapers.find(q => q.assignmentId === assignmentId) || null;
    }
  }

  public static async saveQuestionPaper(qpData: IQuestionPaper): Promise<IQuestionPaper> {
    if (this.isConnectedToMongo()) {
      // Upsert
      const qp = await QuestionPaperModel.findOneAndUpdate(
        { assignmentId: qpData.assignmentId },
        { $set: qpData },
        { new: true, upsert: true }
      );
      return qp.toJSON() as IQuestionPaper;
    } else {
      const db = await this.getFallbackData();
      const idx = db.questionPapers.findIndex(q => q.assignmentId === qpData.assignmentId);
      if (idx !== -1) {
        db.questionPapers[idx] = qpData;
      } else {
        db.questionPapers.push(qpData);
      }
      await this.writeFallbackData(db);
      return qpData;
    }
  }

  // --- Toolkit Item Operations ---

  public static async getToolkitItems(): Promise<IToolkitItem[]> {
    if (this.isConnectedToMongo()) {
      const items = await ToolkitItemModel.find().sort({ createdAt: -1 });
      return items.map(i => i.toJSON() as IToolkitItem);
    } else {
      const db = await this.getFallbackData();
      if (!db.toolkitItems) db.toolkitItems = [];
      return [...db.toolkitItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }

  public static async saveToolkitItem(itemData: Omit<IToolkitItem, 'id' | 'createdAt'>): Promise<IToolkitItem> {
    if (this.isConnectedToMongo()) {
      const item = new ToolkitItemModel(itemData);
      await item.save();
      return item.toJSON() as IToolkitItem;
    } else {
      const db = await this.getFallbackData();
      if (!db.toolkitItems) db.toolkitItems = [];
      const newItem: IToolkitItem = {
        ...itemData,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString()
      };
      db.toolkitItems.push(newItem);
      await this.writeFallbackData(db);
      return newItem;
    }
  }
}
