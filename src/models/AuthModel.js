import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';
import { GET_DB } from '~/config/mongodb.js';
import bcrypt from 'bcrypt';
import { boardModel } from './boardModel.js';
import fs from 'fs';
import path from 'path';

// Define Collection (name & schema)
const USER_COLLECTION_NAME = 'Users';
const USER_COLLECTION_SCHEMA = Joi.object({
  username: Joi.string().required().min(6).max(15).trim().strict(),
  email: Joi.string().required().email().trim().strict(),
  password: Joi.string().required().min(8).trim().strict(),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).strict(),
  sharedPosts: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE))
    .default([]),
  //userCollectionID:Joi.string(),
  savedPosts: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE))
    .default([]),
  admin: Joi.boolean().default(false),
  avatar: Joi.array()
    .items(Joi.string())
    .default(`https://res.cloudinary.com/${process.env.CLOUD_NAME}/image/upload/v1739989897/images_zbe1i2.jpg`),
  slug: Joi.string().required().trim().strict(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),

  resetPasswordToken: Joi.string().default(null),
  resetPasswordExpires: Joi.date().timestamp('javascript').default(null),

  _destroy: Joi.boolean().default(false),
});

const validateBeforeCreate = async data => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async data => {
  try {
    const validData = await validateBeforeCreate(data);
    validData.password = await bcrypt.hash(validData.password, 10);
    delete validData.confirmPassword;

    //chuyển _id thành ObjectId rồi gán vô userId để sài
    const userId = new ObjectId();
    validData._id = userId;
    //validData.userCollectionID = userId;

    //console.log('validData: ', validData) //log ra validData(để debug)
    const createdUser = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .insertOne(validData);

    return createdUser;
  } catch (error) {
    throw new Error(error);
  }
};

const findOne = async query => {
  try {
    const user = await GET_DB().collection(USER_COLLECTION_NAME).findOne(query);

    return user;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async id => {
  try {
    return await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) });
  } catch (error) {
    throw new Error(error);
  }
};
// bat dau join data tai day
const getDetails = async id => {
  try {
    // return await GET_DB().collection(USER_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id),
            _destroy: false,
          },
        },
        {
          $lookup: {
            from: boardModel.BOARD_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'userID',
            as: 'boards',
          },
        },
      ])
      .toArray();

    return result[0] || {};
  } catch (error) {
    throw new Error(error);
  }
};

const updatePassword = async (userId, hashedPassword) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(userId) }, // Chuyển đổi userId thành ObjectId
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date().getTime(), // Cập nhật thời gian sửa đổi
          },
        },
      );

    if (!result.acknowledged) {
      throw new Error('Update password failed');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const updateSharedPosts = async (userId, boardId) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(userId) },
        {
          $addToSet: { sharedPosts: new ObjectId(boardId) },
          $set: { updatedAt: new Date().getTime() },
        },
      );

    if (!result.acknowledged) {
      throw new Error('Update shared posts failed');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const resetPassword = async (email, hashedPassword) => {
  try {
    await GET_DB()
      .collection(AuthModel.USER_COLLECTION_NAME)
      .updateOne(
        { email: email },
        {
          $set: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
          },
        },
      );
  } catch (error) {
    throw new Error(error);
  }
};
const updateSavedPosts = async (userId, boardId) => {
  try {
    const result = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(userId) },
        {
          $addToSet: { savedPosts: new ObjectId(boardId) },
          $set: { updatedAt: new Date().getTime() },
        },
      );

    if (!result.acknowledged) {
      throw new Error('Update saved posts failed');
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const changeUsername = async (userId, username) => {
  try {
    await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { username: username } },
      );
  } catch (error) {
    throw new Error(error);
  }
};

const updateAvatar = async (userId, avatarUrl) => {
  try {
    await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { avatar: avatarUrl } },
      );
  } catch (error) {
    throw new Error(error);
  }
};

const getAvatar = async userId => {
  try {
    const user = await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(userId) });
    return user.avatar;
  } catch (error) {
    throw new Error(error);
  }
};

const getSavedPostsWithPagination = async (userId, page, pageSize) => {
  try {
    const skip = (page - 1) * pageSize;
    const user = await GET_DB()
    .collection(USER_COLLECTION_NAME)
    .findOne({ _id: new ObjectId(userId) });

    // Kiểm tra xem user có tồn tại không
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const savedPosts = user.savedPosts || []; // Lấy danh sách savedPosts từ user
    const totalCount = savedPosts.length; // Tổng số savedPosts

    // Trả về danh sách savedPosts đã phân trang và tổng số lượng
    return {
      savedPosts: savedPosts.slice(skip, skip + pageSize),
      totalCount,
    };
  } catch (error) {
    throw error;
  }
};

const deleteSharedPost = async (userId, postId) => {
  try {
    await GET_DB()
      .collection(USER_COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { sharedPosts: new ObjectId(postId) } },
      );
  } catch (error) {
    throw new Error(error);
  }
}

export const AuthModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  validateBeforeCreate,
  findOne,
  updatePassword,
  updateSharedPosts,
  resetPassword,
  updateSavedPosts,
  changeUsername,
  updateAvatar,
  getAvatar,
  getSavedPostsWithPagination,
  deleteSharedPost
};
