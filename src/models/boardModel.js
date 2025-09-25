import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';
import { GET_DB } from '~/config/mongodb.js';
import { CommentModel } from './commentModel.js';
import { CommentInlineModel } from './commentInlineModel.js';
import { AuthModel } from '~/models/AuthModel.js';

// Collection name
const BOARD_COLLECTION_NAME = 'boards';

// Schema
const BOARD_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  userID: Joi.required(), // ObjectId của user tạo board

  title: Joi.string().required().min(1).max(100).trim(),

  boardCollectionID: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .custom((value, helpers) => {
      try {
        return new ObjectId(value);
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
            return new ObjectId(value);
          } catch (error) {
            return helpers.error('any.invalid');
          }
        })
    )
    .default([]),

  description: Joi.string().required().min(1).trim(),
  language: Joi.string().required().trim(),
  content: Joi.string().required(),

  // nhiều ảnh thay vì 1
  images: Joi.array().items(Joi.string().uri()).default([]),

  // mảng likes
  likes: Joi.array().items(Joi.object()).default([]),

  // mảng hashtags
  hashtags: Joi.array().items(Joi.string()).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
});

// Validate
const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

// helper kiểm tra ObjectId hợp lệ
function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

// parse hashtag
function extractHashtags(text) {
  if (!text) return [];
  const regex = /#[\p{L}\w]+/gu;
  return text.match(regex) || [];
}

// Create new board
const createNew = async (data) => {
  try {
    const hashtags = extractHashtags(data.content);

    const validData = await validateBeforeCreate({
      ...data,
      hashtags,
    });

    const createdBoard = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .insertOne(validData);

    return createdBoard;
  } catch (error) {
    throw new Error(error);
  }
};

// Find by ID
const findOneById = async (id) => {
  try {
    if (!isValidObjectId(id)) return null; // ✅ chặn BSONError
    return await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) });
  } catch (error) {
    throw new Error(error);
  }
};

// Update one board by ID
const updateOneById = async (id, updateData) => {
  try {
    if (!isValidObjectId(id)) return null;
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    return result.value;
  } catch (error) {
    throw new Error(error);
  }
};

// Get details with comments + commentsCount
const getDetails = async (id) => {
  try {
    if (!isValidObjectId(id)) return null; // ✅ chặn BSONError
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
        {
          $addFields: {
            commentsCount: { $size: '$comments' },
            likesCount: { $size: { $ifNull: ['$likes', []] } },
          },
        },
      ])
      .toArray();

    return result[0] || null;
  } catch (error) {
    throw new Error(error);
  }
};

// Update share list
const updateUserShare = async (boardId, userId) => {
  try {
    if (!isValidObjectId(boardId) || !isValidObjectId(userId)) return null;
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(boardId) },
        {
          $addToSet: { userShareCollectionID: new ObjectId(userId) },
          $set: { updatedAt: new Date().getTime() },
        }
      );

    if (!result.acknowledged) {
      throw new Error('Update user share failed');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Pagination
const getBoardsWithPagination = async (page, pageSize) => {
  try {
    const skip = (page - 1) * pageSize;

    const boards = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: { _destroy: false } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $lookup: {
            from: CommentModel.COMMENT_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'boardID',
            as: 'comments',
          },
        },
        {
          $addFields: {
            commentsCount: { $size: '$comments' },
            likesCount: { $size: { $ifNull: ['$likes', []] } },
          },
        },
        {
          $project: {
            comments: 0,
          },
        },
      ])
      .toArray();

    const totalCount = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .countDocuments({ _destroy: false });

    return { boards, totalCount };
  } catch (error) {
    throw error;
  }
};

// Search
const searchPosts = async (searchTerm) => {
  try {
    const regexOptions = { $options: 'i' };
    const queries = [{ hashtags: { $regex: searchTerm, ...regexOptions } }];

    if (!searchTerm.startsWith('#')) {
      queries.push({ hashtags: { $regex: `#${searchTerm}`, ...regexOptions } });
    }

    const results = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        {
          $lookup: {
            from: AuthModel.USER_COLLECTION_NAME,
            localField: 'userID',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { title: { $regex: searchTerm, $options: 'i' } },
              { language: { $regex: searchTerm, $options: 'i' } },
              { 'userInfo.username': { $regex: searchTerm, $options: 'i' } },
              ...queries,
            ],
          },
        },
      ])
      .toArray();

    return results;
  } catch (error) {
    throw error;
  }
};

// Get boards by hashtag
const getBoardsByHashtag = async (tag, page, pageSize) => {
  try {
    const skip = (page - 1) * pageSize;
    const regex = new RegExp(tag, 'i');

    const boards = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            _destroy: false,
            hashtags: { $regex: regex },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $lookup: {
            from: CommentModel.COMMENT_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'boardID',
            as: 'comments',
          },
        },
        {
          $addFields: {
            commentsCount: { $size: '$comments' },
            likesCount: { $size: { $ifNull: ['$likes', []] } },
          },
        },
        {
          $project: {
            comments: 0,
          },
        },
      ])
      .toArray();

    const totalCount = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .countDocuments({
        _destroy: false,
        hashtags: { $regex: regex },
      });

    return { boards, totalCount };
  } catch (error) {
    throw error;
  }
};

// 🆕 Get boards by userId
const getBoardsByUser = async (userId, page = 1, pageSize = 9) => {
  try {
    if (!isValidObjectId(userId)) return { boards: [], totalCount: 0 };

    const skip = (page - 1) * pageSize;

    const boards = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            _destroy: false,
            userID: new ObjectId(userId),
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $lookup: {
            from: CommentModel.COMMENT_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'boardID',
            as: 'comments',
          },
        },
        {
          $addFields: {
            commentsCount: { $size: '$comments' },
            likesCount: { $size: { $ifNull: ['$likes', []] } },
          },
        },
        {
          $project: {
            comments: 0,
          },
        },
      ])
      .toArray();

    const totalCount = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .countDocuments({
        _destroy: false,
        userID: new ObjectId(userId),
      });

    return { boards, totalCount };
  } catch (error) {
    throw error;
  }
};

// Delete
const deletePost = async (postId) => {
  try {
    if (!isValidObjectId(postId)) return null;
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(postId) });

    if (!result.acknowledged) {
      throw new Error('Delete post failed');
    }
    return result;
  } catch (error) {
    throw error;
  }
};

const updateBoard = async (postId, updateData) => {
  try {
    if (!isValidObjectId(postId)) return null

    // Nếu có content mới thì parse lại hashtags
    if (updateData.content) {
      updateData.hashtags = extractHashtags(updateData.content)
    }

    updateData.updatedAt = new Date().getTime()

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(postId) },
        { $set: updateData },
        { returnDocument: "after" }
      )

    return result.value
  } catch (error) {
    throw error
  }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  updateOneById,
  getDetails,
  updateUserShare,
  getBoardsWithPagination,
  searchPosts,
  deletePost,
  getBoardsByHashtag,
  getBoardsByUser,
  updateBoard // 🆕 export thêm
};
