import { StatusCodes } from 'http-status-codes';

import { boardCollectionService } from '../../services/boardCollectionService.js';

const createNew = async (req, res, next) => {
  try {
    const createdBoardCollection = await boardCollectionService.createNew(
      req.body,
    );
    //throw new ApiError(StatusCodes.BAD_GATEWAY, 'Error from Controller: API create new board')
    //có kết quả thì trả về Client
    res.status(StatusCodes.CREATED).json(createdBoardCollection);
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const titleid = req.params.id;

    const boardcollection = await boardCollectionService.getDetails(titleid);

    res.status(StatusCodes.OK).json(boardcollection);
  } catch (error) {
    next(error);
  }
};

export const boardCollectionController = {
  createNew,
  getDetails,
};
