import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  name: string;
  contactno: string;
  status: 'pending' | 'sent' | 'failed';
  batchId: string;
  createdAt: Date;
}

const ContactSchema: Schema = new Schema({
  name: { type: String, required: true },
  contactno: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  batchId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);