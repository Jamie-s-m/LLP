export const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;

    res.status(201).json({
      success: true,
      data: {
        token: 'mock-jwt-token-123456',
        user: {
          id: 'mock-user-id',
          firstName: firstName || 'James',
          lastName: lastName || 'Moriarty',
          email,
          role: 'student'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email } = req.body;

    res.status(200).json({
      success: true,
      data: {
        token: 'mock-jwt-token-123456',
        user: {
          id: 'mock-user-id',
          firstName: 'James',
          lastName: 'Moriarty',
          email,
          role: 'student'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};