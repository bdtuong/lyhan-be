import express from 'express'
import { StatusCodes} from 'http-status-codes'
import { boardValidation } from '../../validations/boardvalidation.js'
import { boardController } from '../../controllers/boardController.js'

const Router = express.Router()

Router.route('/')
    .get((req,res)=>{
        res.status(StatusCodes.OK).json({ message: 'GET: API get list boards'})
    })
    .post(boardValidation.createNew, boardController.createNew)

Router.route('/:id')
    .get(boardController.getDetails)
    .put() // update

export const boardRoute = Router