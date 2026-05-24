import mongoose, { Schema, Document } from 'mongoose';
import { IQuestionPaper, ISection, IQuestion, IAnswerKeyItem } from './types';

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  options: { type: [String], required: false },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true }
}, { _id: false });

const AnswerKeyItemSchema = new Schema<IAnswerKeyItem>({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const QuestionPaperSchema = new Schema<IQuestionPaper & Document>({
  assignmentId: { type: String, required: true, unique: true },
  schoolName: { type: String, required: true },
  subject: { type: String, required: true },
  gradeClass: { type: String, required: true },
  timeAllowed: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  sections: { type: [SectionSchema], required: true },
  answerKey: { type: [AnswerKeyItemSchema], required: true }
});

QuestionPaperSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  }
});

export const QuestionPaperModel = mongoose.models.QuestionPaper || mongoose.model<IQuestionPaper & Document>('QuestionPaper', QuestionPaperSchema);
