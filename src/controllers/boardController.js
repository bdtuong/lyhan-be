import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/ApiError.js'
import { boardService } from '../services/boardService.js'
const createNew = async (req, res, next) => {
    try {
        //console.log('req.body:', req.body)
        //console.log('req.query:', req.query)
        //console.log('req.params:', req.params)
        //console.log('req.files:', req.files)
        //console.log('req.cookies:', req.cookies)
        //console.log('req.jwtDecoded:', req.jwtDecoded)
        //điều hướng đến tầng service
        const createdBoard = await boardService.createNew(req.body)
    
        //throw new ApiError(StatusCodes.BAD_GATEWAY, 'Error from Controller: API create new board')
        //có kết quả thì trả về Client
        res.status(StatusCodes.CREATED).json(createdBoard)
    } catch (error) {
        next(error)
    }
}

const getDetails = async (req, res, next) => {
    try {

        //console.log('req.params:', req.params)
        const boardId = req.params.id

        const board = await boardService.getDetails(boardId)

        res.status(StatusCodes.OK).json(board)
    } catch (error) {
        next(error)
    }
}
export const boardController = {
    createNew,
    getDetails
}