import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators.js'

const createNew = async (req , res , next )=> {
    const correctCondition = Joi.object({
        title: Joi.string().required().min(8).max(50).trim().strict().messages({
            //custom message
            'any.required': 'Title is required',
            'string.empty': 'Title is not allowed to be empty',
            'string.min': 'Title must be at least 8 characters long',
            'string.max': 'Title must be at most 50 characters long',
            'string.trim': 'Title must not have leading or trailing whitespace'
        }),
        description: Joi.string().required().min(3).max(256).trim().strict().messages({
            'any.required': 'description is required',
            'string.empty': 'description is not allowed to be empty',
            'string.min': 'description must be at least 8 characters long',
            'string.max': 'description must be at most 50 characters long',
            'string.trim': 'description must not have leading or trailing whitespace'
        }),
        userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
        content: Joi.string().required()


    })

    try {

        //kiểm tra dữ liệu gửi lên có phù hợp hay không?
        await correctCondition.validateAsync(req.body, {abortEarly: false})

        //Validate dữ liệu hợp lệ xong req đi tiếp sang controller
        next()
    }   catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
    }
    
}

export const boardValidation = {
    createNew
}