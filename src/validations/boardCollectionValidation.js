import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError.js';

const createNew = async (req, res, next) => {
  const correctCondition = Joi.object({
    title: Joi.string(),
  });

  try {
    //kiểm tra dữ liệu gửi lên có phù hợp hay không?
    await correctCondition.validateAsync(req.body, { abortEarly: false });

    //Validate dữ liệu hợp lệ xong req đi tiếp sang controller
    next();
  } catch (error) {
    next(
      new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message),
    );
  }
};

export const boardCollectionValidation = {
  createNew,
};
