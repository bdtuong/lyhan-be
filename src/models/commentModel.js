import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb.js'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators.js'

const COMMENT_COLLECTION_NAME = 'comments'

const COMMENT_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  // ⚠️ boardID chỉ dùng để lưu dưới DB, không cần FE gửi
  boardID: Joi.any(),

  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  author: Joi.required(),
  content: Joi.string().required().min(1),
  username: Joi.string().required(),

  // 🔥 thêm parentId để support reply
  parentId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .allow(null, '') // chấp nhận null hoặc empty string
    .default(null),

  slug: Joi.string().trim().strict(),
  upvote: Joi.number().default(0),
  downvote: Joi.number().default(0),
  votes: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string()
          .pattern(OBJECT_ID_RULE)
          .message(OBJECT_ID_RULE_MESSAGE),
        type: Joi.string().valid('up', 'down'),
        createdAt: Joi.date().default(Date.now),
      })
    )
    .default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false),
})

const validateBeforeCreate = async (data) => {
  return await COMMENT_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  })
}

const createComment = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)

    const createdComment = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .insertOne({
        ...validData,
        boardID: new ObjectId(validData.boardId),
        parentId:
          validData.parentId && validData.parentId !== ''
            ? new ObjectId(validData.parentId)
            : null,
      })

    return createdComment
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    return await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(id) })
  } catch (error) {
    throw new Error(error)
  }
}

const updateOneById = async (id, updateData) => {
  try {
    const result = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    return result.value
  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async (commentId) => {
  try {
    const result = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .findOneAndDelete({ _id: new ObjectId(commentId) })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

// 🔥 lấy comments theo boardId + pagination
const findManyByBoardId = async (boardId, page, pageSize) => {
  try {
    const skip = (page - 1) * pageSize
    const comments = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .find({ boardID: new ObjectId(boardId), _destroy: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray()

    const totalCount = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .countDocuments({ boardID: new ObjectId(boardId), _destroy: false })

    return { comments, totalCount }
  } catch (error) {
    throw new Error(error)
  }
}

export const CommentModel = {
  COMMENT_COLLECTION_NAME,
  COMMENT_COLLECTION_SCHEMA,
  createComment,
  findOneById,
  updateOneById,
  deleteOneById,
  findManyByBoardId,
}
