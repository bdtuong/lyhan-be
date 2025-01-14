import { StatusCodes } from 'http-status-codes';
import { CommentService } from '../../services/CommentService.js';

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
        const updatedComment = await CommentService.updateComment(commentId, req.body);
        
        res.status(StatusCodes.OK).json(updatedComment);
    } catch (error) {
        next(error);
    }
};

const deleteComment = async (req, res, next) => {
    try {
        const commentId = req.params.id;
        const deleted = await CommentService.deleteComment(commentId);
        
        res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        next(error);
    }
};

export const CommentController = {
    createComment,
    getDetails,
    updateComment,
    deleteComment,
};
