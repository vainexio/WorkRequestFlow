import mongoose, { Schema, Document } from 'mongoose';

export type RequestStatus = 
  | 'pending'
  | 'denied'
  | 'scheduled'
  | 'ongoing'
  | 'cannot_resolve'
  | 'resolved'
  | 'closed';

export type UrgencyType = 'standstill' | 'immediately' | 'on_occasion' | 'during_maintenance';

export interface IWorkRequest extends Document {
  requestId: string;
  tswrNo: string;
  assetId: string;
  assetName: string;
  location: string;
  workDescription: string;
  urgency: UrgencyType;
  disruptsOperation: boolean;
  attachmentUrl?: string;
  status: RequestStatus;
  denialReason?: string;
  scheduledDate?: Date;
  submittedBy: mongoose.Types.ObjectId;
  submittedByName: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  assignedTo?: mongoose.Types.ObjectId;
  assignedToName?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  closedBy?: mongoose.Types.ObjectId;
  closedByName?: string;
  requesterFeedback?: string;
  requesterConfirmedAt?: Date;
  turnaroundTime?: number;
  serviceReportId?: mongoose.Types.ObjectId;
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
    tswrNo: {
      type: String,
      required: true,
      unique: true,
    },
    assetId: {
      type: String,
      required: true,
    },
    assetName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    workDescription: {
      type: String,
      required: true,
    },
    urgency: {
      type: String,
      enum: ['standstill', 'immediately', 'on_occasion', 'during_maintenance'],
      default: 'standstill',
    },
    disruptsOperation: {
      type: Boolean,
      default: false,
    },
    attachmentUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'denied', 'scheduled', 'ongoing', 'cannot_resolve', 'resolved', 'closed'],
      default: 'pending',
    },
    denialReason: {
      type: String,
    },
    scheduledDate: {
      type: Date,
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
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedByName: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedToName: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    closedByName: {
      type: String,
    },
    requesterFeedback: {
      type: String,
    },
    requesterConfirmedAt: {
      type: Date,
    },
    turnaroundTime: {
      type: Number,
    },
    serviceReportId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceReport',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWorkRequest>('WorkRequest', WorkRequestSchema);
