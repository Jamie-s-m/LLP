import { seedContent, contentStatus } from '../seed.js';

export const runSeed = async (req, res, next) => {
  try {
    // Safety: in production require a demo seed token match
    const inProduction = process.env.NODE_ENV === 'production';
    const tokenRequired = process.env.DEMO_SEED_TOKEN;
    if (inProduction) {
      const header = req.headers['x-demo-seed-token'];
      if (!tokenRequired || !header || header !== tokenRequired) {
        return res.status(403).json({ success: false, message: 'Demo seeding requires valid token in production' });
      }
    }

    const result = await seedContent({ mode: 'development', force: true, confirm: true });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const seedStatus = async (req, res, next) => {
  try {
    const status = await contentStatus({ mode: 'development' });
    return res.status(200).json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
};
