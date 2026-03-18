const { verifyAccessToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');
const { User, Role } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findOne({
      where: { id: decoded.id, is_active: true },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      return unauthorized(res, 'User not found or deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired');
    }
    return unauthorized(res, 'Invalid token');
  }
};

module.exports = authenticate;
