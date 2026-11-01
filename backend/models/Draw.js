import mongoose from 'mongoose';

const drawSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KuriGroup',
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  winnerMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KuriMember',
    required: true,
  },
  kuriNumber: {
    type: String,
    required: true,
  },
  prizeAmount: {
    type: Number,
    required: true,
  },
  drawDate: {
    type: Date,
    default: Date.now,
  },
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// A group can only have 1 draw per month
drawSchema.index({ groupId: 1, month: 1 }, { unique: true });

export default mongoose.model('Draw', drawSchema);
