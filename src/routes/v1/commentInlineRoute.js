import express from 'express';
import { CommentInlineValidation } from '../../validations/commentInclineValidation.js';
import { CommentInclineController } from '../../controllers/CommentsCollection/CommentInlineController.js';

const Router5 = express.Router();

Router5.route('/').post(
  CommentInlineValidation.createComment,
  CommentInclineController.createComment,
);

Router5.route('/:id').get(CommentInclineController.getDetails).put;

export const CommentInclineRoute = Router5;
