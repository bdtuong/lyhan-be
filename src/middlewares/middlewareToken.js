import jwt from 'jsonwebtoken';

const middlewareToken = {
  verifyToken: (req, res, next) => {
    try {
      const token = req.cookies['jwt'];
      if (!token) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Access token is required to access this resource.',
        );
      }

      // Verify token
      jwt.verify(token, env.JWT_ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
          throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            'Invalid or expired token.',
          );
        }

        // Find user from decoded token (assuming you save userId in token)
        const user = await AuthModel.findOneById(decoded.userId);
        if (!user) {
          throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            'User does not exist or is inactive.',
          );
        }

        // Attach user to request object for further use in controller
        req.user = user;
        next();
      });
    } catch (error) {
      next(error);
    }
  },
  verifyTokenAndAdminAuth: (req, res, next) => {
    middlewareToken.verifyToken(req, res, () => {
      if (req.user.id === req.params.id || req.user.admin) {
        next();
      } else {
        return res
          .status(403)
          .json({ message: 'You are not allowed to delete other' });
      }
    });
  },
  verifyTokenAndAdmin: (req, res, next) => {
    verifyToken(req, res, () => {
      if (req.User.admin) {
        next();
      } else {
        return res
          .status(403)
          .json({ message: 'You are not allowed to access this resource' });
      }
    });
  },
};

export { middlewareToken };
