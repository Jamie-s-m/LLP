import { cacheGet, cacheSet, cacheDel } from '../utils/redis.js';

export const leaderboardCache = {
  getLeaderboard: async (type = 'global', limit = 100) => {
    const cacheKey = `leaderboard:${type}:${limit}`;
    return await cacheGet(cacheKey);
  },

  setLeaderboard: async (type = 'global', data, limit = 100, ttl = 300) => {
    const cacheKey = `leaderboard:${type}:${limit}`;
    return await cacheSet(cacheKey, data, ttl);
  },

  invalidateLeaderboard: async (type = 'global') => {
    const cacheKey = `leaderboard:${type}:*`;
    return await cacheDel(cacheKey);
  },
};

export const sessionCache = {
  getSession: async (sessionId) => {
    const cacheKey = `session:${sessionId}`;
    return await cacheGet(cacheKey);
  },

  setSession: async (sessionId, data, ttl = 86400) => {
    const cacheKey = `session:${sessionId}`;
    return await cacheSet(cacheKey, data, ttl);
  },

  deleteSession: async (sessionId) => {
    const cacheKey = `session:${sessionId}`;
    return await cacheDel(cacheKey);
  },
};

export const courseCache = {
  getCourse: async (courseId) => {
    const cacheKey = `course:${courseId}`;
    return await cacheGet(cacheKey);
  },

  setCourse: async (courseId, data, ttl = 3600) => {
    const cacheKey = `course:${courseId}`;
    return await cacheSet(cacheKey, data, ttl);
  },

  invalidateCourse: async (courseId) => {
    const cacheKey = `course:${courseId}`;
    return await cacheDel(cacheKey);
  },

  getCourseList: async (filter = 'all') => {
    const cacheKey = `courses:${filter}`;
    return await cacheGet(cacheKey);
  },

  setCourseList: async (filter = 'all', data, ttl = 600) => {
    const cacheKey = `courses:${filter}`;
    return await cacheSet(cacheKey, data, ttl);
  },
};

export const userStatsCache = {
  getUserStats: async (userId) => {
    const cacheKey = `user:stats:${userId}`;
    return await cacheGet(cacheKey);
  },

  setUserStats: async (userId, data, ttl = 3600) => {
    const cacheKey = `user:stats:${userId}`;
    return await cacheSet(cacheKey, data, ttl);
  },

  invalidateUserStats: async (userId) => {
    const cacheKey = `user:stats:${userId}`;
    return await cacheDel(cacheKey);
  },
};
