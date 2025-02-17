import { StatusCodes } from 'http-status-codes';
import { boardModel } from '../models/boardModel.js';
import ApiError from '~/utils/ApiError.js';
import { ObjectId } from 'mongodb';

const createNew = async reqBody => {
  try {
    // xử lý logic dữ liệu tùy đặc thù dự án

    const objectId = {
      ...reqBody,
      userID: new ObjectId(reqBody.userId),
    };

    // Gọi tầng Models để xử lý  lưu bản ghi newBoard vào databas
    const createdBoard = await boardModel.createNew(objectId);
    //console.log(createdBoard)
    // lấy bản ghi board sau khi gọi
    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId);
    //console.log(getNewBoard)

    return getNewBoard;
  } catch (error) {
    throw error;
  }
};

const getDetails = async boardId => {
  try {
    // Gọi tầng Models để xử lý  lưu bản ghi newBoard vào database
    const board = await boardModel.getDetails(boardId);
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!');
    }
    //console.log(createdBoard)
    // trả kết quả trong service
    return board;
  } catch (error) {
    throw error;
  }
};

const getSortedBoard = async id => {
  try {
    return await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    throw new Error(error);
  }
};

const shareBoard = async (boardId, userCollectionID) => {
  try {
    // Tìm board theo ID
    const board = await GET_DB()
      .collection('boards')
      .findOne({ _id: new ObjectId(boardId) });
    if (!board) {
      throw new Error('Board không tồn tại');
    }

    // Kiểm tra xem userCollectionID đã có trong mảng chưa
    if (board.userShareCollectionID.includes(userCollectionID)) {
      throw new Error('User đã chia sẻ board này rồi');
    }

    // Cập nhật mảng userShareCollectionID
    const result = await GET_DB()
      .collection('boards')
      .updateOne(
        { _id: new ObjectId(boardId) },
        { $push: { userShareCollectionID: userCollectionID } },
      );

    if (result.modifiedCount === 0) {
      throw new Error('Không thể chia sẻ board');
    }

    return { message: 'Chia sẻ board thành công' };
  } catch (error) {
    throw error;
  }
};

const getBoardsWithPagination = async (page, pageSize) => {
  try {
    const { boards, totalCount } = await boardModel.getBoardsWithPagination(
      page,
      pageSize,
    );

    if (!boards) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Boards not found');
    }

    return {
      boards,
      totalCount,
    };
  } catch (error) {
    console.error('Error getting boards with pagination:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'An error occurred while getting boards',
    );
  }
};


const searchPosts = async (searchTerm) => {
  try {
    const results = await boardModel.searchPosts(searchTerm);
    return results;
  } catch (error) {
    throw error;
  }
};

export const boardService = {
  createNew,
  getDetails,
  shareBoard,
  getBoardsWithPagination,
  searchPosts,
};
