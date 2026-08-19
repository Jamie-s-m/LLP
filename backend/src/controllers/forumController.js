import ForumPost from '../models/ForumPost.js';
import ForumReply from '../models/ForumReply.js';

export const getPosts = async (req, res, next) => {
  try {
    const posts = await ForumPost.find().populate('author', 'firstName lastName').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const post = await ForumPost.create({
      title,
      content,
      author: req.user.id,
      category: category || 'discussion',
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

export const addReply = async (req, res, next) => {
  try {
    const { content } = req.body;
    const post = await ForumPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const reply = await ForumReply.create({
      content,
      author: req.user.id,
      post: post._id,
    });

    post.replies.push(reply._id);
    await post.save();

    res.status(201).json({ success: true, data: reply });
  } catch (error) {
    next(error);
  }
};
