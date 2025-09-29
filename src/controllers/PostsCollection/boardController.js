import { StatusCodes } from "http-status-codes"
import ApiError from "~/utils/ApiError.js"
import { boardService } from "~/services/boardService.js"
import { boardModel } from "~/models/boardModel.js"
import { AuthModel } from "~/models/AuthModel.js"
import Joi from "joi"
import { v2 as cloudinary } from "cloudinary"

const parseBool = (v, defaultVal = false) => {
  if (typeof v === "boolean") return v
  if (typeof v === "string") return v.toLowerCase() === "true"
  return defaultVal
}

const createNew = async (req, res, next) => {
  try {
    let imageUrls = []

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "boards" })
      )
      const results = await Promise.all(uploadPromises)
      imageUrls = results.map((r) => r.secure_url)
    }

    const createdBoard = await boardService.createNew({
      ...req.body,
      images: imageUrls // nhiều ảnh
      // isPending mặc định true ở schema, không cần gửi từ FE
    })

    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const includePending = parseBool(req.query.includePending, false)
    const board = await boardService.getDetails(boardId, includePending)
    res.status(StatusCodes.OK).json(board)
  } catch (error) {
    next(error)
  }
}

const shareBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params
    const { userId } = req.body

    await boardModel.updateUserShare(boardId, userId)
    await AuthModel.updateSharedPosts(userId, boardId)

    res.status(StatusCodes.OK).json({ message: "Chia sẻ bài viết thành công" })
  } catch (error) {
    next(error)
  }
}

const getSharedPostsDetails = async (req, res, next) => {
  try {
    const userId = req.params.userId
    const page = parseInt(req.query.page) || 1
    const pageSize = 3

    const { sharedPosts, totalCount } =
      await AuthModel.getSharedPostsWithPagination(userId, page, pageSize)

    // Mặc định KHÔNG include pending
    const posts = await Promise.all(
      sharedPosts.map(async (boardId) => {
        try {
          const board = await boardService.getDetails(boardId.toString(), false)
          return board && board._id ? board : { _id: boardId }
        } catch (error) {
          console.error(`Error fetching board details for ID ${boardId}:`, error)
          return { _id: boardId }
        }
      })
    )

    const totalPages = Math.ceil(totalCount / pageSize)

    res.status(StatusCodes.OK).json({
      posts,
      currentPage: page,
      totalPages,
      totalCount
    })
  } catch (error) {
    next(error)
  }
}

const saveBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params
    const { userId } = req.body

    await AuthModel.updateSavedPosts(userId, boardId)

    res.status(StatusCodes.OK).json({ message: "Lưu bài viết thành công" })
  } catch (error) {
    next(error)
  }
}

const getSavedPostsDetails = async (req, res, next) => {
  try {
    const userId = req.params.userId
    const page = parseInt(req.query.page) || 1
    const pageSize = 9

    const { savedPosts, totalCount } =
      await AuthModel.getSavedPostsWithPagination(userId, page, pageSize)

    // Mặc định KHÔNG include pending
    const posts = await Promise.all(
      savedPosts.map(async (boardId) => {
        try {
          const board = await boardService.getDetails(boardId.toString(), false)
          return board && board._id ? board : { _id: boardId, deleted: true }
        } catch (error) {
          console.error(`Error fetching board details for ID ${boardId}:`, error)
          return { _id: boardId, deleted: true }
        }
      })
    )

    const totalPages = Math.ceil(totalCount / pageSize)

    res.status(StatusCodes.OK).json({
      posts,
      currentPage: page,
      totalPages,
      totalCount
    })
  } catch (error) {
    next(error)
  }
}

const getBoards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = 9
    const includePending = parseBool(req.query.includePending, false)

    const { boards, totalCount } = await boardService.getBoardsWithPagination(
      page,
      pageSize,
      includePending
    )

    const totalPages = Math.ceil(totalCount / pageSize)

    res.status(StatusCodes.OK).json({
      boards,
      currentPage: page,
      totalPages,
      totalCount
    })
  } catch (error) {
    console.error(error)
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred"
    })
  }
}

const searchPosts = async (req, res, next) => {
  try {
    const { q: searchTerm } = req.query
    const includePending = parseBool(req.query.includePending, false)

    const { error } = Joi.object({
      q: Joi.string().required().min(0).max(50)
    }).validate(req.query)

    if (error) {
      return next(
        new ApiError(StatusCodes.BAD_REQUEST, error.details[0].message)
      )
    }

    const results = await boardService.searchPosts(searchTerm, includePending)
    res.status(StatusCodes.OK).json(results)
  } catch (error) {
    next(error)
  }
}

const deleteSavedPost = async (req, res, next) => {
  try {
    const { userId, postId } = req.params
    const result = await AuthModel.deleteSavedPost(userId, postId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId
    const result = await boardService.deletePost(postId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

/* ✅ Toggle Like/Unlike */
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params // postId
    const { userId } = req.body

    if (!userId) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "UserId is required"))
    }

    const updatedPost = await boardService.toggleLike(id, userId)
    res.status(StatusCodes.OK).json(updatedPost)
  } catch (error) {
    next(error)
  }
}

/* 🆕 Get boards by hashtag */
const getBoardsByHashtag = async (req, res, next) => {
  try {
    const { tag } = req.query
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 9
    const includePending = parseBool(req.query.includePending, false)

    if (!tag) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Hashtag is required"))
    }

    const { boards, totalCount } = await boardService.getBoardsByHashtag(
      tag,
      page,
      pageSize,
      includePending
    )
    const totalPages = Math.ceil(totalCount / pageSize)

    res.status(StatusCodes.OK).json({
      boards,
      currentPage: page,
      totalPages,
      totalCount
    })
  } catch (error) {
    next(error)
  }
}

/* 🆕 Get boards by userId */
const getBoardsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 9
    const includePending = parseBool(req.query.includePending, false)

    const { boards, totalCount } = await boardService.getBoardsByUser(
      userId,
      page,
      pageSize,
      includePending
    )
    const totalPages = Math.ceil(totalCount / pageSize)

    res.status(StatusCodes.OK).json({
      boards,
      currentPage: page,
      totalPages,
      totalCount
    })
  } catch (error) {
    next(error)
  }
}

/* 🆕 Update board (nội dung/ảnh) */
const updateBoard = async (req, res, next) => {
  try {
    const { postId } = req.params
    let imageUrls = []

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "boards" })
      )
      const results = await Promise.all(uploadPromises)
      imageUrls = results.map((r) => r.secure_url)
    }

    const updateData = {
      content: typeof req.body.content === "string" ? req.body.content : undefined,
      ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
      updatedAt: new Date()
    }

    // lọc bỏ field undefined để tránh xoá nhầm
    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k])

    const updatedBoard = await boardService.updateBoard(postId, updateData)
    if (!updatedBoard) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Không tìm thấy bài viết" })
    }

    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) {
    console.error("❌ UpdateBoard error:", error)
    next(error)
  }
}

/* 🆕 Approve bài (đặt isPending=false) */
const approve = async (req, res, next) => {
  try {
    const { id } = req.params
    const updated = await boardService.approve(id)
    if (!updated) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Không tìm thấy bài viết" })
    }
    res.status(StatusCodes.OK).json(updated)
  } catch (error) {
    next(error)
  }
}

/* 🆕 Đặt trạng thái pending tuỳ ý */
const setPending = async (req, res, next) => {
  try {
    const { id } = req.params
    const schema = Joi.object({ isPending: Joi.boolean().required() })
    const { error, value } = schema.validate(req.body)
    if (error) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, error.details[0].message))
    }
    const updated = await boardService.setPendingStatus(id, value.isPending)
    if (!updated) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Không tìm thấy bài viết" })
    }
    res.status(StatusCodes.OK).json(updated)
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  createNew,
  getDetails,
  shareBoard,
  getSharedPostsDetails,
  saveBoard,
  getSavedPostsDetails,
  getBoards,
  searchPosts,
  deleteSavedPost,
  deletePost,
  toggleLike,
  getBoardsByHashtag,
  getBoardsByUser,
  updateBoard,
  // mới thêm cho kiểm duyệt
  approve,
  setPending
}
