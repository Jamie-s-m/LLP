import Lesson from '../models/Lesson.js';
import { hasModeratorPermission, isOwnerId } from '../middleware/auth.js';

// Shared by lessonController and exerciseController (previously two near-identical,
// independently-maintained copies of the same check) - resolves whether `user` manages the
// course that owns `lessonId`. lesson.course populates to null if the referenced course was
// since deleted (no cascade cleanup of orphaned lessons exists) - only an admin/moderator
// can manage/clean up an orphaned lesson at that point, since there's no instructor left to
// own it.
export const assertLessonOwnership = async (lessonId, user) => {
  const lesson = await Lesson.findById(lessonId).populate('course', 'instructor');
  if (!lesson) return { error: { status: 404, message: 'Lesson not found' } };
  if (!lesson.course) {
    if (user.role !== 'admin' && !hasModeratorPermission(user, 'catalogContentQa')) {
      return { error: { status: 404, message: 'Course not found' } };
    }
    return { lesson };
  }
  if (user.role !== 'admin' && !hasModeratorPermission(user, 'catalogContentQa') && !isOwnerId(lesson.course.instructor, user.id)) {
    return { error: { status: 403, message: 'You do not manage this course' } };
  }
  return { lesson };
};
