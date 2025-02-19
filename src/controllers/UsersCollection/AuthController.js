import { StatusCodes } from 'http-status-codes';
import { AuthService } from '~/services/AuthService.js';
import { AuthModel } from '~/models/AuthModel.js';
import ApiError from '~/utils/ApiError.js';
import { env } from '~/config/environment.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { myProfileService } from '~/services/myProfileService.js';
import { myProfileModel } from '~/models/myProfileModel.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import cloudinary from 'cloudinary';



cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const createNew = async (req, res, next) => {
  try {
    //điều hướng đến tầng service
    const createdUser = await AuthService.createNew(req.body);

    // Tạo profile tự động sau khi tạo user thành công (cách 2-tạo ở backend)
    const profileData = {
      username: req.body.username,
      owner: createdUser._id.toString(),
    };
    await myProfileService.createmyProfile(profileData);

    // Tạo access token
    const access_token = GenerateAccessToken(createdUser);

    //có kết quả thì trả về Client
    res.status(StatusCodes.CREATED).json({ access_token });
  } catch (error) {
    next(error);
  }
};

//khi login sẽ push refresh token vào mảng
//let refresh_tokens = [1]

const GenerateAccessToken = User => {
  return jwt.sign(
    {
      id: User._id,
      admin: User.admin,
    },
    env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: '1d' },
  );
};

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

      res.status(StatusCodes.OK).json({
        // ...UsertoUI,
        access_token,
      });
    }
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const Userid = req.params.id;

    const User = await AuthService.getDetails(Userid);

    res.status(StatusCodes.OK).json(User);
  } catch (error) {
    next(error);
  }
};

const Logout = async (req, res) => {
  res.status(StatusCodes.OK).json({ message: 'Logout success' });
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.params.userId; // Lấy từ URL params

    // Kiểm tra userId có tồn tại và đúng định dạng không
    if (!userId || !ObjectId.isValid(userId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid userId');
    }

    // Chuyển đổi userId thành ObjectId
    const objectId = new ObjectId(userId);

    // Gọi service để xử lý logic
    const result = await AuthService.changePassword(
      objectId,
      oldPassword,
      newPassword,
      confirmNewPassword,
    );

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
      },
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
            `,
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
    const { username } = req.body;
    const userId = req.params.userId;

    if (!userId || !ObjectId.isValid(userId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid userId');
    }

    // Chuyển đổi userId tính ObjectId
    const objectId = new ObjectId(userId);

    // Gọi service để xử lý logic
    const result = await AuthService.changeUsername(objectId, username);

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const handleAvatarUpload = (req, res, next) => {
  upload.single('avatar')(req, res, err => {
    if (err) {
      return next(err);
    }
    next();
  });
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { userId } = req.params;

    // 📌 Hàm upload ảnh lên Cloudinary từ buffer
    const uploadFromBuffer = (buffer, userId) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            folder: "avatars",
            public_id: `avatar_${userId}`,
            overwrite: true,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              return reject(error);
            }
            resolve(result.secure_url);
          }
        );
        uploadStream.end(buffer);
      });
    };

    // 🔹 Chờ Cloudinary upload xong
    const avatarUrl = await uploadFromBuffer(req.file.buffer, userId);
    console.log("Avatar URL:", avatarUrl);

    // 🔹 Cập nhật avatar vào database
    await AuthModel.updateAvatar(userId, avatarUrl);
    await myProfileModel.updateAvatar(userId, avatarUrl);

    // 🔹 Trả về kết quả
    res.status(StatusCodes.OK).json({ message: 'Avatar updated successfully', avatarUrl });

  } catch (error) {
    next(error);
  }
};


const getAvatar = async (req, res, next) => {
  try {
    const user = await AuthModel.findOneById(req.params.userId);
    if (!user || !user.avatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }
    // Trả về URL của avatar
    res.status(StatusCodes.OK).json({ avatarUrl: user.avatar });
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
  getAvatar,
};
