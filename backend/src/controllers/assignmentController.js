import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Exercise from '../models/Exercise.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import ExerciseAttempt from '../models/ExerciseAttempt.js';
import { hasModeratorPermission, isOwnerId } from '../middleware/auth.js';

// Mirrors courseController's canManageCourse exactly: the caller must manage the COURSE an
// assignment belongs to, not the assignment itself - always via isOwnerId (never a hand-rolled
// `.toString() === .toString()` on a possibly-populated field, see auth.js's isOwnerId comment).
const canManageCourse = (course, user) =>
  user.role === 'admin' ||
  hasModeratorPermission(user, 'catalogContentQa') ||
  isOwnerId(course.instructor, user.id);

// Combines assignment.students with the members of assignment.group (if any), de-duplicated.
// Both may hold populated docs or raw ObjectIds depending on how the assignment was fetched,
// so everything is normalized through its own _id before de-duping/stringifying.
const resolveTargetStudentIds = async (assignment) => {
  const directIds = (assignment.students || []).map((s) => (s._id || s).toString());
  let groupIds = [];
  if (assignment.group) {
    const group = await Group.findById(assignment.group._id || assignment.group).select('members');
    groupIds = (group?.members || []).map((m) => (m._id || m).toString());
  }
  return Array.from(new Set([...directIds, ...groupIds]));
};

// Which of the given student ids have completed this assignment's lesson/exercise.
// Returns a Set of completed student id strings.
const computeCompletedStudentIds = async (assignment, studentIds) => {
  if (studentIds.length === 0) return new Set();

  if (assignment.lesson) {
    const lessonId = (assignment.lesson._id || assignment.lesson).toString();
    const progressRecords = await Progress.find({
      user: { $in: studentIds },
      course: assignment.course._id || assignment.course,
    }).select('user completedLessons');

    const completed = new Set();
    progressRecords.forEach((record) => {
      const hasLesson = (record.completedLessons || []).some((id) => id.toString() === lessonId);
      if (hasLesson) completed.add(record.user.toString());
    });
    return completed;
  }

  if (assignment.exercise) {
    const attempts = await ExerciseAttempt.find({
      user: { $in: studentIds },
      exercise: assignment.exercise._id || assignment.exercise,
      status: 'graded',
      isCorrect: true,
    }).select('user');

    return new Set(attempts.map((attempt) => attempt.user.toString()));
  }

  return new Set();
};

// @desc    Create an assignment (a lesson or exercise, assigned to specific students and/or a
//          whole study group, with an optional due date)
// @route   POST /api/assignments
// @access  Private (manager of the target course)
export const createAssignment = async (req, res, next) => {
  try {
    const { title, description, courseId, lessonId, exerciseId, studentIds, groupId, dueDate } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    if ((lessonId && exerciseId) || (!lessonId && !exerciseId)) {
      return res.status(400).json({ success: false, message: 'Exactly one of lessonId or exerciseId is required' });
    }

    if (lessonId) {
      const lesson = await Lesson.findById(lessonId).select('course');
      if (!lesson || lesson.course.toString() !== courseId.toString()) {
        return res.status(400).json({ success: false, message: 'Lesson does not belong to this course' });
      }
    }

    if (exerciseId) {
      const exercise = await Exercise.findById(exerciseId).select('lesson');
      const exerciseLesson = exercise ? await Lesson.findById(exercise.lesson).select('course') : null;
      if (!exerciseLesson || exerciseLesson.course.toString() !== courseId.toString()) {
        return res.status(400).json({ success: false, message: 'Exercise does not belong to this course' });
      }
    }

    const hasStudents = Array.isArray(studentIds) && studentIds.length > 0;
    if (!hasStudents && !groupId) {
      return res.status(400).json({ success: false, message: 'At least one of studentIds or groupId is required' });
    }

    if (groupId) {
      const group = await Group.findById(groupId).select('_id');
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
    }

    const assignment = await Assignment.create({
      title,
      description,
      course: courseId,
      lesson: lessonId || undefined,
      exercise: exerciseId || undefined,
      assignedBy: req.user.id,
      students: hasStudents ? studentIds : [],
      group: groupId || undefined,
      dueDate,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    List assignments for a course, with a light completed/total count per assignment
// @route   GET /api/assignments/course/:courseId
// @access  Private (manager of the course)
export const getAssignmentsForCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId).select('instructor');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    const assignments = await Assignment.find({ course: req.params.courseId }).sort({ createdAt: -1 });

    const data = await Promise.all(
      assignments.map(async (assignment) => {
        const targetStudentIds = await resolveTargetStudentIds(assignment);
        const completed = await computeCompletedStudentIds(assignment, targetStudentIds);
        return {
          ...assignment.toObject(),
          completedCount: completed.size,
          totalCount: targetStudentIds.length,
        };
      })
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get one assignment with a full per-student completion breakdown
// @route   GET /api/assignments/:id
// @access  Private (manager of the assignment's course)
export const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const course = await Course.findById(assignment.course).select('instructor');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    const targetStudentIds = await resolveTargetStudentIds(assignment);
    const completed = await computeCompletedStudentIds(assignment, targetStudentIds);
    const students = await User.find({ _id: { $in: targetStudentIds } }).select('firstName lastName');
    const studentsById = new Map(students.map((student) => [student._id.toString(), student]));

    const studentBreakdown = targetStudentIds.map((studentId) => {
      const student = studentsById.get(studentId);
      return {
        studentId,
        name: student ? `${student.firstName} ${student.lastName}` : null,
        completed: completed.has(studentId),
      };
    });

    res.status(200).json({ success: true, data: { ...assignment.toObject(), students: studentBreakdown } });
  } catch (error) {
    next(error);
  }
};

// @desc    Assignments (from direct assignment or a group the caller belongs to) with the
//          caller's own completion status
// @route   GET /api/assignments/mine
// @access  Private
export const getMyAssignments = async (req, res, next) => {
  try {
    const myGroups = await Group.find({ members: req.user.id }).select('_id');
    const myGroupIds = myGroups.map((group) => group._id);

    const assignments = await Assignment.find({
      $or: [{ students: req.user.id }, { group: { $in: myGroupIds } }],
    }).sort({ createdAt: -1 });

    const data = await Promise.all(
      assignments.map(async (assignment) => {
        const completed = await computeCompletedStudentIds(assignment, [req.user.id.toString()]);
        return {
          ...assignment.toObject(),
          completed: completed.has(req.user.id.toString()),
        };
      })
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an assignment's title/description/dueDate/students/group
// @route   PUT /api/assignments/:id
// @access  Private (manager of the assignment's course)
export const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const course = await Course.findById(assignment.course).select('instructor');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    // Deliberately excludes course/lesson/exercise - those define the assignment's identity;
    // changing them should be a delete+recreate, not an update.
    const allowedFields = ['title', 'description', 'dueDate', 'students', 'group'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) assignment[field] = req.body[field];
    });
    await assignment.save();

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private (manager of the assignment's course)
export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const course = await Course.findById(assignment.course).select('instructor');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
