import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators.js'

const createmyProfile = async (req , res , next )=> {
    const correctCondition = Joi.object({
        owner: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
        username: Joi.string().required(),
        age: Joi.number().integer().min(0).max(200).allow(null).message('Age must be a number between 0 and 200'),
        education: Joi.string().max(15).allow('').message('Education must be a string with a maximum length of 15 characters'),
        occupation: Joi.string().max(15).allow('').message('Occupation must be a string with a maximum length of 15 characters'),
        location: Joi.string().max(15).allow('').message('Location must be a string with a maximum length of 15 characters'),
        personality: Joi.array().items(Joi.string().max(50)).default([]),
        Introduction: Joi.string().max(50).allow('').message('Introduction must be a string with a maximum length of 50 characters'),
        updatedAt: Joi.date().timestamp('javascript').allow(null),
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
    createmyProfile,
}