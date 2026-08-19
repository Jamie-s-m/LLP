import Group from '../models/Group.js';

export const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find().populate('creator', 'firstName lastName email').populate('members', 'firstName lastName');
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
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

    group.members.push(req.user.id);
    await group.save();

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};
