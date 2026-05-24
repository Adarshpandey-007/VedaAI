import mongoose, { Schema, Document } from 'mongoose';
import { IAssignment, IQuestionType } from './types';

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marksPerQuestion: { type: Number, required: true, min: 1 },
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment & Document>({
  title: { type: String, required: true },
  dueDate: { type: String, required: true },
  questionTypes: { type: [QuestionTypeSchema], required: true },
  additionalInstructions: { type: String },
  examClass: { type: String },
  examSection: { type: String },
  examSubject: { type: String },
  schoolName: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  progress: { type: Number, default: 0 },
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Rename Mongoose default _id to id in JSON transform
AssignmentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  }
});

export const AssignmentModel = mongoose.models.Assignment || mongoose.model<IAssignment & Document>('Assignment', AssignmentSchema);
