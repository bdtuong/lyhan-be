import express from 'express'
import { StatusCodes} from 'http-status-codes'
import { userController } from '../../controllers/UsersCollection/UserController.js'

const Router2 = express.Router()

Router2.route('/')
    .get(userController.getAllUsers)

Router2.route('/:id')
    .get(userController.deleteUser)


export const UserRoute = Router2