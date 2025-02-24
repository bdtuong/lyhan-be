import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';
import { GET_DB } from '~/config/mongodb.js';
import { CommentModel } from './commentModel.js';
import { CommentInlineModel } from './commentInlineModel.js';

// Define Collection (name & schema)
const BOARD_COLLECTION_NAME = 'boards';
const BOARD_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  userID: Joi.required(),
  title: Joi.string().required().max(60).trim(),

  boardCollectionID: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .custom((value, helpers) => {
      try {
        return new ObjectId(value); // Chuyển thành ObjectId
      } catch (error) {
        return helpers.error('any.invalid');
      }
    })
    .default(new ObjectId('677e53f474f256608d6044a2')),
  userShareCollectionID: Joi.array()
    .items(
      Joi.string()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE)
        .custom((value, helpers) => {
          try {
            return new ObjectId(value); // Chuyển thành ObjectId
          } catch (error) {
            return helpers.error('any.invalid');
          }
        }),
    )
    .default([]),
  description: Joi.string().required().max(60).trim(),
  language: Joi.string().required().max(60).trim(),
  content: Joi.string().required(),
  username: Joi.string().required(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
});

const validateBeforeCreate = async data => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async data => {
  try {
    const validData = await validateBeforeCreate(data);
    const createdBoard = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .insertOne(validData);

    return createdBoard;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async id => {
  try {
    return await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) });
  } catch (error) {
    throw new Error(error);
  }
};

// lay board da dc phan loai theo thoi gian
const getDetails = async id => {
  try {
    // return await GET_DB().collection(USER_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id),
            _destroy: false,
          },
        },
        {
          $lookup: {
            from: CommentModel.COMMENT_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'boardID',
            as: 'comments',
          },
        },
        {
          $lookup: {
            from: CommentInlineModel.COMMENT_COLLECTIONINLINE_NAME,
            localField: '_id',
            foreignField: 'boardID',
            as: 'commentsInline',
          },
        },
      ])
      .toArray();

    return result[0] || {};
  } catch (error) {
    throw new Error(error);
  }
};

const updateUserShare = async (boardId, userId) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(boardId) },
        {
          $addToSet: { userShareCollectionID: new ObjectId(userId) },
          $set: { updatedAt: new Date().getTime() },
        },
      );

    if (!result.acknowledged) {
      throw new Error('Update user share failed');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const getBoardsWithPagination = async (page, pageSize) => {
  try {
    const skip = (page - 1) * pageSize; // Tính số bản ghi cần bỏ qua
    const boards = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const totalCount = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .countDocuments(); // Lấy tổng số bản ghi

    return {
      boards,
      totalCount,
    };
  } catch (error) {
    throw error;
  }
};



const searchPosts = async (searchTerm) => {
  try{
    const results = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)  
      .find(
      { title: { $regex: searchTerm, $options: 'i' } })
      .toArray()
    return results;
  } catch (error) {
    throw error;
  }
};

const deletePost = async (postId) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .deleteOne(
        { _id: new ObjectId(postId) },
      );
    if (!result.acknowledged) {
      throw new Error('Delete post failed');
    }
    return result;
  } catch (error) {
    throw error;
  }
};

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  updateUserShare,
  getBoardsWithPagination,
  searchPosts,
  deletePost
};
