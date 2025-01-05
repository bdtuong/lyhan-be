import { StatusCodes } from 'http-status-codes'
import { AuthModel } from '../models/AuthModel.js'
import ApiError from '../utils/ApiError.js'
import { slugify } from '../utils/formatters.js'

const createNew = async (reqBody) => {
    try{
        if (!reqBody || !reqBody.username) {
            throw new Error('Username is required');
        }
        // xử lý logic dữ liệu tùy đặc thù dự án
        const newUser = {
            ...reqBody,
            slug: slugify(reqBody.username)
        }
        // Gọi tầng Models để xử lý  lưu bản ghi newUser vào database
        const createdUser = await AuthModel.createNew(newUser)

        // lấy bản ghi User sau khi gọi 
        const getNewUser = await AuthModel.findOneById(createdUser.insertedId)
        
        // trả kết quả trong service
        return getNewUser
    } 
    
    catch (error) { throw error }
}




const getDetails = async (Userid) => {
    try{
        const User = await AuthModel.getDetails(Userid)
        if(!User){
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
        }
        
        return User
    } 
    
    catch (error) { throw error }
}

export const AuthService  ={
    createNew,
    getDetails,
}