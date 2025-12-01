import mongoose, { Schema, Document } from 'mongoose';

export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface IWorkRequest extends Document {
  requestId: string;
  title: string;
  description: string;
  location: string;
  status: RequestStatus;
  priority: Priority;
  submittedBy: mongoose.Types.ObjectId;
  submittedByName: string;
  assignedTo?: mongoose.Types.ObjectId;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkRequestSchema = new Schema<IWorkRequest>(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'rejected'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedByName: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedToName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWorkRequest>('WorkRequest', WorkRequestSchema);
