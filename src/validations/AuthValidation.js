import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'
import { Admin } from 'mongodb'
import { OBJECT_ID_RULE } from '../utils/validators.js'

const createNew = async (req , res , next )=> {
    const correctCondition = Joi.object({
        username: Joi.string().required().min(6).max(20).trim().strict().messages({
            'any.required': 'Username is required',
            'string.empty': 'Username is not allowed to be empty',
            'string.min': 'Username must be at least 6 characters long',
            'string.max': 'Username must be at mos 20t characters long',
            'string.trim': 'Username must not have leading or trailing whitespace'
        }),
        email: Joi.string().required().email().trim().strict().messages({
            'any.required': 'Email is required',
            'string.empty': 'Email is not allowed to be empty',
            'string.email': 'Email is not valid',
            'string.trim': 'Email must not have leading or trailing whitespace'
        }),
        password: Joi.string().required().min(8).trim().strict().messages({
            'any.required': 'Password is required',
            'string.empty': 'Password is not allowed to be empty',
            'string.min': 'Password must be at least 8 characters long',
            'string.trim': 'Password must not have leading or trailing whitespace'
        }),
        confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
            'any.required': 'ConfirmPassword is required',
            'string.empty': 'ConfirmPassword is not allowed to be empty',
            'any.only': 'ConfirmPassword must be the same as Password'
        }),
        admin: Joi.boolean().default(false),

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

const changePassword = async (req, res, next) => {
    const correctCondition = Joi.object({
        oldPassword: Joi.string().required().min(8).trim().strict(),
        newPassword: Joi.string().required().min(8).trim().strict(),
        confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    });

    try {
        await correctCondition.validateAsync(req.body, { abortEarly: false });
        next();
    } catch (error) {
        next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message));
    }
};


export const AuthValidation = {
    createNew,
    changePassword
}