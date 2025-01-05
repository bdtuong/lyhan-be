import Joi from 'joi'
import {ObjectId} from'mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators.js'
import { GET_DB } from '../config/mongodb.js'
import bycrypt from 'bcrypt'

// Define Collection (name & schema)
const USER_COLLECTION_NAME = 'Users'
const USER_COLLECTION_SCHEMA = Joi.object({
    Username: Joi.string().required(true).min(6).max(20).trim().strict(),
    UserID: Joi.string().required(true).min(6).max(30).trim().strict(),
    Password: Joi.string().required(true).min(8).trim().strict(),
    Admin: Joi.boolean().default(false),
    slug: Joi.string().required(true).trim().strict(),

    createdAt: Joi.date().timestamp('javascript').default(Date.now),
    updatedAt: Joi.date().timestamp('javascript').default(null),
    _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
    return await USER_COLLECTION_SCHEMA.validateAsync(data, {abortEarly: false})


};

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        console.log('validData: ', validData)
        const createdUser = await GET_DB().collection(USER_COLLECTION_NAME).insertOne(validData)

        return createdUser
    } catch (error) {
        throw new Error(error)
    }
}

const findOne = async (query) => {
    try {
        return await GET_DB().collection(USER_COLLECTION_NAME).findOne(query)
    } catch (error) {
        throw new Error(error)
    }
}

const findOneById = async (id) => {
    try {
        return await GET_DB().collection(USER_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
    } catch (error) {
        throw new Error(error)
    }
}

const getDetails = async (id) => {
    try {
        return await GET_DB().collection(USER_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
    } catch (error) {
        throw new Error(error)
    }
}


export const AuthModel = {
    USER_COLLECTION_NAME,
    USER_COLLECTION_SCHEMA,
    createNew,
    findOneById,
    getDetails,
    validateBeforeCreate,
    findOne,
}