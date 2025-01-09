import Joi from 'joi'
import {ObjectId} from'mongodb'
import { GET_DB } from '../config/mongodb.js'
import { boardModel } from './boardModel.js'



// Define Collection (name & schema)
const BOARDC_COLLECTION_NAME = 'boardscollection'
const BOARDC_COLLECTION_SCHEMA = Joi.object({
    title: Joi.string(),
    slug: Joi.string(),

    createdAt: Joi.date().timestamp('javascript').default(Date.now),
    updatedAt: Joi.date().timestamp('javascript').default(null),
    _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
    return await BOARDC_COLLECTION_SCHEMA.validateAsync(data, {abortEarly: false})


};


const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        console.log('validData: ', validData)
        const createdBoardCollection = await GET_DB().collection(BOARDC_COLLECTION_NAME).insertOne(validData)

        return createdBoardCollection
    } catch (error) {
        throw new Error(error)
    }
}

const findOne = async (query) => {
    try {
        return await GET_DB().collection(BOARDC_COLLECTION_NAME).findOne(query)
    } catch (error) {
        throw new Error(error)
    }
}

const findOneById = async (id) => {
    try {
        return await GET_DB().collection(BOARDC_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
    } catch (error) {
        throw new Error(error)
    }
}
// bat dau join data tai day
const getDetails = async (id) => {
    try {
   
        const result = await GET_DB().collection(BOARDC_COLLECTION_NAME).aggregate([
            {$match: {
                _id: new ObjectId(id),
                _destroy: false
            } },
            {$lookup: {
                from: boardModel.BOARD_COLLECTION_NAME,
                localField: '_id',
                foreignField: 'boardCollectionID',
                as: 'boards'
            } }

        ]).toArray()

        return result[0] || {}

    } catch (error) {
        throw new Error(error)
    }
}


export const boardscollectionModel = {
    BOARDC_COLLECTION_NAME,
    BOARDC_COLLECTION_SCHEMA,
    createNew,
    findOneById,
    getDetails,
    validateBeforeCreate,
    findOne,
}