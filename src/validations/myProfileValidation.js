import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators.js'

const createmyProfile = async (req , res , next )=> {
    const correctCondition = Joi.object({
        userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
        username: Joi.string().required(),
        age: Joi.number().integer().min(0).max(1000).allow(null),
        education: Joi.string().max(100).allow(''),
        occupation: Joi.string().max(40).allow(''),
        location: Joi.string().max(40).allow(''),
        personality: Joi.array().items(Joi.string().max(50)).default([]),
        slogan: Joi.string().max(100).allow(''),
    });

    try {

        //kiểm tra dữ liệu gửi lên có phù hợp hay không?
        await correctCondition.validateAsync(req.body, {abortEarly: false})

        //Validate dữ liệu hợp lệ xong req đi tiếp sang controller
        next()
    }   catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
    
}

export const myProfileValidation = {
    createmyProfile
}