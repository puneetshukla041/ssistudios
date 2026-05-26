import mongoose, { Schema, Document } from 'mongoose';

export interface IMaster extends Document {
  surgeonName: string;
  speciality: string;
  hospitalName: string;
  contactNumber: string;
  emailId: string;
  salesPersonName: string;
  createdAt: Date;
  updatedAt: Date;
}

const MasterSchema: Schema = new Schema(
  {
    surgeonName: { type: String, required: true, trim: true },
    speciality: { type: String, default: '', trim: true },
    hospitalName: { type: String, required: true, trim: true },
    contactNumber: { type: String, default: '', trim: true },
    emailId: { type: String, default: '', trim: true },
    salesPersonName: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Master || mongoose.model<IMaster>('Master', MasterSchema);