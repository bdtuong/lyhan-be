import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'

const createNew = async (req, res, next) => {
    try {
        console.log('req.body:', req.body)
        console.log('req.query:', req.query)
        console.log('req.params:', req.params)
        console.log('req.files:', req.files)
        console.log('req.cookies:', req.cookies)
        console.log('req.jwtDecoded:', req.jwtDecoded)
        //điều hướng đến tầng service


        //throw new ApiError(StatusCodes.BAD_GATEWAY, 'Error from Controller: API create new board')
        //có kết quả thì trả về Client
        res.status(StatusCodes.CREATED).json({ message: 'POST from Controller: API create new board' })
    } catch (error) {
        next(error)
    }
}
export const boardController = {
    createNew
}