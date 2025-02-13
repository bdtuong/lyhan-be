import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { userController } from '../../controllers/UsersCollection/UserController.js';
import { middlewareToken } from '../../middlewares/middlewareToken.js';

const Router2 = express.Router();

Router2.route('/').get(middlewareToken.verifyToken, userController.getAllUsers);

Router2.route('/:id').delete(
  middlewareToken.verifyTokenAndAdminAuth,
  userController.deleteUser,
);

export const UserRoute = Router2;
