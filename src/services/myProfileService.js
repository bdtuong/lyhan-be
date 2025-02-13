import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError.js';
import { ObjectId } from 'mongodb';
import { myProfileModel } from '../models/myProfileModel.js';
import { slugify } from '../utils/formatters.js';

const createmyProfile = async reqBody => {
  try {
    const myProfileData = {
      ...reqBody,
      slug: slugify(reqBody.username),
    };

    // lưu vào database
    const createdmyProfile =
      await myProfileModel.createmyProfile(myProfileData);

    //trả về client
    const getNewmyProfile = await myProfileModel.findOneById(
      createdmyProfile.insertedId,
    );

    return getNewmyProfile;
  } catch (error) {
    throw error;
  }
};

const getAllProfiles = async () => {
  try {
    return await myProfileModel.getAllProfiles();
  } catch (error) {
    throw error;
  }
};

const getDetails = async owner => {
  try {
    const myProfile = await myProfileModel.getDetails(owner);

    if (!myProfile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'myProfile not found!');
    }
    return myProfile;
  } catch (error) {
    throw error;
  }
};

// myProfileService.js
const updateProfile = async (owner, updatedProfile) => {
  try {
    // In ra owner để kiểm tra(để debug)
    //console.log("Owner trong service:", owner);

    // Chuyển đổi owner sang ObjectId
    if (typeof owner === 'string' && ObjectId.isValid(owner)) {
      owner = new ObjectId(owner);
    }

    // Tìm profile dựa trên owner
    const existingProfile = await myProfileModel.findOne({ owner: owner });

    if (!existingProfile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Profile not found!');
    }

    // Loại bỏ trường owner khỏi updatedProfile (nếu có)
    const { owner: _owner, ...restOfUpdatedProfile } = updatedProfile;

    // Cập nhật profile
    const updated = await myProfileModel.updateOne(
      { _id: existingProfile._id }, // Filter dựa trên _id của profile
      { $set: restOfUpdatedProfile }, // Cập nhật các trường trong updatedProfile
    );

    if (!updated) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to update profile!',
      );
    }

    // Trả về profile đã cập nhật (nếu cần)
    return await myProfileModel.findOne({ _id: existingProfile._id });
  } catch (error) {
    throw error;
  }
};

const validateProfileData = async profileData => {
  try {
    // Sử dụng schema MYPROFILE_COLLECTION_SCHEMA để validate
    const { error } = await myProfileModel.validateBeforeCreate(profileData);
    return { error }; // Trả về error nếu có
  } catch (error) {
    return { error }; // Trả về error nếu có
  }
};

export const myProfileService = {
  createmyProfile,
  getDetails,
  getAllProfiles,
  updateProfile,
  validateProfileData,
};
