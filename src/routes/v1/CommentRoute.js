import express from 'express'
import { CommentValidation } from '../../validations/CommentValidation.js'
import { CommentController } from '../../controllers/CommentsCollection/CommentController.js'

const Router3 = express.Router()

Router3.route('/')
    .post(CommentValidation.createComment, CommentController.createComment)

Router3.route('/:id')
    .get(CommentController.getDetails)
    .put

    
export const CommentRoute = Router3