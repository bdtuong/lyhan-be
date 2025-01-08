import express from 'express'
import { StatusCodes} from 'http-status-codes'
import { boardValidation } from '../../validations/boardValidation.js'
import { boardController } from '../../controllers/PostsCollection/boardController.js'

const Router = express.Router()

Router.route('/')
    .get((req,res)=>{
        res.status(StatusCodes.OK).json({ message: 'GET: API get list boards'})
    })
    .post(boardValidation.createNew, boardController.createNew)


Router.route('/:id')
    .get(boardController.getDetails)
    .put


    export const boardRoute = Router

