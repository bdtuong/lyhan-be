import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb.js';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';
// Define Collection (name & schema)

const MYPROFILE_COLLECTION_NAME = 'myprofiles';
const MYPROFILE_COLLECTION_SCHEMA = Joi.object({
  owner: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  username: Joi.string().required(),
  slug: Joi.string().trim().strict(),
  age: Joi.number().integer().min(0).max(200).allow(null),
  workplace: Joi.string().max(40).allow(''),
  occupation: Joi.string().max(15).allow(''),
  location: Joi.string().max(15).allow(''),
  personality: Joi.array().items(Joi.string().max(50)).default([]),
  Introduction: Joi.string().max(75).allow(''),
  avatar: Joi.array()
    .items(Joi.string())
    .default('src/avatars/avatar-origin.jpg'),

  // bắt buộc
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
});

const validateBeforeCreate = async data => {
  return await MYPROFILE_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createmyProfile = async data => {
  try {
    const validData = await validateBeforeCreate(data);

    //chuyển owner sang dạng ObjectId
    validData.owner = new ObjectId(validData.owner);

    const createdmyProfile = await GET_DB()
      .collection(MYPROFILE_COLLECTION_NAME)
      .insertOne(validData);

    return createdmyProfile;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async id => {
  try {
    return await GET_DB()
      .collection(MYPROFILE_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) });
  } catch (error) {
    throw new Error(error);
  }
};

const getAllProfiles = async () => {
  try {
    return await GET_DB()
      .collection(MYPROFILE_COLLECTION_NAME)
      .find({ _destroy: false })
      .toArray();
  } catch (error) {
    throw new Error(`Error getting profiles: ${error.message}`);
  }
};

const getDetails = async owner => {
  try {
    // In ra owner để kiểm tra(để debug)
    //console.log("Owner:", owner);

    // Kiểm tra kiểu dữ liệu của owner
    if (typeof owner !== 'string' || !owner.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid owner ID');
    }

    const query = {
      owner: new ObjectId(owner),
      _destroy: false,
    };
    // In ra query để kiểm tra(để debug)
    //console.log("Query:", query);

    return await GET_DB().collection(MYPROFILE_COLLECTION_NAME).findOne(query);
  } catch (error) {
    console.error('Lỗi trong getDetails:', error.stack); // In ra stack trace của lỗi
    throw new Error(`Error in getDetails: ${error.message}`);
  }
};

const updateOne = async (filter, update) => {
  try {
    return await GET_DB()
      .collection(MYPROFILE_COLLECTION_NAME)
      .updateOne(filter, update);
  } catch (error) {
    throw new Error(error);
  }
};

const findOne = async filter => {
  try {
    return await GET_DB().collection(MYPROFILE_COLLECTION_NAME).findOne(filter);
  } catch (error) {
    throw new Error(error);
  }
};

const updateAvatar = async (userId, avatarUrl) => {
  try {
    // console.log('Updating avatar for userId:', userId); // Log userId
    // console.log('Avatar URL:', avatarUrl); // Log avatarUrl

    const result = await GET_DB()
      .collection(MYPROFILE_COLLECTION_NAME)
      .updateOne(
        { owner: new ObjectId(userId) },
        { $set: { avatar: avatarUrl } },
      );

    console.log('Update result:', result); // Log the result object
  } catch (error) {
    console.error('Error updating avatar:', error); // Log any errors
    throw new Error(error);
  }
};

export const myProfileModel = {
  MYPROFILE_COLLECTION_NAME,
  MYPROFILE_COLLECTION_SCHEMA,
  createmyProfile,
  findOneById,
  getDetails,
  getAllProfiles,
  updateOne,
  findOne,
  validateBeforeCreate,
  updateAvatar,
};
