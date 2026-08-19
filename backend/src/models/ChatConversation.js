import mongoose from 'mongoose';

const chatConversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['direct', 'group', 'support'], required: true },
    name: { type: String, trim: true, default: '' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.model('ChatConversation', chatConversationSchema);
