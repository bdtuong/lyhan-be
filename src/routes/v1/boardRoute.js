import express from 'express'
import { StatusCodes} from 'http-status-codes'
import { boardValidation } from '../../validations/boardvalidation.js'
import bodyParser from 'body-parser'

const Router = express.Router()

Router.route('/')
    .get((req,res)=>{
        res.status(StatusCodes.OK).json({ message: 'GET: API get list boards'})
    })
    .post(boardValidation.createNew)

    export const boardRoute = Router