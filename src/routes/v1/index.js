import express from 'express'
import { StatusCodes} from 'http-status-codes'
import {boardRoute} from './boardRoute.js'


import {AuthRoute} from './AuthRoute.js'
import {UserRoute} from './UserRoute.js'

const Router = express.Router()

//Check APIs v1/status
Router.get('/status', (req,res) => {
    res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use.'})
})





export const APIs_V1 = Router