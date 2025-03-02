import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js';
import { GET_DB } from '~/config/mongodb.js';

const NOTIFICATION_COLLECTION_NAME = 'notifications';
const NOTIFICATION_COLLECTION_SCHEMA = Joi.object({
    userId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    postId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    message: Joi.string().required(),
    isRead: Joi.boolean().default(false),
    type: Joi.string().valid('comment','rating','inline'),
    owner: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    commentId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE).allow(null),

    createdAt: Joi.date().timestamp('javascript').default(Date.now),
    updatedAt: Joi.date().timestamp('javascript').default(null),
    _destroy: Joi.boolean().default(false),
});

const validateBeforeCreate = async data => {
    return await NOTIFICATION_COLLECTION_SCHEMA.validateAsync(data, {
        abortEarly: false,
    });
};

const createNotification = async (data) => {
    try {

        const validData = await validateBeforeCreate(data);

        const notification = {
            ...validData,
            isRead: false,
            createdAt: new Date(),
        };
        if (notification.type === 'rating') {
            await GET_DB().collection(NOTIFICATION_COLLECTION_NAME)
                        .findOneAndDelete({commentId: notification.commentId, owner: notification.owner })
        }
        const result = await GET_DB()
            .collection(NOTIFICATION_COLLECTION_NAME)
            .insertOne(notification);
        
        return result;
    } catch (error) {
        throw new Error(error);
    }
};

const getNotifications = async (userId) => {
    try {
        return await GET_DB().collection(NOTIFICATION_COLLECTION_NAME).find({ userId }).sort({ createdAt: -1 }).toArray();
    } catch (error) {
        throw new Error(error);
    }
}

const markAsRead = async (userId) => {
    try {
        return await GET_DB().collection(NOTIFICATION_COLLECTION_NAME).updateMany({ 
            userId: userId,
        }, { $set: { isRead: true, updatedAt: new Date().getTime() } },{ returnDocument: 'after' });
    } catch (error) {
        throw new Error(error);
    }
}



export const NotificationModel = {
    NOTIFICATION_COLLECTION_NAME,
    NOTIFICATION_COLLECTION_SCHEMA,
    validateBeforeCreate,
    getNotifications,
    markAsRead,
    createNotification,
}