import { StatusCodes } from 'http-status-codes';
import { CommentModel } from '../models/commentModel.js';
import ApiError from '../utils/ApiError.js';
import { ObjectId } from 'mongodb';


const createComment = async (reqBody) => {
    try {
        const commentData = {
            ...reqBody,
            author: new ObjectId(reqBody.userId), // Convert userId to ObjectId
            boardID: new ObjectId(reqBody.boardId), // Assuming comments are linked to posts
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

const vote = async (commentId, userId, voteType) => {
    try {
        // In ra commentId nhận được từ controller(sài để debug)
        //console.log('commentId in service(string):', commentId); 

        // Chuyển đổi commentId sang ObjectId
        const commentObjectId = new ObjectId(commentId); 
        const comment = await CommentModel.findOneById(commentObjectId);
        if (!comment) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found');

        const existingVoteIndex = comment.votes.findIndex(v => v.userId === userId);

        // Xử lý logic vote
        let newVotes = [...comment.votes];
        if (existingVoteIndex >= 0) {
        // Nếu vote cùng loại - xóa vote
        if (newVotes[existingVoteIndex].type === voteType) {
            newVotes = newVotes.filter(v => v.userId !== userId);
        } else {
            // Thay đổi loại vote
            newVotes[existingVoteIndex] = { 
            userId, 
            type: voteType,
            createdAt: new Date().getTime()
            };
        }
        } else {
        // Thêm vote mới
        newVotes.push({ userId, type: voteType, createdAt: new Date().getTime() });
        }

        // Tính toán upvote/downvote mới
        const upvote = newVotes.filter(v => v.type === 'up').length;
        const downvote = newVotes.filter(v => v.type === 'down').length;

        // Cập nhật database
        const updatedComment = await CommentModel.updateOneById(
            new ObjectId(commentId),
            { 
                upvote,
                downvote,
                votes: newVotes,
                updatedAt: new Date().getTime()
            }
        );

        return updatedComment;
    } catch (error) {
        throw error;
    }
};

const getCommentsByPostId = async (postId) => {
    return await CommentModel.findManyByPostId(new ObjectId(postId));
};

export const CommentService = {
    createComment,
    getDetails,
    updateComment,
    deleteComment,
    getSortedComments,
    vote,
    getCommentsByPostId,
};
