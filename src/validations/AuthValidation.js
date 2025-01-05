import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'
import { Admin } from 'mongodb'
import { OBJECT_ID_RULE } from '../utils/validators.js'

const createNew = async (req , res , next )=> {
    const correctCondition = Joi.object({
        Username: Joi.string().required(true).min(6).max(20).trim().strict().messages({
            'any.required': 'Username is required',
            'string.empty': 'Username is not allowed to be empty',
            'string.min': 'Username must be at least 6 characters long',
            'string.max': 'Username must be at most 20 characters long',
            'string.trim': 'Username must not have leading or trailing whitespace'
        }),
        UserID: Joi.string().required().min(6).max(30).trim().strict().messages({
            'any.required': 'UserID is required',
            'string.empty': 'UserID is not allowed to be empty',
            'string.min': 'UserID must be at least 6 characters long',
            'string.max': 'UserID must be at most 30 characters long',
            'string.trim': 'UserID must not have leading or trailing whitespace',
        }),
        Password: Joi.string().required().min(8).trim().strict().messages({
            'any.required': 'Password is required',
            'string.empty': 'Password is not allowed to be empty',
            'string.min': 'Password must be at least 8 characters long',
            'string.trim': 'Password must not have leading or trailing whitespace'
        }),
        ConfirmPassword: Joi.string().required().valid(Joi.ref('Password')).messages({
            'any.required': 'ConfirmPassword is required',
            'string.empty': 'ConfirmPassword is not allowed to be empty',
            'any.only': 'ConfirmPassword must be the same as Password'
        }),
        Admin: Joi.boolean().default(false),

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

export const AuthValidation = {
    createNew
}