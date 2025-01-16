import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError.js';
import { ObjectId } from 'mongodb';
import { myProfileModel } from '../models/myProfileModel.js';
import { slugify } from '../utils/formatters.js'


const createmyProfile = async (reqBody) => {
    try {
        const myProfileData = {
            ...reqBody,
            slug: slugify(reqBody.username),
            userId: new ObjectId(reqBody.owner),
        };

        // lưu vào database
        const createdmyProfile = await myProfileModel.createmyProfile(myProfileData);

        //trả về client
        const getNewmyProfile = await myProfileModel.findOneById(createdmyProfile.insertedId);

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

const getDetails = async (myProfileId) => {
    try {
        const myProfile = await myProfileModel.findOneById(new ObjectId(myProfileId));
        if (!myProfile) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'myProfile not found!');
        }
        return myProfile;
    } catch (error) {
        throw error;
    }
};


export const myProfileService = {
    createmyProfile,
    getDetails,
    getAllProfiles,
};
