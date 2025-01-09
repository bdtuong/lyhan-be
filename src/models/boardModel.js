import Joi from 'joi'
import {ObjectId} from'mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators.js'
import { GET_DB } from '../config/mongodb.js'
import { CommentModel } from './CommentModel.js'





// Define Collection (name & schema)
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
    userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    userID: Joi.required(),
    title: Joi.string().required().min(3).max(50).trim().strict(),

    boardCollectionID: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).custom((value, helpers) => {
            try {
                return new ObjectId(value); // Chuyển thành ObjectId
            } catch (error) {
                return helpers.error('any.invalid');
            }
        })
        .default(new ObjectId('677e53f474f256608d6044a2')),

    description: Joi.string().required().min(3).max(256).trim().strict(),
    content: Joi.string().required(),


    createdAt: Joi.date().timestamp('javascript').default(Date.now),
    updatedAt: Joi.date().timestamp('javascript').default(null),
    _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
    return await BOARD_COLLECTION_SCHEMA.validateAsync(data, {abortEarly: false})


}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        console.log('validData: ', validData)
        const createdBoard = await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(validData)

        return createdBoard
    } catch (error) {
        throw new Error(error)
    }
}

const findOneById = async (id) => {
    try {
        return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
    } catch (error) {
        throw new Error(error)
    }
}

const getDetails = async (id) => {
    try {
               // return await GET_DB().collection(USER_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
                const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
                    {$match: {
                        _id: new ObjectId(id),
                        _destroy: false
                    } },
                    {$lookup: {
                        from: CommentModel.COMMENT_COLLECTION_NAME,
                        localField: '_id',
                        foreignField: 'boardId',
                        as: 'comments'
                    } }
                ]).toArray()
        
                return result[0] || {}
    } catch (error) {
        throw new Error(error)
    }
}
// lay board da dc phan loai theo thoi gian


export const boardModel = {
    BOARD_COLLECTION_NAME,
    BOARD_COLLECTION_SCHEMA,
    createNew,
    findOneById,
    getDetails
    
}