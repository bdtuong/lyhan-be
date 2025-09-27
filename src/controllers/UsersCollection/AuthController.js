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

const forgotPassword = async (req, res) => {
  try {
    const { Email: email } = req.body;
    console.log("A) start forgotPassword", { email, hasKey: !!process.env.SENDGRID_API_KEY, from: process.env.EMAIL_FROM, fe: process.env.FRONTEND_URL });

    if (!email) return res.status(400).json({ message: "Email is required" });

    const resetToken = await AuthService.generateResetPasswordToken(email);
    console.log("B) token generated", !!resetToken);

    const transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: { user: "apikey", pass: process.env.SENDGRID_API_KEY },
      logger: true, // bật logger của nodemailer
      debug: true,  // bật debug SMTP (in ra log chi tiết)
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}?email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM, // phải là sender đã verify
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click:</p><a href="${resetLink}">${resetLink}</a>`
    };

    console.log("C) sending mail...");
    await transporter.sendMail(mailOptions);
    console.log("D) mail sent");

    return res.status(200).json({ message: "✅ Email đã được gửi. Hãy kiểm tra cả Spam/Junk." });
  } catch (err) {
    // Log lỗi chi tiết để đọc trong Render Logs
    console.error("forgotPassword ERROR:", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      response: err?.response?.body
    });
    // Trả JSON để FE không pending
    return res.status(500).json({ message: err?.response?.body || err?.message || "Internal Server Error" });
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

    //upload ảnh lên Cloudinary từ buffer
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
              return reject(error);
            }
            resolve(result.secure_url);
          }
        );
        uploadStream.end(buffer);
      });
    };

    //Chờ Cloudinary upload xong
    const avatarUrl = await uploadFromBuffer(req.file.buffer, userId);

    await AuthModel.updateAvatar(userId, avatarUrl);
    await myProfileModel.updateAvatar(userId, avatarUrl);

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


const deleteSharedPost = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const postId = req.params.postId;
    
    await AuthModel.deleteSharedPost(userId, postId);
    await myProfileModel.deleteSharedPost(userId, postId);

    res.status(StatusCodes.OK).json("Delete shared post successfully");
  } catch (error) {
    next(error);
  }
}


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
  deleteSharedPost
};
