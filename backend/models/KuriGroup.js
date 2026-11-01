import mongoose from 'mongoose';

const kuriGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  monthlyInstallment: {
    type: Number,
    required: true,
  },
  totalMonths: {
    type: Number,
    required: true,
  },
  currentMonth: {
    type: Number,
    default: 1,
  },
  dueDayOfMonth: {
    type: Number,
    default: 10, // e.g., 10th of every month
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED'],
    default: 'ACTIVE',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('KuriGroup', kuriGroupSchema);
