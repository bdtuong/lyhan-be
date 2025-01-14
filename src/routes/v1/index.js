import express from 'express'
import { StatusCodes} from 'http-status-codes'
import {boardRoute} from './boardRoute.js'
import {AuthRoute} from './AuthRoute.js'
import {UserRoute} from './UserRoute.js'
import {boardCollectionRoute} from './boardCollectionRoute.js'
import {CommentRoute} from './CommentRoute.js'
import { myProfileRoute } from './myProfileRoute.js'

const Router = express.Router()

//Check APIs v1/status
Router.get('/status', (req,res) => {
    res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use.'})
})

//Board APIs v1/boards
Router.use('/boards',boardRoute)

//Auth APIs v1/Auth
Router.use('/Auth',AuthRoute)

//User APIs v1/User
Router.use('/User',UserRoute)

//User APIs v1/Comment
Router.use('/Comment',CommentRoute)


Router.use('/page',boardCollectionRoute)

//myProfile APIs v1/myProfile
Router.use('/myProfile',myProfileRoute)



export const APIs_V1 = Router