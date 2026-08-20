import mongoose from 'mongoose';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { sendPushToUsers } from '../utils/push.js';

const isParticipant = (conversation, userId) =>
  conversation.participants.some((participant) => participant.toString() === userId.toString());

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await ChatConversation.find({ participants: req.user.id })
      .populate('participants', 'firstName lastName role avatar')
      .populate('group', 'name')
      .sort({ lastMessageAt: -1 });

    res.status(200).json({ success: true, data: conversations });
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
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      if (admins.length === 0) {
        return res.status(400).json({ success: false, message: 'Support is not available right now' });
      }

      participants = [...new Set([req.user.id, ...admins.map((admin) => admin._id.toString())])];
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
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const recipients = conversation.participants.filter((participantId) => participantId.toString() !== req.user.id.toString());
    sendPushToUsers(recipients, {
      title: `New message from ${req.user.firstName}`,
      body: body.slice(0, 120),
      url: '/chat',
    }).catch(() => {});

    res.status(201).json({ success: true, data: await message.populate('sender', 'firstName lastName role avatar') });
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
