import { jest } from '@jest/globals';
import {
  authorizeRoleOrPermission,
  defaultModeratorPermissions,
  hasAnyModeratorPermission,
  hasModeratorPermission,
  normalizeModeratorPermissions,
} from '../src/middleware/auth.js';

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
};

describe('moderator permission helpers', () => {
  it('creates a fully disabled default moderator permission set', () => {
    expect(defaultModeratorPermissions()).toEqual({
      communityModeration: false,
      supportChat: false,
      catalogContentQa: false,
      limitedUserManagement: false,
    });
  });

  it('normalizes moderator permissions to known boolean flags only', () => {
    expect(
      normalizeModeratorPermissions({
        communityModeration: 1,
        supportChat: 'yes',
        catalogContentQa: 0,
        limitedUserManagement: null,
        unknownScope: true,
      })
    ).toEqual({
      communityModeration: true,
      supportChat: true,
      catalogContentQa: false,
      limitedUserManagement: false,
    });
  });

  it('grants moderator permissions only to admins or moderators with that scope', () => {
    const moderator = {
      role: 'moderator',
      moderatorPermissions: {
        communityModeration: false,
        supportChat: true,
        catalogContentQa: false,
        limitedUserManagement: false,
      },
    };

    expect(hasModeratorPermission({ role: 'admin' }, 'supportChat')).toBe(true);
    expect(hasModeratorPermission(moderator, 'supportChat')).toBe(true);
    expect(hasModeratorPermission(moderator, 'catalogContentQa')).toBe(false);
    expect(hasModeratorPermission({ role: 'teacher' }, 'supportChat')).toBe(false);
    expect(hasAnyModeratorPermission(moderator, ['catalogContentQa', 'supportChat'])).toBe(true);
    expect(hasAnyModeratorPermission(moderator, ['catalogContentQa', 'communityModeration'])).toBe(false);
  });
});

describe('authorizeRoleOrPermission middleware', () => {
  it('allows admins through role access', () => {
    const middleware = authorizeRoleOrPermission({ roles: ['admin'], permissions: ['supportChat'] });
    const next = jest.fn();
    const response = createResponse();

    middleware({ user: { role: 'admin' } }, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
  });

  it('allows moderators with the required scope', () => {
    const middleware = authorizeRoleOrPermission({ roles: ['admin'], permissions: ['supportChat'] });
    const next = jest.fn();
    const response = createResponse();

    middleware(
      {
        user: {
          role: 'moderator',
          moderatorPermissions: {
            communityModeration: false,
            supportChat: true,
            catalogContentQa: false,
            limitedUserManagement: false,
          },
        },
      },
      response,
      next
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
  });

  it('rejects users without a matching role or moderator scope', () => {
    const middleware = authorizeRoleOrPermission({ roles: ['admin'], permissions: ['supportChat'] });
    const next = jest.fn();
    const response = createResponse();

    middleware(
      {
        user: {
          role: 'parent',
          moderatorPermissions: defaultModeratorPermissions(),
        },
      },
      response,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });
});
