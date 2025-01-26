import { StatusCodes } from 'http-status-codes';
import {myProfileService} from '../../services/myProfileService.js'
import ApiError from '../../utils/ApiError.js'

const createmyProfile = async (req, res, next) => {
    try {
        const createdmyProfile = await myProfileService.createmyProfile(req.body);
        res.status(StatusCodes.CREATED).json(createdmyProfile);
    } catch (error) {
        next(error);
    }
};

const getAllProfiles = async (req, res, next) => {
    try {
        const profiles = await myProfileService.getAllProfiles();
        res.status(StatusCodes.OK).json(profiles);
    } catch (error) {
        next(error);
    }
};

const getDetails = async (req, res, next) => {
    try {
        const owner = req.params.owner;
        //console.log("Owner:", owner); // In ra owner(để debug)
        const myProfile = await myProfileService.getDetails(owner); // Gọi service để lấy chi tiết profile
        if (!myProfile) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Profile not found!');
        }
        return res.status(StatusCodes.OK).json(myProfile);
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const owner = req.params.owner;
        //console.log("Owner trong controller:", owner); // In ra giá trị của owner (để debug)
        const updatedProfile = req.body;
      // Validate updatedProfile using the same schema as for creating a profile
      const { error } = myProfileService.validateProfileData(updatedProfile); // Assuming you have a validation function in myProfileService
        if (error) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ message: error.details[0].message });
        }
        const updated = await myProfileService.updateProfile(owner, updatedProfile);
        if (!updated) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Profile not found');
        }
        res.json(updated);
    } catch (error) {
        next(error);
    }
};




export const myProfileController = {
    createmyProfile,
    getDetails,
    getAllProfiles,
    updateProfile
};
