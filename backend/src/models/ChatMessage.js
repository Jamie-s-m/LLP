import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachments: [{ url: String, filename: String, mimeType: String }],
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
