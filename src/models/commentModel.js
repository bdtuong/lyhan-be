import Joi from 'joi'
import {ObjectId} from'mongodb'
import { GET_DB } from '../config/mongodb.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators.js'
// Define Collection (name & schema)

const COMMENT_COLLECTION_NAME = 'comments'
const COMMENT_COLLECTION_SCHEMA = Joi.object({
    // optional có thể thêm lượt like sau
    boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    author: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    content: Joi.string().required(),
    slug: Joi.string().trim().strict(),


    // bắt buộc 
    createdAt: Joi.date().timestamp('javascript').default(Date.now),
    updatedAt: Joi.date().timestamp('javascript').default(null),
    _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
    return await COMMENT_COLLECTION_SCHEMA.validateAsync(data, {abortEarly: false})
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        console.log('validData: ', validData)
        const createdBoard = await GET_DB().collection(COMMENT_COLLECTION_NAME).insertOne(validData)

        return createdBoard
    } catch (error) {
        throw new Error(error)
    }
}

const findOneById = async (id) => {
    try {
        return await GET_DB().collection(COMMENT_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
    } catch (error) {
        throw new Error(error)
    }
}
// querry aggregate để lấy thông tin về 
const getDetails = async (id) => {
    try {
        return await GET_DB().collection(COMMENT_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
    } catch (error) {
        throw new Error(error)
    }
}



export const commentModel = {
    COMMENT_COLLECTION_NAME,
    COMMENT_COLLECTION_SCHEMA,
    createNew,
    findOneById,
    getDetails
}