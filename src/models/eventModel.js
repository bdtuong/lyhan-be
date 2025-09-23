import Joi from "joi"
import { ObjectId } from "mongodb"
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators.js"
import { GET_DB } from "~/config/mongodb.js"
import { AuthModel } from "./AuthModel.js"
import { CommentModel } from "./commentModel.js"

// Collection name
const EVENT_COLLECTION_NAME = "events"

// Schema
const EVENT_COLLECTION_SCHEMA = Joi.object({
  createdByID: Joi.required(), // ObjectId của admin tạo event

  title: Joi.string().required().min(3).max(150).trim(),
  description: Joi.string().required().min(5).trim(),

  location: Joi.string().allow("").default(""),
  startTime: Joi.date().timestamp("javascript").required(),
  endTime: Joi.date().timestamp("javascript").greater(Joi.ref("startTime")).required(),

  images: Joi.array().items(Joi.string().uri()).default([]),

  participants: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  likes: Joi.array().items(Joi.object()).default([]),

  hashtags: Joi.array().items(Joi.string()).default([]),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
})

// Validate
const validateBeforeCreate = async (data) => {
  return await EVENT_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

// helper kiểm tra ObjectId hợp lệ
function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id
}

// parse hashtag
function extractHashtags(text) {
  if (!text) return []
  const regex = /#[\p{L}\w]+/gu
  return text.match(regex) || []
}

// Create new event
const createNew = async (data) => {
  try {
    const hashtags = extractHashtags(data.description)

    const validData = await validateBeforeCreate({
      ...data,
      hashtags,
    })

    const createdEvent = await GET_DB().collection(EVENT_COLLECTION_NAME).insertOne(validData)
    return createdEvent
  } catch (error) {
    throw new Error(error)
  }
}

// Find by ID
const findOneById = async (id) => {
  try {
    if (!isValidObjectId(id)) return null
    return await GET_DB()
      .collection(EVENT_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id), _destroy: false })
  } catch (error) {
    throw new Error(error)
  }
}

// Update one event by ID
const updateOneById = async (id, updateData) => {
  try {
    if (!isValidObjectId(id)) return null
    const result = await GET_DB()
      .collection(EVENT_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(id), _destroy: false },
        { $set: { ...updateData, updatedAt: new Date().getTime() } },
        { returnDocument: "after" }
      )
    return result.value
  } catch (error) {
    throw new Error(error)
  }
}

// Add participant
const addParticipant = async (eventId, userId) => {
  try {
    if (!isValidObjectId(eventId) || !isValidObjectId(userId)) return null
    const result = await GET_DB()
      .collection(EVENT_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(eventId), _destroy: false },
        { $addToSet: { participants: new ObjectId(userId) } },
        { returnDocument: "after" }
      )
    return result.value
  } catch (error) {
    throw new Error(error)
  }
}

// Remove participant
const removeParticipant = async (eventId, userId) => {
  try {
    if (!isValidObjectId(eventId) || !isValidObjectId(userId)) return null
    const result = await GET_DB()
      .collection(EVENT_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(eventId), _destroy: false },
        { $pull: { participants: new ObjectId(userId) } },
        { returnDocument: "after" }
      )
    return result.value
  } catch (error) {
    throw new Error(error)
  }
}

// Get details with creator + comments count
const getDetails = async (id) => {
  try {
    if (!isValidObjectId(id)) return null
    const result = await GET_DB()
      .collection(EVENT_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id),
            _destroy: false,
          },
        },
        {
          $lookup: {
            from: AuthModel.USER_COLLECTION_NAME,
            localField: "createdByID",
            foreignField: "_id",
            as: "creatorInfo",
          },
        },
        {
          $unwind: {
            path: "$creatorInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: CommentModel.COMMENT_COLLECTION_NAME,
            localField: "_id",
            foreignField: "eventID",
            as: "comments",
          },
        },
        {
          $addFields: {
            commentsCount: { $size: "$comments" },
            participantsCount: { $size: { $ifNull: ["$participants", []] } },
            likesCount: { $size: { $ifNull: ["$likes", []] } },
          },
        },
        {
          $project: {
            comments: 0,
          },
        },
      ])
      .toArray()

    return result[0] || null
  } catch (error) {
    throw new Error(error)
  }
}

// Pagination
const getEventsWithPagination = async (page, pageSize) => {
  try {
    const skip = (page - 1) * pageSize

    const events = await GET_DB()
      .collection(EVENT_COLLECTION_NAME)
      .aggregate([
        { $match: { _destroy: false } },
        { $sort: { startTime: 1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $lookup: {
            from: AuthModel.USER_COLLECTION_NAME,
            localField: "createdByID",
            foreignField: "_id",
            as: "creatorInfo",
          },
        },
        {
          $unwind: {
            path: "$creatorInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            participantsCount: { $size: { $ifNull: ["$participants", []] } },
            likesCount: { $size: { $ifNull: ["$likes", []] } },
          },
        },
      ])
      .toArray()

    const totalCount = await GET_DB()
      .collection(EVENT_COLLECTION_NAME)
      .countDocuments({ _destroy: false })

    return { events, totalCount }
  } catch (error) {
    throw error
  }
}

// Search events
const searchEvents = async (searchTerm) => {
  try {
    const regexOptions = { $options: "i" }
    const queries = [{ hashtags: { $regex: searchTerm, ...regexOptions } }]

    if (!searchTerm.startsWith("#")) {
      queries.push({ hashtags: { $regex: `#${searchTerm}`, ...regexOptions } })
    }

    const results = await GET_DB()
      .collection(EVENT_COLLECTION_NAME)
      .aggregate([
        {
          $lookup: {
            from: AuthModel.USER_COLLECTION_NAME,
            localField: "createdByID",
            foreignField: "_id",
            as: "creatorInfo",
          },
        },
        {
          $unwind: {
            path: "$creatorInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { title: { $regex: searchTerm, $options: "i" } },
              { description: { $regex: searchTerm, $options: "i" } },
              { location: { $regex: searchTerm, $options: "i" } },
              { "creatorInfo.username": { $regex: searchTerm, $options: "i" } },
              ...queries,
            ],
          },
        },
      ])
      .toArray()

    return results
  } catch (error) {
    throw error
  }
}

// Soft delete event
const deleteEvent = async (eventId) => {
  try {
    if (!isValidObjectId(eventId)) return null
    const result = await GET_DB()
      .collection(EVENT_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(eventId) },
        { $set: { _destroy: true, updatedAt: new Date().getTime() } },
        { returnDocument: "after" }
      )
    return result.value
  } catch (error) {
    throw error
  }
}

export const eventModel = {
  EVENT_COLLECTION_NAME,
  EVENT_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  updateOneById,
  addParticipant,
  removeParticipant,
  getDetails,
  getEventsWithPagination,
  searchEvents,
  deleteEvent,
}
