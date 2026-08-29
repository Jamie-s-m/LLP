import jwt from 'jsonwebtoken';
import generateToken from '../src/utils/generateToken.js';

describe('generateToken', () => {
  const secret = process.env.JWT_SECRET || 'local-development-only-secret';

  test('signs a token containing the given id and default role', () => {
    const token = generateToken('user-123');
    const decoded = jwt.verify(token, secret);

    expect(decoded.id).toBe('user-123');
    expect(decoded.role).toBe('student');
  });

  test('signs a token with a custom role', () => {
    const token = generateToken('user-456', 'admin');
    const decoded = jwt.verify(token, secret);

    expect(decoded.role).toBe('admin');
  });

  test('rejects verification with the wrong secret', () => {
    const token = generateToken('user-789');

    expect(() => jwt.verify(token, `${secret}-wrong`)).toThrow();
  });
});
