import mongoose, { Schema, Document } from 'mongoose';

export interface IPartMaterial {
  partName: string;
  partNo?: string;
  quantity: number;
  cost: number;
}

export interface IServiceReport extends Document {
  reportId: string;
  tswrNo: string;
  workRequestId: mongoose.Types.ObjectId;
  assetId: string;
  assetName: string;
  assetCode?: string;
  location: string;
  workDescription: string;
  remarks?: string;
  urgency: 'standstill' | 'immediately' | 'on_occasion' | 'during_maintenance';
  workStartTime: Date;
  workEndTime: Date;
  manHours: number;
  laborCost: number;
  partsMaterials: IPartMaterial[];
  totalPartsCost: number;
  serviceType: 'planned' | 'unplanned';
  hoursDown: number;
  reportFindings: string;
  serviceDate: Date;
  preparedBy: mongoose.Types.ObjectId;
  preparedByName: string;
  notedBy?: mongoose.Types.ObjectId;
  notedByName?: string;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedByName?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PartMaterialSchema = new Schema<IPartMaterial>({
  partName: { type: String, required: true },
  partNo: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  cost: { type: Number, default: 0 },
});

const ServiceReportSchema = new Schema<IServiceReport>(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
    },
    tswrNo: {
      type: String,
      required: true,
    },
    workRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkRequest',
      required: true,
    },
    assetId: {
      type: String,
      required: true,
    },
    assetName: {
      type: String,
      required: true,
    },
    assetCode: {
      type: String,
    },
    location: {
      type: String,
      required: true,
    },
    workDescription: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
    },
    urgency: {
      type: String,
      enum: ['standstill', 'immediately', 'on_occasion', 'during_maintenance'],
      required: true,
    },
    workStartTime: {
      type: Date,
      required: true,
    },
    workEndTime: {
      type: Date,
      required: true,
    },
    manHours: {
      type: Number,
      required: true,
    },
    laborCost: {
      type: Number,
      default: 0,
    },
    partsMaterials: [PartMaterialSchema],
    totalPartsCost: {
      type: Number,
      default: 0,
    },
    serviceType: {
      type: String,
      enum: ['planned', 'unplanned'],
      required: true,
    },
    hoursDown: {
      type: Number,
      default: 0,
    },
    reportFindings: {
      type: String,
      required: true,
    },
    serviceDate: {
      type: Date,
      required: true,
    },
    preparedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    preparedByName: {
      type: String,
      required: true,
    },
    notedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notedByName: {
      type: String,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedByName: {
      type: String,
    },
    acknowledgedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IServiceReport>('ServiceReport', ServiceReportSchema);
