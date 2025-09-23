import { StatusCodes } from "http-status-codes";
import ApiError from "~/utils/ApiError.js";
import { boardService } from "~/services/boardService.js";
import { boardModel } from "~/models/boardModel.js";
import { AuthModel } from "~/models/AuthModel.js";
import Joi from "joi";
import { v2 as cloudinary } from "cloudinary";

const createNew = async (req, res, next) => {
  try {
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "boards" })
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map((r) => r.secure_url);
    }

    const createdBoard = await boardService.createNew({
      ...req.body,
      images: imageUrls, // 🆕 nhiều ảnh
    });

    res.status(StatusCodes.CREATED).json(createdBoard);
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const boardId = req.params.id;
    const board = await boardService.getDetails(boardId);
    res.status(StatusCodes.OK).json(board);
  } catch (error) {
    next(error);
  }
};

const shareBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { userId } = req.body;

    await boardModel.updateUserShare(boardId, userId);
    await AuthModel.updateSharedPosts(userId, boardId);

    res.status(StatusCodes.OK).json({ message: "Chia sẻ bài viết thành công" });
  } catch (error) {
    next(error);
  }
};

const getSharedPostsDetails = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 3;

    const { sharedPosts, totalCount } =
      await AuthModel.getSharedPostsWithPagination(userId, page, pageSize);

    const posts = await Promise.all(
      sharedPosts.map(async (boardId) => {
        try {
          const board = await boardService.getDetails(boardId.toString());
          return board && board._id ? board : { _id: boardId };
        } catch (error) {
          console.error(
            `Error fetching board details for ID ${boardId}:`,
            error
          );
          return { _id: boardId };
        }
      })
    );

    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(StatusCodes.OK).json({
      posts,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    next(error);
  }
};

const saveBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { userId } = req.body;

    await AuthModel.updateSavedPosts(userId, boardId);

    res.status(StatusCodes.OK).json({ message: "Lưu bài viết thành công" });
  } catch (error) {
    next(error);
  }
};

const getSavedPostsDetails = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 9;

    const { savedPosts, totalCount } =
      await AuthModel.getSavedPostsWithPagination(userId, page, pageSize);

    const posts = await Promise.all(
      savedPosts.map(async (boardId) => {
        try {
          const board = await boardService.getDetails(boardId.toString());
          return board && board._id ? board : { _id: boardId, deleted: true };
        } catch (error) {
          console.error(
            `Error fetching board details for ID ${boardId}:`,
            error
          );
          return { _id: boardId, deleted: true };
        }
      })
    );

    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(StatusCodes.OK).json({
      posts,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    next(error);
  }
};

const getBoards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 9;

    const { boards, totalCount } = await boardService.getBoardsWithPagination(
      page,
      pageSize
    );

    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(StatusCodes.OK).json({
      boards,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "An error occurred",
    });
  }
};

const searchPosts = async (req, res, next) => {
  try {
    const { q: searchTerm } = req.query;
    const { error } = Joi.object({
      q: Joi.string().required().min(0).max(50),
    }).validate(req.query);

    if (error) {
      return next(
        new ApiError(StatusCodes.BAD_REQUEST, error.details[0].message)
      );
    }

    const results = await boardService.searchPosts(searchTerm);
    res.status(StatusCodes.OK).json(results);
  } catch (error) {
    next(error);
  }
};

const deleteSavedPost = async (req, res, next) => {
  try {
    const { userId, postId } = req.params;
    const result = await AuthModel.deleteSavedPost(userId, postId);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const result = await boardService.deletePost(postId);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

/* ✅ Toggle Like/Unlike */
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params; // postId
    const { userId } = req.body;

    if (!userId) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "UserId is required"));
    }

    const updatedPost = await boardService.toggleLike(id, userId);
    res.status(StatusCodes.OK).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

/* 🆕 Get boards by hashtag */
const getBoardsByHashtag = async (req, res, next) => {
  try {
    const { tag } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 9;

    if (!tag) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Hashtag is required"));
    }

    const { boards, totalCount } = await boardService.getBoardsByHashtag(
      tag,
      page,
      pageSize
    );
    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(StatusCodes.OK).json({
      boards,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    next(error);
  }
};

/* 🆕 Get boards by userId */
const getBoardsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 9;

    const { boards, totalCount } = await boardService.getBoardsByUser(
      userId,
      page,
      pageSize
    );
    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(StatusCodes.OK).json({
      boards,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    next(error);
  }
};

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
  getBoardsByUser, // 🆕 export thêm
};
