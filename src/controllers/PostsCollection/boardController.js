import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import { boardService } from '~/services/boardService.js';
import { boardModel } from '~/models/boardModel.js';
import { AuthModel } from '~/models/AuthModel.js';
import Joi from 'joi'
const createNew = async (req, res, next) => {
  try {
    const createdBoard = await boardService.createNew(req.body);
    //throw new ApiError(StatusCodes.BAD_GATEWAY, 'Error from Controller: API create new board')

    //có kết quả thì trả về Client
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

// const shareBoard = async (req, res, next) => {
//     try {
//         const { boardId, userCollectionID } = req.body;

//         // Kiểm tra dữ liệu đầu vào
//         if (!boardId || !userCollectionID) {
//             throw new ApiError(StatusCodes.BAD_REQUEST, 'Board ID và User Collection ID là bắt buộc');
//         }

//         // Gọi service để chia sẻ board
//         const result = await boardService.shareBoard(boardId, userCollectionID);

//         // Trả về kết quả
//         res.status(StatusCodes.OK).json(result);
//     } catch (error) {
//         next(error);
//     }
// };

const shareBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { userId } = req.body; // Lấy userId từ body

    //console.log('boardId trong boardController: ', boardId);//log ra boardId(để debug)
    //console.log('userId: ', userId);//log ra userId(để debug)

    // Gọi model để cập nhật userShareCollectionID và sharedPosts
    await boardModel.updateUserShare(boardId, userId);
    await AuthModel.updateSharedPosts(userId, boardId);

    res.status(StatusCodes.OK).json({ message: 'Chia sẻ bài viết thành công' });
  } catch (error) {
    next(error);
  }
};

const getSharedPostsDetails = async (req, res, next) => {
  try {
    const { boardIds } = req.body;
    const posts = await Promise.all(
      boardIds.map(boardId => boardService.getDetails(boardId)),
    );
    res.status(StatusCodes.OK).json(posts);
  } catch (error) {
    next(error);
  }
};

const saveBoard = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { userId } = req.body; // Lấy userId từ body

    //console.log('boardId trong boardController: ', boardId);//log ra boardId(để debug)
    //console.log('userId: ', userId);//log ra userId(để debug)

    // Gọi model để cập nhật userShareCollectionID và sharedPosts
    await AuthModel.updateSavedPosts(userId, boardId);

    res.status(StatusCodes.OK).json({ message: 'Lưu bài viết thành công' });
  } catch (error) {
    next(error);
  }
};

const getSavedPostsDetails = async (req, res, next) => {
  try {
    const userId = req.params.userId; // Lấy userId từ URL params
    const page = parseInt(req.query.page) || 1;
    const pageSize = 12;

    const { savedPosts, totalCount } = await AuthModel.getSavedPostsWithPagination(
      userId,
      page,
      pageSize,
    );

    const posts = await Promise.all(
      savedPosts.map(async boardId => {
        try {
          return await boardService.getDetails(boardId.toString());
        } catch (error) {
          console.error(`Error fetching board details for ID ${boardId}:`, error);
          return null; 
        }
      }),
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
    const pageSize = 12;

    const { boards, totalCount } = await boardService.getBoardsWithPagination(
      page,
      pageSize,
    );

    const totalPages = Math.ceil(totalCount / pageSize); // Tính tổng số trang

    res.status(StatusCodes.OK).json({
      boards,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    // Xử lý lỗi
    console.error(error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || 'An error occurred',
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
      return next(new ApiError(StatusCodes.BAD_REQUEST, error.details[0].message));
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
  deletePost
};
