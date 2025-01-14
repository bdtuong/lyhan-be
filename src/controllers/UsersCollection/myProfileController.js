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

const getDetails = async (req, res, next) => {
    try {
        const myProfileId = req.params.id; 
        const myProfile = await myProfileService.getDetails(myProfileId);
        
        res.status(StatusCodes.OK).json(myProfile);
    } catch (error) {
        next(error);
    }
};


export const myProfileController = {
    createmyProfile,
    getDetails,
};
