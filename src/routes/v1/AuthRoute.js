import express from 'express'
import { AuthValidation } from '../../validations/AuthValidation.js'
import { AuthController } from '../../controllers/AuthController.js'
import { middlewareToken } from '../../middlewares/middlewareToken.js'

const Router1 = express.Router()

Router1.route('/')
    .post(AuthValidation.createNew, AuthController.createNew)

Router1.route('/:id')
    .get(AuthController.getDetails)
    .put

Router1.route('/login')
    .post(AuthController.LoginUser)
    .put

Router1.route('/refreshtoken')
    .post(AuthController.requestRefreshToken)

Router1.route('/logout')//phải login mới logout được nên thêm middlewareToken.verifyToken
    .post(middlewareToken.verifyToken, AuthController.Logout)


    export const AuthRoute = Router1