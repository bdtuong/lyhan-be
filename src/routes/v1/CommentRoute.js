import express from 'express'
import { CommentValidation } from '../../validations/AuthValidation.js'
import { CommentController } from '../../controllers/CommentsCollection/CommentController.js'

const Router3 = express.Router()

Router3.route('/')
    .post(CommentValidation.createNew, CommentController.createNew)

Router3.route('/:id')
    .get(AuthController.getDetails)
    .put

    
export const CommentRoute = Router3