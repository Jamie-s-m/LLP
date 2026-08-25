import { createClient } from 'redis';
import logger from './logger.js';

let redisClient = null;
let isConnected = false;

const connectRedis = async () => {
  if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    logger.warn('Redis not configured. Caching disabled.');
    return null;
  }

  if (!process.env.REDIS_URL) {
    logger.info('Redis not configured for development. Skipping connection.');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Too many reconnection attempts, giving up');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

const isRedisConnected = () => {
  return isConnected && redisClient && redisClient.isOpen;
};

const cacheGet = async (key) => {
  if (!isRedisConnected()) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 3600) => {
  if (!isRedisConnected()) return false;

  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
};

const cacheDel = async (key) => {
  if (!isRedisConnected()) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
};

const cacheInvalidatePattern = async (pattern) => {
  if (!isRedisConnected()) return false;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error(`Redis pattern invalidation error for ${pattern}:`, error);
    return false;
  }
};

const disconnectRedis = async () => {
  if (redisClient && isConnected) {
    try {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
    }
  }
};

export {
  connectRedis,
  getRedisClient,
  isRedisConnected,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheInvalidatePattern,
  disconnectRedis,
};
