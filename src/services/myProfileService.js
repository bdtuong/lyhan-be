import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError.js';
import { ObjectId } from 'mongodb';
import { myProfileModel } from '../models/myProfileModel.js';
import { slugify } from '../utils/formatters.js'


const createmyProfile = async (reqBody) => {
    try {
        const myProfileData = {
            ...reqBody,
            owner: new ObjectId(reqBody.userId), // Convert userId to ObjectId
            slug: slugify(reqBody.userId)
        };

        // Save the new comment to the database
        const createdmyProfile = await myProfileModel.createmyProfile(myProfileData);

        // Retrieve the comment after creation
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
    getAllProfiles
};
