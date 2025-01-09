import { StatusCodes } from 'http-status-codes';
import { CommentModel } from '../models/CommentModel.js';
import ApiError from '../utils/ApiError.js';
import { ObjectId } from 'mongodb';


const createComment = async (reqBody) => {
    try {
        const commentData = {
            ...reqBody,
            author: new ObjectId(reqBody.userId), // Convert userId to ObjectId
            boardId: new ObjectId(reqBody.boardId), // Assuming comments are linked to posts
        };

        // Save the new comment to the database
        const createdComment = await CommentModel.createComment(commentData);

        // Retrieve the comment after creation
        const getNewComment = await CommentModel.findOneById(createdComment.insertedId);

        return getNewComment;
    } catch (error) {
        throw error;
    }
};


const getDetails = async (commentId) => {
    try {
        const comment = await CommentModel.findOneById(new ObjectId(commentId));
        if (!comment) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found!');
        }
        return comment;
    } catch (error) {
        throw error;
    }
};

const updateComment = async (commentId, updateData) => {
    try {
        const updatedComment = await CommentModel.updateOneById(new ObjectId(commentId), updateData);
        if (!updatedComment) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found!');
        }
        return updatedComment;
    } catch (error) {
        throw error;
    }
};

const deleteComment = async (commentId) => {
    try {
        const deleted = await CommentModel.deleteOneById(new ObjectId(commentId));
        if (!deleted) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found!');
        }
        return deleted;
    } catch (error) {
        throw error;
    }
};

const getSortedComments = async (postId) => {
    try {
        const comments = await CommentModel.findManyByPostId(new ObjectId(postId));
        return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        throw error;
    }
};

export const CommentService = {
    createComment,
    getDetails,
    updateComment,
    deleteComment,
    getSortedComments,
};
