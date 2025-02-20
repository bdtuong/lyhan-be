import { StatusCodes } from 'http-status-codes';
import { CommentService } from '~/services/CommentService.js';
import { CommentModel} from '~/models/commentModel.js'

const createComment = async (req, res, next) => {
  try {
    const createdComment = await CommentService.createComment(req.body);
    res.status(StatusCodes.CREATED).json(createdComment);
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const comment = await CommentService.getDetails(commentId);

    res.status(StatusCodes.OK).json(comment);
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const updatedComment = await CommentService.updateComment(
      commentId,
      req.body,
    );

    res.status(StatusCodes.OK).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;

    // Xóa comment từ MongoDB
    const deletedComment = await CommentModel.deleteOneById(commentId);

    if (!deletedComment) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Comment not found" });
    }

    res.status(StatusCodes.OK).json('Delete comment successfully!');
  } catch (error) {
    next(error);
  }
};

const vote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, userId } = req.body;

    // In ra commentId để kiểm tra(sài để debug)
    //console.log('commentId in controller (string):', id);

    // Gọi hàm vote của CommentService với 3 tham số
    const updatedComment = await CommentService.vote(id, userId, type);

    if (!updatedComment) {
      return next(new ApiError(StatusCodes.NOT_FOUND, 'Comment not found'));
    }

    res.status(200).json(updatedComment);
  } catch (error) {
    next(error);
  }
};

export const CommentController = {
  createComment,
  getDetails,
  updateComment,
  deleteComment,
  vote,
};
