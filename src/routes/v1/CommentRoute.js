import express from 'express';
import { CommentValidation } from '~/validations/CommentValidation.js';
import { CommentController } from '~/controllers/CommentsCollection/CommentController.js';

const Router3 = express.Router();

// tạo comment gốc
Router3.post('/', CommentValidation.createComment, CommentController.createComment);

// reply vào comment
Router3.post('/:commentId/replies', CommentValidation.createComment, CommentController.replyComment);

// lấy comments theo board (đặt trước /:id để tránh conflict)
Router3.get('/board/:boardId', CommentController.getByBoard);

// lấy chi tiết 1 comment
Router3.get('/:id', CommentController.getDetails);

// vote comment
Router3.post('/:id/vote', CommentValidation.vote, CommentController.vote);

// xóa comment
Router3.delete('/:id/delete', CommentController.deleteComment);


export const CommentRoute = Router3;
