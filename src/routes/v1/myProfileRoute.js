import express from 'express'
import { myProfileValidation } from '../../validations/myProfileValidation.js'
import { myProfileController } from '../../controllers/UsersCollection/myProfileController.js'

const Router4 = express.Router()

Router4.route('/')
    .post(myProfileValidation.createmyProfile, myProfileController.createmyProfile)
    .get(myProfileController.getAllProfiles)

Router4.route('/:owner')
    .put(myProfileValidation.createmyProfile, myProfileController.updateProfile)
    .get(myProfileController.getDetails) // Thêm route GET để lấy chi tiết profile


export const myProfileRoute = Router4