import mongoose from 'mongoose';

const kuriMemberSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KuriGroup',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // If the member has an app account
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  kuriNumber: {
    type: String,
    required: true,
    match: /^[0-9]{3}$/, // Strictly 3-digit number (e.g. "101", "342")
  },
  hasWon: {
    type: Boolean,
    default: false,
  },
  wonMonth: {
    type: Number,
    default: null,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique kuriNumber per group
kuriMemberSchema.index({ groupId: 1, kuriNumber: 1 }, { unique: true });
kuriMemberSchema.index({ groupId: 1, email: 1 }, { unique: true });

export default mongoose.model('KuriMember', kuriMemberSchema);
