import express from 'express'
import { StatusCodes} from 'http-status-codes'
import { boardValidation } from '../../validations/boardValidation.js'
import { boardController } from '../../controllers/PostsCollection/boardController.js'

const Router = express.Router()

Router.route('/')
    .post(boardValidation.createNew, boardController.createNew)


Router.route('/:id')
    .get(boardController.getDetails)
    .put

Router.route('/:id/share')
    .post(boardController.shareBoard);


    export const boardRoute = Router

