import mongoose from 'mongoose';

const forumPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    group: {
      type: mongoose.Schema.ObjectId,
      ref: 'Group',
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
    },
    category: {
      type: String,
      enum: ['discussion', 'question', 'resource', 'event'],
      default: 'discussion',
    },
    tags: [String],
    isPinned: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    replies: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'ForumReply',
      },
    ],
    attachments: [
      {
        url: String,
        filename: String,
      },
    ],
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

forumPostSchema.index({ author: 1, createdAt: -1 });
forumPostSchema.index({ course: 1, createdAt: -1 });
forumPostSchema.index({ group: 1, createdAt: -1 });

export default mongoose.model('ForumPost', forumPostSchema);
