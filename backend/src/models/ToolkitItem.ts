import mongoose, { Schema, Document } from 'mongoose';
import { IToolkitItem } from './types';

const ToolkitItemSchema = new Schema<IToolkitItem & Document>({
  type: { type: String, enum: ['lesson', 'rubric', 'activity'], required: true },
  title: { type: String, required: true },
  topic: { type: String, required: true },
  grade: { type: String, required: true },
  instructions: { type: String },
  content: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// Rename Mongoose default _id to id in JSON transform
ToolkitItemSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  }
});

export const ToolkitItemModel = mongoose.models.ToolkitItem || mongoose.model<IToolkitItem & Document>('ToolkitItem', ToolkitItemSchema);
