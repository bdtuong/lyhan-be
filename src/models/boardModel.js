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

  // ✅ Cờ kiểm duyệt: true = đang chờ admin duyệt, false = đã duyệt hiển thị công khai
  isPending: Joi.boolean().default(true),

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

    // alias hỗ trợ nếu FE gửi nhầm 'ispending'
    const normalized = { ...data };
    if (typeof normalized.isPending === 'undefined' && typeof normalized.ispending !== 'undefined') {
      normalized.isPending = Boolean(normalized.ispending);
      delete normalized.ispending;
    }

    const validData = await validateBeforeCreate({
      ...normalized,
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

// Find by ID (KHÔNG lọc isPending ở đây vì dùng cho trang chi tiết nội bộ; trang public nên dùng getDetails)
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

    // alias ispending -> isPending nếu có
    if (typeof updateData.isPending === 'undefined' && typeof updateData.ispending !== 'undefined') {
      updateData.isPending = Boolean(updateData.ispending);
      delete updateData.ispending;
    }

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date().getTime() } },
        { returnDocument: 'after' }
      );

    return result.value;
  } catch (error) {
    throw new Error(error);
  }
};

// Get details with comments + commentsCount (mặc định CHỈ trả bài đã duyệt)
const getDetails = async (id, options = { includePending: false }) => {
  try {
    if (!isValidObjectId(id)) return null; // ✅ chặn BSONError

    const matchStage = {
      _id: new ObjectId(id),
      _destroy: false,
      ...(options?.includePending ? {} : { isPending: false }),
    };

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: matchStage },
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

// Pagination (mặc định ẩn pending; truyền { includePending: true } để hiện cả pending, dùng cho admin)
const getBoardsWithPagination = async (page, pageSize, options = { includePending: false }) => {
  try {
    const skip = (page - 1) * pageSize;

    const matchStage = {
      _destroy: false,
      ...(options?.includePending ? {} : { isPending: false }),
    };

    const boards = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: matchStage },
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
        { $project: { comments: 0 } },
      ])
      .toArray();

    const totalCount = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .countDocuments(matchStage);

    return { boards, totalCount };
  } catch (error) {
    throw error;
  }
};

// Search (mặc định ẩn pending)
// Search (mặc định ẩn pending) — CHỈ tìm theo post, không join user
const searchPosts = async (searchTerm, options = { includePending: false }) => {
  try {
    const term = String(searchTerm || "").trim();
    if (!term) return [];

    // regex i/Unicode: tìm trong tiêu đề, mô tả, nội dung, hashtag
    const regex = new RegExp(term, "i");
    const hashtagOrs = [{ hashtags: { $regex: regex } }];
    if (!term.startsWith("#")) {
      hashtagOrs.push({ hashtags: { $regex: new RegExp(`#${term}`, "i") } });
    }

    const matchStage = {
      _destroy: false,
      ...(options?.includePending ? {} : { isPending: false }),
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },  // 👈 thêm description
        { content: { $regex: regex } },      // 👈 thêm content
        ...hashtagOrs
      ]
    };

    const results = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ["$likes", []] } }
          }
        },
        // Không cần $lookup userInfo nữa
      ])
      .toArray();

    return results;
  } catch (error) {
    throw error;
  }
};


// Get boards by hashtag (mặc định ẩn pending)
const getBoardsByHashtag = async (tag, page, pageSize, options = { includePending: false }) => {
  try {
    const skip = (page - 1) * pageSize;
    const regex = new RegExp(tag, 'i');

    const matchStage = {
      _destroy: false,
      hashtags: { $regex: regex },
      ...(options?.includePending ? {} : { isPending: false }),
    };

    const boards = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: matchStage },
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
        { $project: { comments: 0 } },
      ])
      .toArray();

    const totalCount = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .countDocuments(matchStage);

    return { boards, totalCount };
  } catch (error) {
    throw error;
  }
};

// 🆕 Get boards by userId (mặc định ẩn pending)
const getBoardsByUser = async (userId, page = 1, pageSize = 9, options = { includePending: false }) => {
  try {
    if (!isValidObjectId(userId)) return { boards: [], totalCount: 0 };

    const skip = (page - 1) * pageSize;

    const matchStage = {
      _destroy: false,
      userID: new ObjectId(userId),
      ...(options?.includePending ? {} : { isPending: false }),
    };

    const boards = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: matchStage },
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
        { $project: { comments: 0 } },
      ])
      .toArray();

    const totalCount = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .countDocuments(matchStage);

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
    if (!isValidObjectId(postId)) return null;

    // alias ispending -> isPending nếu có
    if (typeof updateData.isPending === 'undefined' && typeof updateData.ispending !== 'undefined') {
      updateData.isPending = Boolean(updateData.ispending);
      delete updateData.ispending;
    }

    // Nếu có content mới thì parse lại hashtags
    if (updateData.content) {
      updateData.hashtags = extractHashtags(updateData.content);
    }

    updateData.updatedAt = new Date().getTime();

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(postId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    return result.value;
  } catch (error) {
    throw error;
  }
};

// ✅ Tiện ích duyệt bài: chuyển isPending=false
const approveBoard = async (postId) => {
  return updateBoard(postId, { isPending: false });
};

// ✅ Tiện ích đặt trạng thái pending tuỳ ý (ví dụ hoàn/bỏ duyệt)
const setPendingStatus = async (postId, isPending) => {
  return updateBoard(postId, { isPending: Boolean(isPending) });
};

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
  updateBoard,
  approveBoard,      // 🆕
  setPendingStatus,  // 🆕
};
