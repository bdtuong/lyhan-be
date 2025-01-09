import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators.js'

const createComment = async (req , res , next )=> {
    const correctCondition = Joi.object({
        boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).message({
            'any.required': 'boardId is required',
            'string.empty': 'boardId is not allowed to be empty',
        }),
        author: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).message({
            'any.required': 'author is required',
            'string.empty': 'author is not allowed to be empty',
        }),
        content: Joi.string().required().message({
            'any.required': 'content is required',
            'string.empty': 'content is not allowed to be empty',
        }),
        
        
        
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

export const CommentValidation = {
    createComment
}