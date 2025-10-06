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
// ❌ Bỏ nodemailer: Render free chặn SMTP -> gây treo
// import nodemailer from 'nodemailer';
import multer from 'multer';
import cloudinary from 'cloudinary';

// ✅ Thêm SendGrid HTTP API (không bị chặn trên Render)
import sgMail from '@sendgrid/mail';

// ====== Cloudinary config ======
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ====== SendGrid config (HTTP API) ======
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// ====== Controller handlers ======
const createNew = async (req, res, next) => {
  try {
    // điều hướng đến tầng service
    const createdUser = await AuthService.createNew(req.body);

    // Tạo profile tự động sau khi tạo user thành công (cách 2 - tạo ở backend)
    const profileData = {
      username: req.body.username,
      owner: createdUser._id.toString(),
    };
    await myProfileService.createmyProfile(profileData);

    // Tạo access token
    const access_token = GenerateAccessToken(createdUser);

    // có kết quả thì trả về Client
    res.status(StatusCodes.CREATED).json({ access_token });
  } catch (error) {
    next(error);
  }
};

const GenerateAccessToken = (User) => {
  return jwt.sign(
    {
      id: User._id,
      admin: User.admin,
    },
    env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: '1d' }
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
      res.status(StatusCodes.OK).json({ access_token });
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

const Logout = async (_req, res) => {
  res.status(StatusCodes.OK).json({ message: 'Logout success' });
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.params.userId; // Lấy từ URL params

    if (!userId || !ObjectId.isValid(userId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid userId');
    }

    const objectId = new ObjectId(userId);

    const result = await AuthService.changePassword(
      objectId,
      oldPassword,
      newPassword,
      confirmNewPassword
    );

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

// ====== FORGOT PASSWORD (SendGrid HTTP API) ======
const forgotPassword = async (req, res) => {
  try {
    const { Email: email } = req.body;
    console.log('A) start forgotPassword', {
      email,
      hasKey: !!process.env.SENDGRID_API_KEY,
      from: process.env.EMAIL_FROM,
      fe: process.env.FRONTEND_URL
    });

    if (!email) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email is required' });
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ message: 'SENDGRID_API_KEY is missing on server' });
    }
    if (!process.env.EMAIL_FROM) {
      return res.status(500).json({ message: 'EMAIL_FROM is missing on server' });
    }
    if (!process.env.FRONTEND_URL) {
      return res.status(500).json({ message: 'FRONTEND_URL is missing on server' });
    }

    const resetToken = await AuthService.generateResetPasswordToken(email);
    console.log('B) token generated', !!resetToken);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}?email=${encodeURIComponent(email)}`;

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM, // PHẢI là sender đã verify trong SendGrid (Single Sender hoặc Domain Auth)
      subject: 'Password Reset Request',
      html: `
        <h2>Lyhan</h2>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
        <p>Nhấn nút bên dưới (hoặc copy đường link):</p>
        <p><a href="${resetLink}" style="background:#2563eb;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Đặt lại mật khẩu</a></p>
        <p style="word-break:break-all">${resetLink}</p>
        <p>Nếu không phải bạn, hãy bỏ qua email này.</p>
      `
    };

    console.log('C) sending mail via HTTP API...');
    await sgMail.send(msg);
    console.log('D) mail sent');

    return res
      .status(StatusCodes.OK)
      .json({ message: '✅ Email đã được gửi. Nếu không thấy trong hộp thư chính, hãy kiểm tra thư mục Spam/Junk.' });
  } catch (err) {
    // Log chi tiết để đọc trong Render Logs
    console.error('forgotPassword ERROR:', {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      response: err?.response?.body
    });
    // Luôn trả JSON để FE không pending
    return res
      .status(err?.status || 500)
      .json({ message: err?.response?.body || err?.message || 'Internal Server Error' });
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

    const objectId = new ObjectId(userId);

    const result = await AuthService.changeUsername(objectId, username);

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

// ====== Upload avatar (Cloudinary) ======
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const handleAvatarUpload = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
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

    const uploadFromBuffer = (buffer, userId) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            folder: 'avatars',
            public_id: `avatar_${userId}`,
            overwrite: true
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

    res.status(StatusCodes.OK).json('Delete shared post successfully');
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req, res, next) => {
  try {
    const user = req.user; // Được gán bởi passport.authenticate()

    const access_token = jwt.sign(
      {
        id: user._id,
        admin: user.admin
      },
      env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: '1d' }
    );

    // 👉 Cách 1: Redirect về frontend kèm token (phổ biến)
    res.redirect(`${env.FRONTEND_URL}/auth-success?token=${access_token}`);

    // 👉 Cách 2: Trả JSON cho SPA (nếu không redirect)
    // res.status(StatusCodes.OK).json({ access_token });
  } catch (error) {
    next(error);
  }
};


export const AuthController = {
  createNew,
  getDetails,
  LoginUser,
  Logout,
  changePassword,
  forgotPassword, // <-- đã dùng SendGrid HTTP API
  resetPassword,
  changeUsername,
  updateAvatar,
  handleAvatarUpload,
  getAvatar,
  deleteSharedPost,
  googleCallback
};
