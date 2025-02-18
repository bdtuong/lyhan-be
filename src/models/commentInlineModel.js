import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';
// Define Collection (name & schema)

const COMMENT_COLLECTIONINLINE_NAME = 'commentsInline';
const COMMENT_COLLECTIONINLINE_SCHEMA = Joi.object({
  // optional có thể thêm lượt like sau
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  boardID: Joi.required(),
  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  author: Joi.required(),
  content: Joi.string().required().min(1),
  username: Joi.string().required(),
  lineNumber: Joi.number().required(),

  // bắt buộc
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
});

const validateBeforeCreate = async data => {
  return await COMMENT_COLLECTIONINLINE_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createComment = async data => {
  try {
    const validData = await validateBeforeCreate(data);
    const createdComment = await GET_DB()
      .collection(COMMENT_COLLECTIONINLINE_NAME)
      .insertOne(validData);

    return createdComment;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async id => {
  try {
    return await GET_DB()
      .collection(COMMENT_COLLECTIONINLINE_NAME)
      .findOne({ _id: new ObjectId(id) });
  } catch (error) {
    throw new Error(error);
  }
};
// querry aggregate để lấy thông tin về
const getDetails = async id => {
  try {
    return await GET_DB()
      .collection(COMMENT_COLLECTIONINLINE_NAME)
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id),
            _destroy: false,
          },
        },
        {
          $lookup: {
            from: CommentModel.COMMENT_COLLECTIONINLINE_NAME,
            localField: '_id',
            foreignField: 'commentId',
            as: 'authorComments',
          },
        },
      ])
      .toArray();
  } catch (error) {
    throw new Error(`Error in getDetails: ${error.message}`);
  }
};

export const CommentInlineModel = {
  COMMENT_COLLECTIONINLINE_NAME,
  COMMENT_COLLECTIONINLINE_SCHEMA,
  createComment,
  findOneById,
  getDetails,
};
