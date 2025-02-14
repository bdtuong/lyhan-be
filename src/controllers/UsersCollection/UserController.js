import { AuthModel } from '~/models/AuthModel.js';
import { StatusCodes } from 'http-status-codes';
import { GET_DB } from '~/config/mongodb.js';
import { ObjectId } from 'mongodb';

export const userController = {
  getAllUsers: async (req, res) => {
    try {
      const scoutdatabaseInstance = GET_DB();
      const users = await scoutdatabaseInstance
        .collection('Users')
        .find()
        .toArray();
      res.status(StatusCodes.OK).json(users);
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const scoutdatabaseInstance = GET_DB();
      await scoutdatabaseInstance
        .collection('Users')
        .deleteOne({ _id: new ObjectId(req.params.id) });
      res.status(StatusCodes.OK).json({ message: 'User deleted successfully' });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },
};
