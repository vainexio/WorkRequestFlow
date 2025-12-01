import mongoose, { Schema, Document } from 'mongoose';

export interface IMaintenanceRecord {
  date: Date;
  type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  technicianName: string;
  cost: number;
  partsReplaced?: string[];
}

export interface IAsset extends Document {
  assetId: string;
  name: string;
  category: 'equipment' | 'machine' | 'furniture';
  location: string;
  purchaseDate: Date;
  purchaseCost: number;
  depreciationRate: number;
  currentValue: number;
  healthScore: number;
  status: 'operational' | 'under_maintenance' | 'out_of_service';
  maintenanceHistory: IMaintenanceRecord[];
  lastMaintenanceDate?: Date;
  nextScheduledMaintenance?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceRecordSchema = new Schema<IMaintenanceRecord>({
  date: { type: Date, required: true },
  type: { type: String, enum: ['preventive', 'corrective', 'emergency'], required: true },
  description: { type: String, required: true },
  technicianName: { type: String, required: true },
  cost: { type: Number, default: 0 },
  partsReplaced: [{ type: String }],
});

const AssetSchema = new Schema<IAsset>(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['equipment', 'machine', 'furniture'],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    purchaseCost: {
      type: Number,
      required: true,
    },
    depreciationRate: {
      type: Number,
      default: 10,
    },
    currentValue: {
      type: Number,
      required: true,
    },
    healthScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['operational', 'under_maintenance', 'out_of_service'],
      default: 'operational',
    },
    maintenanceHistory: [MaintenanceRecordSchema],
    lastMaintenanceDate: {
      type: Date,
    },
    nextScheduledMaintenance: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAsset>('Asset', AssetSchema);
