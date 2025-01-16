import Joi from 'joi'
import {ObjectId} from'mongodb'
import { GET_DB } from '../config/mongodb.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '../utils/validators.js'
// Define Collection (name & schema)

const MYPROFILE_COLLECTION_NAME = 'myprofiles'
const MYPROFILE_COLLECTION_SCHEMA = Joi.object({
    userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    owner: Joi.required(),
    username: Joi.string().required(),
    slug: Joi.string().trim().strict(),
    age: Joi.number().integer().min(0).max(1000).allow(null),
    education: Joi.string().max(100).allow(''),
    occupation: Joi.string().max(40).allow(''),
    location: Joi.string().max(40).allow(''),
    personality: Joi.array().items(Joi.string().max(50)).default([]),
    Introduction: Joi.string().max(100).allow(''),


    // bắt buộc 
    createdAt: Joi.date().timestamp('javascript').default(Date.now),
    updatedAt: Joi.date().timestamp('javascript').default(null),
    _destroy: Joi.boolean().default(false)
})

const validateBeforeCreate = async (data) => {
    return await MYPROFILE_COLLECTION_SCHEMA.validateAsync(data, {abortEarly: false})
}

const createmyProfile = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        console.log('validData: ', validData)
        const createdmyProfile = await GET_DB().collection(MYPROFILE_COLLECTION_NAME).insertOne(validData)

        return createdmyProfile
    } catch (error) {
        throw new Error(error)
    }
}

const findOneById = async (id) => {
    try {
        return await GET_DB().collection(MYPROFILE_COLLECTION_NAME).findOne({_id: new ObjectId(id)})
    } catch (error) {
        throw new Error(error)
    }
}


const getAllProfiles = async () => {
    try {
        return await GET_DB().collection(MYPROFILE_COLLECTION_NAME).find({ _destroy: false }).toArray();
    } catch (error) {
        throw new Error(`Error getting profiles: ${error.message}`);
    }
};

const getDetails = async (userId) => {
    try {
        return await GET_DB().collection(MYPROFILE_COLLECTION_NAME).findOne({
            owner: new ObjectId(userId),
            _destroy: false
        });
    } catch (error) {
        throw new Error(`Error in getDetails: ${error.message}`);
    }
};



export const myProfileModel = {
    MYPROFILE_COLLECTION_NAME,
    MYPROFILE_COLLECTION_SCHEMA,
    createmyProfile,
    findOneById,
    getDetails,
    getAllProfiles
}