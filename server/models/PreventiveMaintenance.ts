import mongoose, { Schema, Document } from 'mongoose';

export type PMFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export interface IPreventiveMaintenance extends Document {
  scheduleId: string;
  assetId: mongoose.Types.ObjectId;
  assetCode: string;
  assetName: string;
  description: string;
  frequency: PMFrequency;
  nextDueDate: Date;
  lastCompletedDate?: Date;
  assignedTo?: mongoose.Types.ObjectId;
  assignedToName?: string;
  tasks: string[];
  estimatedDuration: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const PreventiveMaintenanceSchema = new Schema<IPreventiveMaintenance>(
  {
    scheduleId: {
      type: String,
      required: true,
      unique: true,
    },
    assetId: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    assetCode: {
      type: String,
      required: true,
    },
    assetName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual'],
      required: true,
    },
    nextDueDate: {
      type: Date,
      required: true,
    },
    lastCompletedDate: {
      type: Date,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedToName: {
      type: String,
    },
    tasks: [{
      type: String,
    }],
    estimatedDuration: {
      type: Number,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPreventiveMaintenance>('PreventiveMaintenance', PreventiveMaintenanceSchema);
