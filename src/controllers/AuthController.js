import { StatusCodes } from 'http-status-codes'
import { AuthService } from '../services/AuthService.js'
import { AuthModel } from '../models/AuthModel.js'
import  ApiError  from '../utils/ApiError.js'
import bcrypt from 'bcrypt'
import  jwt  from 'jsonwebtoken'


const createNew = async (req, res, next) => {
    try {
        
        //điều hướng đến tầng service
        const createdUser = await AuthService.createNew(req.body)
    
        //có kết quả thì trả về Client
        res.status(StatusCodes.CREATED).json(createdUser)
    } catch (error) {
        next(error)
    }
}


//khi login sẽ push refresh token vào mảng
let refreshtokens = []


const GenerateAccessToken = (User) => {
    return jwt.sign({
        id: User.id,
        admin: User.admin
    },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    {expiresIn: '1m'}
    )
}

const GenerateRefreshToken = (User) => {
    return jwt.sign({
        id: User.id,
        admin: User.admin
    },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    {expiresIn: '365d'}
    )
}

const LoginUser = async (req, res, next) => {
    try {
        const {userID, password} = req.body

        //tìm UserID
        const User = await AuthModel.findOne({userID})
        if(!User){
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
        }

        //so sánh Password
        const ValidPassword = await bcrypt.compare(password, User.password)
        if(!ValidPassword){
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Wrong Password')
        }
        //đúng
        if(User && ValidPassword){
            
            const access_token = GenerateAccessToken(User)
            const refreshtoken = GenerateRefreshToken(User)
            refreshtokens.push(refreshtoken)//token ở trong cookies
            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/refreshtoken',
                secure:false,//deploy lên server thì true
                sameSite: "strict" // ngăn chặn CSRF
            })
            res.status(StatusCodes.OK).json({message: 'Login success',User , access_token})
        }
    } catch (error) {
        next(error)
    }
}


//Reset lại access token, refresh token khi hết hạn
const requestRefreshToken = async (req, res) => {
    //Lấy refresh token từ User
    const refreshtoken = req.cookies.refreshtoken
    if(!refreshtoken){
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'No refresh token')
    }
    //nếu không phải refresh token của mình thì báo lỗi
    if(!refreshtokens.includes(refreshtoken)){
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is not valid')
    }
    jwt.verify(refreshtoken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, User) => {
        if(err){
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token')
        }
        //lọc ra refresh token cũ
        refreshtokens = refreshtokens.filter(token => token !== refreshtoken)
        //tạo access token, refresh token mới
        const new_access_token = GenerateAccessToken(User)
        const new_refreshtoken = GenerateRefreshToken(User)
        refreshtokens.push(new_refreshtoken)
        res.cookie('refreshtoken', new_refreshtoken, {
            httpOnly: true,
            path: '/refreshtoken',
            secure:false,//deploy lên server thì true
            sameSite: "strict" // ngăn chặn CSRF
        })
        res.status(StatusCodes.OK).json({new_access_token})
    })

}

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
    res.clearCookie('refreshtoken')
    //lọc ra refresh token tồn tại
    refreshtokens = refreshtokens.filter(token => token !== req.cookies.refreshtoken)
    res.status(StatusCodes.OK).json({message: 'Logout success'})
}

//Lưu trữ Token
//(1) Lưu trữ vào LocalStorage(dễ bị hack XSS)

//(2) Lưu trữ vào Httponly Cookies (dễ bị hack CSRF -->Samesite cứu được)

//(3) Redux store để lưu access token
//(3) Httponly Cookies để lưu refresh token

//có thể xem BFF (Backend for Frontend) để xử lý vấn đề này

export const AuthController = {
    createNew,
    getDetails,
    LoginUser,
    requestRefreshToken,
    Logout
}