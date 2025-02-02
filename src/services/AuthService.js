import { StatusCodes } from 'http-status-codes'
import { AuthModel } from '../models/AuthModel.js'
import ApiError from '../utils/ApiError.js'
import { slugify } from '../utils/formatters.js'
import bcrypt from 'bcrypt'

const createNew = async (reqBody) => {
    try{
        if (!reqBody || !reqBody.username) {
            throw new Error('Username is required');
        }
        const existingUser = await AuthModel.findOne({ userID: reqBody.userID });
        if (existingUser) {
            throw new ApiError(StatusCodes.CONFLICT, 'UserID already exists');
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
        
        const userData = User._doc || User; // Handle cases where _doc might be missing
        const { password,userID,slug,admin,createdAt,updatedAt, _destroy, ...UsertoUI } = userData;

        return UsertoUI
    } 
    
    catch (error) { throw error }
}

const changePassword = async (userId, oldPassword, newPassword) => {
    try {
        // 1. Kiểm tra userId hợp lệ
        if (!userId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid userId');
        }

        // 2. Tìm user trong database
        const user = await AuthModel.findOneById(userId);
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
        }

        // 3. Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Old password is incorrect');
        }

        // 4. Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 5. Cập nhật mật khẩu mới vào database (gọi AuthModel)
        await AuthModel.updatePassword(userId, hashedPassword);

        return { message: 'Password updated successfully' };
    } catch (error) {
        throw error;
    }
};

export const AuthService  ={
    createNew,
    getDetails,
    changePassword
}