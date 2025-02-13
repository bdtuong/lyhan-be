import { StatusCodes } from 'http-status-codes';
import { CommentInlineService } from '../../services/commentInlineService.js';

const createComment = async (req, res, next) => {
  try {
    const createdComment = await CommentInlineService.createComment(req.body);
    res.status(StatusCodes.CREATED).json(createdComment);
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const comment = await CommentInlineService.getDetails(commentId);

    res.status(StatusCodes.OK).json(comment);
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const updatedComment = await CommentInlineService.updateComment(
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
    const deleted = await CommentInlineService.deleteComment(commentId);

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

export const CommentInclineController = {
  createComment,
  getDetails,
  updateComment,
  deleteComment,
};
