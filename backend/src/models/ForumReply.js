import mongoose from 'mongoose';

const forumReplySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: 'ForumPost',
      required: true,
    },
    replyTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'ForumReply',
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        url: String,
        filename: String,
      },
    ],
  },
  { timestamps: true }
);

forumReplySchema.index({ post: 1, createdAt: -1 });

export default mongoose.model('ForumReply', forumReplySchema);
