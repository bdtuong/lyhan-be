import { StatusCodes } from 'http-status-codes';
import {myProfileService} from '../../services/myProfileService.js'

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
        // Nhận userId từ params hoặc từ user trong session/token
        let userId;
        if (req.params.id) {
            userId = req.params.id; // Nếu có ID ở params
        } else if (req.user) {
            userId = req.user.id; // Nếu đã xác thực qua token hoặc session
        }

        if (!userId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'User ID is required');
        }

        const myProfile = await myProfileService.getDetails(userId);
        
        if (!myProfile) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Profile not found!');
        }

        return res.status(StatusCodes.OK).json(myProfile);
    } catch (error) {
        next(error);
    }
};




export const myProfileController = {
    createmyProfile,
    getDetails,
    getAllProfiles,
};
