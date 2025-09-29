import { StatusCodes } from 'http-status-codes';
import { boardModel } from '../models/boardModel.js';
import ApiError from '~/utils/ApiError.js';
import { ObjectId } from 'mongodb';

// 🟢 Tạo board mới
const createNew = async (reqBody) => {
  try {
    const objectId = {
      ...reqBody,
      userID: new ObjectId(reqBody.userId), // đồng bộ field userID để join sang AuthModel
      images: reqBody.images || []          // đảm bảo luôn có mảng images
      // isPending mặc định true ở schema (model)
    };

    const createdBoard = await boardModel.createNew(objectId);
    return { ...objectId, _id: createdBoard.insertedId };
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while creating new board: ' + error.message
    );
  }
};

// 🟢 Lấy chi tiết board theo id (mặc định ẩn pending)
const getDetails = async (boardId, includePending = false) => {
  try {
    const board = await boardModel.getDetails(boardId, { includePending });
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!');
    }
    return board;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while fetching board details: ' + error.message
    );
  }
};

// 🟢 Chia sẻ board
const shareBoard = async (boardId, userId) => {
  try {
    const result = await boardModel.updateUserShare(boardId, userId);
    if (!result.acknowledged) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Share board failed');
    }
    return { message: 'Chia sẻ board thành công' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while sharing board: ' + error.message
    );
  }
};

// 🟢 Lấy boards có phân trang (mặc định ẩn pending)
const getBoardsWithPagination = async (page, pageSize, includePending = false) => {
  try {
    const { boards, totalCount } = await boardModel.getBoardsWithPagination(
      page,
      pageSize,
      { includePending }
    );
    if (!boards) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Boards not found');
    }
    return { boards, totalCount };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while getting boards: ' + error.message
    );
  }
};

// 🟢 Search posts (mặc định ẩn pending)
const searchPosts = async (searchTerm, includePending = false) => {
  try {
    const results = await boardModel.searchPosts(searchTerm, { includePending });
    return results;
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while searching posts: ' + error.message
    );
  }
};

// 🟢 Delete post
const deletePost = async (postId) => {
  try {
    const result = await boardModel.deletePost(postId);
    if (result.deletedCount === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Delete post failed');
    }
    return { message: 'Delete post successfully!' };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while deleting post: ' + error.message
    );
  }
};

// 🟢 Toggle like/unlike
const toggleLike = async (postId, userId) => {
  try {
    const board = await boardModel.findOneById(postId);
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found');
    }

    const likes = board.likes || [];
    const userObjId = new ObjectId(userId);

    let updatedLikes;
    if (likes.some((id) => id.toString() === userObjId.toString())) {
      // unlike
      updatedLikes = likes.filter((id) => id.toString() !== userObjId.toString());
    } else {
      // like
      updatedLikes = [...likes, userObjId];
    }

    const updatedBoard = await boardModel.updateOneById(postId, {
      likes: updatedLikes,
      updatedAt: new Date()
    });

    return {
      ...updatedBoard,
      likesCount: updatedLikes.length
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while toggling like: ' + error.message
    );
  }
};

// 🟢 Get boards by hashtag (mặc định ẩn pending)
const getBoardsByHashtag = async (tag, page, pageSize, includePending = false) => {
  try {
    const { boards, totalCount } = await boardModel.getBoardsByHashtag(
      tag,
      page,
      pageSize,
      { includePending }
    );
    return { boards, totalCount };
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while getting boards by hashtag: ' + error.message
    );
  }
};

// 🟢 Get boards by user (mặc định ẩn pending)
const getBoardsByUser = async (userId, page, pageSize, includePending = false) => {
  try {
    const { boards, totalCount } = await boardModel.getBoardsByUser(
      userId,
      page,
      pageSize,
      { includePending }
    );
    return { boards, totalCount };
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while getting boards by user: ' + error.message
    );
  }
};

// 🟢 Update board (nội dung/ảnh)
const updateBoard = async (postId, updateData) => {
  try {
    updateData.updatedAt = new Date(); // model cũng set, nhưng set ở đây không sao
    const updatedBoard = await boardModel.updateBoard(postId, updateData);
    if (!updatedBoard) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found to update');
    }
    return updatedBoard;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while updating board: ' + error.message
    );
  }
};

/* 🆕 KIỂM DUYỆT */
// Duyệt bài: đặt isPending=false
const approve = async (postId) => {
  try {
    const updated = await boardModel.approveBoard(postId);
    if (!updated) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found to approve');
    }
    return updated;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while approving board: ' + error.message
    );
  }
};

// Đặt trạng thái pending tuỳ ý
const setPendingStatus = async (postId, isPending) => {
  try {
    const updated = await boardModel.setPendingStatus(postId, isPending);
    if (!updated) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found to set pending');
    }
    return updated;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Error while setting pending: ' + error.message
    );
  }
};

export const boardService = {
  createNew,
  getDetails,
  shareBoard,
  getBoardsWithPagination,
  searchPosts,
  deletePost,
  toggleLike,
  getBoardsByHashtag,
  getBoardsByUser,
  updateBoard,
  // kiểm duyệt
  approve,
  setPendingStatus
};
