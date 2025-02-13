import { StatusCodes } from 'http-status-codes'
import { AuthService } from '../../services/AuthService.js'
import { AuthModel } from '../../models/AuthModel.js'
import ApiError from '../../utils/ApiError.js'
import { env } from '../../config/environment.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { myProfileService } from '../../services/myProfileService.js'
import { myProfileModel } from '../../models/myProfileModel.js'
import nodemailer from 'nodemailer'
import multer from 'multer'
import path from 'path'

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

    // Tạo access token
    const access_token = GenerateAccessToken(createdUser);


    //có kết quả thì trả về Client
    res.status(StatusCodes.CREATED).json({ access_token })


    } catch (error) {
    next(error)
    }
}


//khi login sẽ push refresh token vào mảng
//let refresh_tokens = [1]


const GenerateAccessToken = (User) => {
    return jwt.sign({
    id: User._id,
    admin: User.admin,
    },
    env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: '1d' }
    )
}

// const GenerateRefreshToken = (User) => {
//     return jwt.sign({
//         id: User._id,
//         admin: User.admin
//     },
//     env.JWT_REFRESH_TOKEN_SECRET,
//     {expiresIn: '365d'}
//     )
// }

const LoginUser = async (req, res, next) => {
    try {
    const { email, password: inputPassword } = req.body;

    // Find the user by userID
    const User = await AuthModel.findOne({ email });
    if (!User) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Verify the password
    const ValidPassword = await bcrypt.compare(inputPassword, User.password);
    if (!ValidPassword) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Wrong Password');
    }

    if (User && ValidPassword) {
        const access_token = GenerateAccessToken(User);
      //const refreshtoken = GenerateRefreshToken(User);

      // Store the refresh token
      // refresh_tokens.push(refreshtoken);
      // Set the refresh token as a cookie
      // res.cookie('refreshtoken', refreshtoken, {
      //     httpOnly: true,
      //     path: '/refreshtoken',
      //     secure: false, // Set to true in production
      //     sameSite: 'strict', // Prevent CSRF
      // });


      // Prepare the response without exposing the user's password
      // const userData = User._doc || User; // Handle cases where _doc might be missing
      // const { password,userID,slug,admin,createdAt,updatedAt, _destroy, ...UsertoUI } = userData;
        res.status(StatusCodes.OK).json({
        // ...UsertoUI,
        access_token,
        });
    }
    } catch (error) {
    next(error);
    }
};


//Reset lại access token, refresh token khi hết hạn
// const requestRefreshToken = async (req, res, next) => {
//     try {
//         //Lấy refresh token từ cookies hoặc headers
//         const refreshtoken = req.cookies?.refreshtoken || req.headers['authorization']?.split(' ')[1]; 

//         if (!refreshtoken) {
//             throw new ApiError(StatusCodes.UNAUTHORIZED, 'No refresh token');
//         }

//         //Kiểm tra xem refresh token có hợp lệ không
//         if (!refresh_tokens.includes(refreshtoken)) {
//             throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is not valid');
//         }

//         //Verify refresh token
//         jwt.verify(refreshtoken, process.env.JWT_REFRESH_TOKEN_SECRET, (err, User) => {
//             if (err) {
//                 throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
//             }

//             //Remove old refresh token
//             refresh_tokens = refresh_tokens.filter(token => token !== refreshtoken);

//             //Tạo access token và refresh token mới
//             const new_access_token = GenerateAccessToken(User);
//             const new_refreshtoken = GenerateRefreshToken(User);

//             refresh_tokens.push(new_refreshtoken); // Update refresh tokens

//             //Set refresh token cookie
//             res.cookie('refreshtoken', new_refreshtoken, {
//                 httpOnly: true,
//                 path: '/refreshtoken',
//                 secure: process.env.NODE_ENV === 'production',  // Deploy server cần set true
//                 sameSite: "strict" 
//             });

//             res.status(StatusCodes.OK).json({ new_access_token });
//         });
//     } catch (error) {
//         next(error);
//     }
// };


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
  // res.clearCookie('refreshtoken', {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: "strict",
  //     path: "/",
  // })
  // //lọc ra refresh token tồn tại
  // refresh_tokens = refresh_tokens.filter(token => token !== req.cookies.refreshtoken)
    res.status(StatusCodes.OK).json({ message: 'Logout success' })
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

const forgotPassword = async (req, res, next) => {
    try {
        const Email = req.body;
        const email = Email.Email;
        const resetToken = await AuthService.generateResetPasswordToken(email);

        // Tạo transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_URL,
                pass: process.env.EMAIL_PASS,
            }
        });

        // Tạo nội dung email
        const mailOptions = {
            from: process.env.EMAIL_URL, 
            to: email,
            subject: 'Password Reset Request',
            html: `
                <p>You are receiving this email because you (or someone else) has requested the reset of the password for your account.</p>
                <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}?email=${email}">${process.env.FRONTEND_URL}/reset-password/${resetToken}?email=${email}</a>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            `
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    res.status(StatusCodes.OK).json({ message: 'Password reset email sent' });
    } catch (error) {
    next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
    const { token } = req.params;
    const { email, password, confirmPassword } = req.body;

    await AuthService.resetPassword(token, email, password, confirmPassword);

    res.status(StatusCodes.OK).json({ message: 'Password reset successfully' });
    } catch (error) {
    next(error);
    }
};

const changeUsername = async (req, res, next) => {
    try {
        const  {username}  = req.body;
        const userId = req.params.userId;

        if (!userId || !ObjectId.isValid(userId)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid userId");
        }

        // Chuyển đổi userId tính ObjectId
        const objectId = new ObjectId(userId);

        // Gọi service để xử lý logic
        const result = await AuthService.changeUsername(objectId, username); 

        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        next(error);
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './src/avatars'); // Thư mục lưu trữ ảnh
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({storage: storage})

const handleAvatarUpload = (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
        return next(err);
        }
        next(); // Chuyển đến hàm updateAvatar
    });
};

const updateAvatar = async (req, res, next) => {
    try {
        console.log(req.file); // Kiểm tra giá trị của req.file

        if (!req.file) { // Kiểm tra xem file có tồn tại không
        return res.status(400).json({ message: 'No file uploaded' });
        }

        const {userId} = req.params;
        const avatarUrl = req.file.path;
        await AuthModel.updateAvatar(userId, avatarUrl);
        await myProfileModel.updateAvatar(userId, avatarUrl);

        res.status(StatusCodes.OK).json({ message: 'Avatar updated successfully' }); 
    } catch (error) {
        next(error);
    }
};

const getAvatar = async (req, res, next) => {
    try {
        const {content, contentType} = await AuthModel.getAvatar(req.params.userId);
        res.setHeader('Content-Type', contentType);
        res.send(content);
    
    } catch (error) {
        next(error);
    }
};

export const AuthController = {
    createNew,
    getDetails,
    LoginUser,
  //requestRefreshToken,
    Logout,
    changePassword,
    forgotPassword,
    resetPassword,
    changeUsername,
    updateAvatar,
    handleAvatarUpload,
    getAvatar
}
