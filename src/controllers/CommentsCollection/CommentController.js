import { StatusCodes } from 'http-status-codes'
import { CommentService } from '~/services/CommentService.js'
import { CommentModel } from '~/models/commentModel.js'
import { GET_DB } from '~/config/mongodb.js'
import { AuthModel } from '~/models/AuthModel.js'
import { ObjectId } from 'mongodb'

const createComment = async (req, res, next) => {
  try {
    const createdComment = await CommentService.createComment(req.body)
    res.status(StatusCodes.CREATED).json(createdComment)

    const board = await GET_DB()
      .collection('boards')
      .findOne({ _id: new ObjectId(req.body.boardId) })

    const ownerUserId = board?.userId

    if (ownerUserId) {
      const io = req.app.get('socketio')
      const owner = await AuthModel.findOneById(ownerUserId)
      if (owner?.notificationId) {
        io.to(owner.notificationId).emit('newNotification')
      }
    }
  } catch (error) {
    next(error)
  }
}

const replyComment = async (req, res, next) => {
  try {
    const { commentId } = req.params
    const replyData = {
      ...req.body,
      parentId: commentId
    }

    const createdReply = await CommentService.createComment(replyData)
    res.status(StatusCodes.CREATED).json(createdReply)
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const commentId = req.params.id
    const comment = await CommentService.getDetails(commentId)
    res.status(StatusCodes.OK).json(comment)
  } catch (error) {
    next(error)
  }
}

const updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.id
    const updatedComment = await CommentService.updateComment(commentId, req.body)
    res.status(StatusCodes.OK).json(updatedComment)
  } catch (error) {
    next(error)
  }
}

const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id
    const deletedComment = await CommentModel.deleteOneById(commentId)

    if (!deletedComment) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Comment not found' })
    }

    res.status(StatusCodes.OK).json('Delete comment successfully!')
  } catch (error) {
    next(error)
  }
}

const vote = async (req, res, next) => {
  try {
    const { id } = req.params
    const { type, userId } = req.body

    const updatedComment = await CommentService.vote(id, userId, type)
    if (!updatedComment) {
      return next(new ApiError(StatusCodes.NOT_FOUND, 'Comment not found'))
    }

    res.status(StatusCodes.OK).json(updatedComment)

    const board = await GET_DB()
      .collection('boards')
      .findOne({ _id: new ObjectId(req.body.boardId) })

    const ownerUserId = board?.userId

    if (ownerUserId) {
      const io = req.app.get('socketio')
      const owner = await AuthModel.findOneById(ownerUserId)
      if (owner?.notificationId) {
        io.to(owner.notificationId).emit('newNotification')
      }
    }
  } catch (error) {
    next(error)
  }
}

const getByBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 10

    const { comments, totalCount } = await CommentService.getByBoard(boardId, page, pageSize)

    res.status(StatusCodes.OK).json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize),
      totalCount,
    })
  } catch (error) {
    next(error)
  }
}

export const CommentController = {
  createComment,
  replyComment, // ✅ thêm mới
  getDetails,
  updateComment,
  deleteComment,
  vote,
  getByBoard
}
