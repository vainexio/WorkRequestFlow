import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'employee' | 'technician' | 'manager';

export interface IUser extends Document {
  username: string;
  password: string;
  role: UserRole;
  name: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['employee', 'technician', 'manager'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IUser>('User', UserSchema);
