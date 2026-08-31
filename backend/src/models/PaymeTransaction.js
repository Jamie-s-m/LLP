import mongoose from 'mongoose';

// Mirrors Payme's Merchant API transaction states exactly, so state values stored here
// can be echoed straight back into CheckTransaction/CancelTransaction responses:
// 1 = created (pending), 2 = performed (paid), -1 = cancelled while pending,
// -2 = cancelled after having been performed (refunded).
const paymeTransactionSchema = new mongoose.Schema(
  {
    paycomTransactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      enum: ['local', 'learner', 'family', 'teaching'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    state: {
      type: Number,
      enum: [1, 2, -1, -2],
      default: 1,
    },
    reason: {
      type: Number,
      default: null,
    },
    createTime: {
      type: Number,
      required: true,
    },
    performTime: {
      type: Number,
      default: 0,
    },
    cancelTime: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('PaymeTransaction', paymeTransactionSchema);
