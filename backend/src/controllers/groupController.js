import Group from '../models/Group.js';
import User from '../models/User.js';
import { isOwnerId } from '../middleware/auth.js';

const isGroupManager = (group, userId) => {
  const id = userId.toString();
  return isOwnerId(group.creator, userId) || group.moderators.some((mod) => mod.toString() === id);
};

// group.members.length alone counts dangling refs left behind by a deleted user's account
// (Group documents are never cleaned up on user deletion) as if they still occupied a seat,
// which can make a group with real capacity left over wrongly appear/become permanently full.
const countRealMembers = (memberIds) => User.countDocuments({ _id: { $in: memberIds } });

export const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find()
      .populate('creator', 'firstName lastName email')
      .populate('members', 'firstName lastName')
      .populate('joinRequests.user', 'firstName lastName email');

    // joinRequests carries every requester's name+email - only that group's own manager
    // (creator/moderator) or an admin should ever see it, not every authenticated caller.
    // Also drop members/join-requests whose referenced user was since deleted (population
    // leaves a null entry rather than removing it), so counts reflect real people.
    const serialized = groups.map((group) => {
      const plain = group.toObject();
      plain.members = plain.members.filter(Boolean);
      const isManager = req.user.role === 'admin' || isGroupManager(group, req.user.id);
      if (isManager) {
        plain.joinRequests = plain.joinRequests.filter((request) => request.user);
      } else {
        plain.joinRequests = plain.joinRequests.some((request) => request.user?._id?.toString() === req.user.id.toString())
          // A non-manager may still see their OWN pending request (so the UI can show
          // "pending"), just not anyone else's.
          ? plain.joinRequests.filter((request) => request.user?._id?.toString() === req.user.id.toString())
          : [];
      }
      return plain;
    });

    res.status(200).json({ success: true, data: serialized });
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only teachers can create study groups' });
    }

    const { name, description, language, level, maxMembers } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Group name and description are required' });
    }

    const group = await Group.create({
      name,
      description,
      language,
      level,
      maxMembers,
      creator: req.user.id,
      members: [req.user.id],
      moderators: [req.user.id],
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.members.some((member) => member.toString() === req.user.id.toString())) {
      return res.status(400).json({ success: false, message: 'User already joined this group' });
    }

    if (group.joinRequests.some((request) => request.user.toString() === req.user.id.toString())) {
      return res.status(400).json({ success: false, message: 'You already requested to join this group' });
    }

    if (group.maxMembers && (await countRealMembers(group.members)) >= group.maxMembers) {
      return res.status(400).json({ success: false, message: 'This group is full' });
    }

    group.joinRequests.push({ user: req.user.id });
    await group.save();

    res.status(200).json({ success: true, message: 'Join request sent. The group teacher will review it.', data: group });
  } catch (error) {
    next(error);
  }
};

export const approveJoinRequest = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!isGroupManager(group, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only the group teacher or a moderator can approve join requests' });
    }

    const request = group.joinRequests.find((entry) => entry.user.toString() === req.params.userId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Join request not found' });
    }

    if (group.maxMembers && (await countRealMembers(group.members)) >= group.maxMembers) {
      return res.status(400).json({ success: false, message: 'This group is full' });
    }

    group.joinRequests = group.joinRequests.filter((entry) => entry.user.toString() !== req.params.userId);
    if (!group.members.some((member) => member.toString() === req.params.userId)) {
      group.members.push(request.user);
    }
    await group.save();

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

export const rejectJoinRequest = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!isGroupManager(group, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only the group teacher or a moderator can reject join requests' });
    }

    const requestExists = group.joinRequests.some((entry) => entry.user.toString() === req.params.userId);
    if (!requestExists) {
      return res.status(404).json({ success: false, message: 'Join request not found' });
    }

    group.joinRequests = group.joinRequests.filter((entry) => entry.user.toString() !== req.params.userId);
    await group.save();

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};
