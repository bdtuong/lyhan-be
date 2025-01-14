import express from 'express'
import { myProfileValidation } from '../../validations/myProfileValidation.js'
import { myProfileController } from '../../controllers/UsersCollection/myProfileController.js'

const Router4 = express.Router()

Router4.route('/')
    .post(myProfileValidation.createmyProfile, myProfileController.createmyProfile)

Router4.route('/:id')
    .get(myProfileController.getDetails)
    .put


export const myProfileRoute = Router4