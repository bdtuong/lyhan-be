import { StatusCodes } from 'http-status-codes'
import { boardscollectionModel } from '../models/boardCollectionModel.js'
import ApiError from '../utils/ApiError.js'
import { slugify } from '../utils/formatters.js'


const createNew = async (reqBody) => {
    try{
        

        // xử lý logic dữ liệu tùy đặc thù dự án
        const newUser = {
            ...reqBody,
            slug: slugify(reqBody.title)
        }
        // Gọi tầng Models để xử lý  lưu bản ghi newUser vào database
        const createdTitle = await boardscollectionModel.createNew(newUser)

        // lấy bản ghi User sau khi gọi 
        const getNewTitle = await boardscollectionModel.findOneById(createdTitle.insertedId)
        
        // trả kết quả trong service
        return getNewTitle
    } 
    
    catch (error) { throw error }
}




const getDetails = async (titleid) => {
    try{
        const boardsCollection = await boardscollectionModel.getDetails(titleid)
        if(!boardsCollection){
            throw new ApiError(StatusCodes.NOT_FOUND, 'boardsCollection not found')
        }
        
        return boardsCollection
    } 
    
    catch (error) { throw error }
}

export const boardCollectionService  ={
    createNew,
    getDetails,
}