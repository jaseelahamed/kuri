import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KuriGroup',
    required: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KuriMember',
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI'],
    required: true,
  },
  transactionRef: {
    type: String,
    trim: true,
    default: '', // UPI Transaction ID or Cash Handover Note
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  remarks: {
    type: String,
    trim: true,
  },
});

export default mongoose.model('Payment', paymentSchema);
