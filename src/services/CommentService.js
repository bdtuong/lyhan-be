import { StatusCodes } from 'http-status-codes'
import { CommentModel } from '~/models/commentModel.js'
import ApiError from '~/utils/ApiError.js'
import { ObjectId } from 'mongodb'

const createComment = async (reqBody) => {
  try {
    // ❌ KHÔNG ép parentId, KHÔNG gán boardID ở đây
    // ✅ Chỉ truyền dữ liệu thô (string) để Model validate & convert
    const commentData = {
      boardId: reqBody.boardId,           // string
      userId: reqBody.userId,             // string
      content: reqBody.content,
      username: reqBody.username,
      author: new ObjectId(reqBody.userId), // ok vì schema author = Joi.required()
      parentId: reqBody.parentId ?? null  // string hoặc null
    }

    const createdComment = await CommentModel.createComment(commentData)
    const getNewComment = await CommentModel.findOneById(createdComment.insertedId)
    return getNewComment
  } catch (error) {
    throw error
  }
}

// Reply: giữ nguyên, đừng ép parentId ở đây
const replyComment = async (parentCommentId, reqBody) => {
  try {
    const parent = await CommentModel.findOneById(new ObjectId(parentCommentId))
    if (!parent) throw new ApiError(StatusCodes.NOT_FOUND, 'Parent comment not found!')

    return await createComment({
      ...reqBody,
      parentId: parentCommentId // string, để Model tự convert
    })
  } catch (error) {
    throw error
  }
}

const getDetails = async (commentId) => {
  try {
    const comment = await CommentModel.findOneById(new ObjectId(commentId))
    if (!comment) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found!')
    return comment
  } catch (error) {
    throw error
  }
}

const updateComment = async (commentId, updateData) => {
  try {
    const updatedComment = await CommentModel.updateOneById(
      new ObjectId(commentId),
      updateData
    )
    if (!updatedComment) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found!')
    return updatedComment
  } catch (error) {
    throw error
  }
}

const deleteComment = async (commentId) => {
  try {
    const deleted = await CommentModel.deleteOneById(new ObjectId(commentId))
    if (!deleted) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found!')
    return deleted
  } catch (error) {
    throw error
  }
}

const vote = async (commentId, userId, voteType) => {
  try {
    const comment = await CommentModel.findOneById(new ObjectId(commentId))
    if (!comment) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found')

    const existingVoteIndex = comment.votes.findIndex((v) => v.userId === userId)
    let newVotes = [...comment.votes]

    if (existingVoteIndex >= 0) {
      if (newVotes[existingVoteIndex].type === voteType) {
        newVotes = newVotes.filter((v) => v.userId !== userId)
      } else {
        newVotes[existingVoteIndex] = {
          userId,
          type: voteType,
          createdAt: new Date().getTime(),
        }
      }
    } else {
      newVotes.push({ userId, type: voteType, createdAt: new Date().getTime() })
    }

    const upvote = newVotes.filter((v) => v.type === 'up').length
    const downvote = newVotes.filter((v) => v.type === 'down').length

    const updatedComment = await CommentModel.updateOneById(
      new ObjectId(commentId),
      { upvote, downvote, votes: newVotes, updatedAt: new Date().getTime() }
    )

    return updatedComment
  } catch (error) {
    throw error
  }
}

const getByBoard = async (boardId, page, pageSize) => {
  return await CommentModel.findManyByBoardId(boardId, page, pageSize)
}

export const CommentService = {
  createComment,
  replyComment,
  getDetails,
  updateComment,
  deleteComment,
  vote,
  getByBoard
}
