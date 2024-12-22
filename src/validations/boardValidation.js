import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'

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
        password: Joi.string().required().min(8).max(50).trim().strict().regex(/^(?=.*[A-Za-z])(?=.*\d)/).messages({
            'any.required': 'Password is required',
            'string.empty': 'Password is not allowed to be empty',
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password must be at most 50 characters long',
            'string.trim': 'Password must not have leading or trailing whitespace',
            'string.pattern.base': 'Password must contain at least one letter and one number'

        }),

    })

    try {

        //kiểm tra dữ liệu gửi lên có phù hợp hay không?
        await correctCondition.validateAsync(req.body, {abortEarly: false})

        //Validate dữ liệu hợp lệ xong req đi tiếp sang controller
        next()
    }   catch (error) {
        console.log(error)
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            errors: new Error(error).message
        })
    }


    
}

export const boardValidation = {
    createNew
}