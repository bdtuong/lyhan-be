import { StatusCodes } from 'http-status-codes'
import { AuthService } from '../../services/AuthService.js'
import { AuthModel } from '../../models/AuthModel.js'
import  ApiError  from '../../utils/ApiError.js'
import { env } from '../../config/environment.js'
import bcrypt from 'bcrypt'
import  jwt  from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { myProfileService } from '../../services/myProfileService.js'

const createNew = async (req, res, next) => {
    try {
        
        //điều hướng đến tầng service
        const createdUser = await AuthService.createNew(req.body)
        
        // Tạo profile tự động sau khi tạo user thành công (cách 2-tạo ở backend)
        const profileData = {
            username: req.body.username,
            owner: createdUser._id.toString(), 
        };
        await myProfileService.createmyProfile(profileData);           

        //có kết quả thì trả về Client
        res.status(StatusCodes.CREATED).json(createdUser)


    } catch (error) {
        next(error)
    }
}


//khi login sẽ push refresh token vào mảng
let refresh_tokens = [1]


const GenerateAccessToken = (User) => {
    return jwt.sign({
        id: User._id,
        admin: User.admin
    },
    env.JWT_ACCESS_TOKEN_SECRET,
    {expiresIn: '1m'}
    )
}

const GenerateRefreshToken = (User) => {
    return jwt.sign({
        id: User._id,
        admin: User.admin
    },
    env.JWT_REFRESH_TOKEN_SECRET,
    {expiresIn: '365d'}
    )
}

const LoginUser = async (req, res, next) => {
    try {
        const { userID, password: inputPassword } = req.body;

        // Find the user by userID
        const User = await AuthModel.findOne({ userID });
        if (!User) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
        }

        // Verify the password
        const ValidPassword = await bcrypt.compare(inputPassword, User.password);
        if (!ValidPassword) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Wrong Password');
        }

        if(User && ValidPassword){
        const access_token = GenerateAccessToken(User);
        const refreshtoken = GenerateRefreshToken(User);

        // Store the refresh token
        refresh_tokens.push(refreshtoken);
        // Set the refresh token as a cookie
        res.cookie('refreshtoken', refreshtoken, {
            httpOnly: true,
            path: '/refreshtoken',
            secure: false, // Set to true in production
            sameSite: 'strict', // Prevent CSRF
        });
        

        // Prepare the response without exposing the user's password
        const userData = User._doc || User; // Handle cases where _doc might be missing
        const { password, ...UserWithoutPassword } = userData;
        res.status(StatusCodes.OK).json({
            ...UserWithoutPassword,
            access_token,
        });
    }
    } catch (error) {
        next(error);
    }
};


//Reset lại access token, refresh token khi hết hạn
const requestRefreshToken = async (req, res, next) => {
    try {
        //Lấy refresh token từ cookies hoặc headers
        const refreshtoken = req.cookies?.refreshtoken || req.headers['authorization']?.split(' ')[1]; 

        if (!refreshtoken) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'No refresh token');
        }

        //Kiểm tra xem refresh token có hợp lệ không
        if (!refresh_tokens.includes(refreshtoken)) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is not valid');
        }

        //Verify refresh token
        jwt.verify(refreshtoken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, User) => {
            if (err) {
                throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
            }

            //Remove old refresh token
            refresh_tokens = refresh_tokens.filter(token => token !== refreshtoken);

            //Tạo access token và refresh token mới
            const new_access_token = GenerateAccessToken(User);
            const new_refreshtoken = GenerateRefreshToken(User);

            refresh_tokens.push(new_refreshtoken); // Update refresh tokens

            //Set refresh token cookie
            res.cookie('refreshtoken', new_refreshtoken, {
                httpOnly: true,
                path: '/refreshtoken',
                secure: process.env.NODE_ENV === 'production',  // Deploy server cần set true
                sameSite: "strict" 
            });

            res.status(StatusCodes.OK).json({ new_access_token });
        });
    } catch (error) {
        next(error);
    }
};


const getDetails = async (req, res, next) => {
    try {
        const Userid = req.params.id

        const User = await AuthService.getDetails(Userid)
    
        res.status(StatusCodes.OK).json(User)
    } catch (error) {
        next(error)
    }
}

const Logout = async (req, res) => {
    res.clearCookie('refreshtoken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        path: "/",
    })
    //lọc ra refresh token tồn tại
    refresh_tokens = refresh_tokens.filter(token => token !== req.cookies.refreshtoken)
    res.status(StatusCodes.OK).json({message: 'Logout success'})
}

//Lưu trữ Token
//(1) Lưu trữ vào LocalStorage(dễ bị hack XSS)

//(2) Lưu trữ vào Httponly Cookies (dễ bị hack CSRF -->Samesite cứu được)

//(3) Redux store để lưu access token
//(3) Httponly Cookies để lưu refresh token

//có thể xem BFF (Backend for Frontend) để xử lý vấn đề này


const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword, confirmNewPassword } = req.body;
        const userId = req.params.userId; // Lấy từ URL params
        
        // Kiểm tra userId có tồn tại và đúng định dạng không
        if (!userId || !ObjectId.isValid(userId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId");
        }

        // Chuyển đổi userId thành ObjectId
        const objectId = new ObjectId(userId);

        // Gọi service để xử lý logic
        const result = await AuthService.changePassword(objectId, oldPassword, newPassword, confirmNewPassword);

        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
};

export const AuthController = {
    createNew,
    getDetails,
    LoginUser,
    requestRefreshToken,
    Logout,
    changePassword
}