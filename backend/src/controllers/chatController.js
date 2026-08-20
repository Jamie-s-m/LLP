import mongoose from 'mongoose';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { sendPushToUsers } from '../utils/push.js';
import { hasModeratorPermission } from '../middleware/auth.js';

const isParticipant = (conversation, userId) =>
  conversation.participants.some((participant) => participant.toString() === userId.toString());

const emitConversationRefresh = (req, participantIds = [], conversationId) => {
  const io = req.app.get('io');
  if (!io) return;

  [...new Set(participantIds.map((participantId) => participantId.toString()))].forEach((participantId) => {
    io.to(`user:${participantId}`).emit('conversation:refresh', { conversationId: conversationId?.toString() });
  });
};

const emitMessageToConversation = (req, conversationId, message) => {
  const io = req.app.get('io');
  if (!io) return;
  io.to(conversationId.toString()).emit('message:new', message);
};

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await ChatConversation.find({ participants: req.user.id })
      .populate('participants', 'firstName lastName role avatar')
      .populate('group', 'name')
      .sort({ lastMessageAt: -1 });

    const unreadStats = await ChatMessage.aggregate([
      {
        $match: {
          conversation: { $in: conversations.map((conversation) => conversation._id) },
          sender: { $ne: new mongoose.Types.ObjectId(req.user.id) },
          readBy: { $nin: [new mongoose.Types.ObjectId(req.user.id)] },
        },
      },
      { $group: { _id: '$conversation', unreadCount: { $sum: 1 } } },
    ]);

    const unreadByConversation = unreadStats.reduce((accumulator, item) => {
      accumulator[item._id.toString()] = item.unreadCount;
      return accumulator;
    }, {});

    res.status(200).json({
      success: true,
      data: conversations.map((conversation) => ({
        ...conversation.toObject(),
        unreadCount: unreadByConversation[conversation._id.toString()] || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const { type = 'direct', participantIds = [], groupId, name } = req.body;
    let participants = [...new Set([req.user.id, ...participantIds])];

    if (!['direct', 'group', 'support'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation type' });
    }

    if (type === 'direct' && participants.length !== 2) {
      return res.status(400).json({ success: false, message: 'Direct chat requires exactly two participants' });
    }

    if (type === 'direct') {
      const existingConversation = await ChatConversation.findOne({
        type: 'direct',
        participants: { $all: participants, $size: 2 },
      })
        .populate('participants', 'firstName lastName role avatar')
        .populate('group', 'name');

      if (existingConversation) {
        return res.status(200).json({ success: true, data: existingConversation });
      }
    }

    if (type === 'group') {
      const existingConversation = await ChatConversation.findOne({ type: 'group', group: groupId })
        .populate('participants', 'firstName lastName role avatar')
        .populate('group', 'name');
      if (existingConversation) {
        return res.status(200).json({ success: true, data: existingConversation });
      }

      const group = await Group.findById(groupId);
      if (!group || !group.members.some((member) => member.toString() === req.user.id.toString())) {
        return res.status(403).json({ success: false, message: 'You are not a member of this group' });
      }
    }

    if (type === 'support') {
      const staff = await User.find({
        isActive: true,
        $or: [
          { role: 'admin' },
          { role: 'moderator', 'moderatorPermissions.supportChat': true },
        ],
      }).select('_id');
      if (staff.length === 0) {
        return res.status(400).json({ success: false, message: 'Support is not available right now' });
      }

      participants = [...new Set([req.user.id, ...staff.map((member) => member._id.toString())])];
      const existingConversation = await ChatConversation.findOne({
        type: 'support',
        participants: req.user.id,
      })
        .populate('participants', 'firstName lastName role avatar')
        .populate('group', 'name');

      if (existingConversation) {
        return res.status(200).json({ success: true, data: existingConversation });
      }
    }

    const conversation = await ChatConversation.create({
      type,
      name: type === 'support' ? 'Support Desk' : name,
      participants,
      group: groupId,
      createdBy: req.user.id,
    });

    const populatedConversation = await ChatConversation.findById(conversation._id)
      .populate('participants', 'firstName lastName role avatar')
      .populate('group', 'name');

    emitConversationRefresh(req, participants, conversation._id);

    res.status(201).json({ success: true, data: populatedConversation });
  } catch (error) {
    next(error);
  }
};

export const listMessages = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const conversation = await ChatConversation.findById(req.params.id);
    if (!conversation || !isParticipant(conversation, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = await ChatMessage.find({ conversation: conversation._id })
      .populate('sender', 'firstName lastName role avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    await ChatMessage.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user.id },
        readBy: { $nin: [req.user.id] },
      },
      { $addToSet: { readBy: req.user.id } }
    );

    emitConversationRefresh(req, [req.user.id], conversation._id);

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id);
    if (!conversation || !isParticipant(conversation, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const body = String(req.body.body || '').trim();
    if (!body) {
      return res.status(400).json({ success: false, message: 'Message body is required' });
    }

    const message = await ChatMessage.create({
      conversation: conversation._id,
      sender: req.user.id,
      body,
      readBy: [req.user.id],
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const recipients = conversation.participants.filter((participantId) => participantId.toString() !== req.user.id.toString());
    sendPushToUsers(recipients, {
      title: `New message from ${req.user.firstName}`,
      body: body.slice(0, 120),
      url: '/chat',
    }).catch(() => {});

    const populatedMessage = await message.populate('sender', 'firstName lastName role avatar');
    emitMessageToConversation(req, conversation._id, populatedMessage);
    emitConversationRefresh(req, conversation.participants, conversation._id);

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    next(error);
  }
};

export const getUnreadSummary = async (req, res, next) => {
  try {
    const conversations = await ChatConversation.find({ participants: req.user.id }).select('_id');
    const summary = await ChatMessage.aggregate([
      {
        $match: {
          conversation: { $in: conversations.map((conversation) => conversation._id) },
          sender: { $ne: new mongoose.Types.ObjectId(req.user.id) },
          readBy: { $nin: [new mongoose.Types.ObjectId(req.user.id)] },
        },
      },
      { $group: { _id: '$conversation', unreadCount: { $sum: 1 } } },
    ]);

    const byConversation = summary.reduce((accumulator, item) => {
      accumulator[item._id.toString()] = item.unreadCount;
      return accumulator;
    }, {});
    const totalUnread = summary.reduce((count, item) => count + item.unreadCount, 0);

    res.status(200).json({ success: true, data: { totalUnread, byConversation } });
  } catch (error) {
    next(error);
  }
};

export const searchChatUsers = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) return res.status(200).json({ success: true, data: [] });

    const users = await User.find({
      isActive: true,
      _id: { $ne: req.user.id },
      $or: [
        { email: new RegExp(query, 'i') },
        { firstName: new RegExp(query, 'i') },
        { lastName: new RegExp(query, 'i') },
      ],
    }).select('firstName lastName email role avatar').limit(20);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
