import { StatusCodes } from 'http-status-codes';
import { AuthModel } from '../models/AuthModel.js';
import ApiError from '../utils/ApiError.js';
import { slugify } from '../utils/formatters.js';
import bcrypt from 'bcrypt';
import dns from 'dns';
import crypto from 'crypto-browserify';
import { GET_DB } from '../config/mongodb.js';
import { ObjectId } from 'mongodb';

const validateEmailDomain = email => {
  const [emailname, domain] = email.split('@');
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err) {
        resolve(false); // Tên miền không tồn tại
      } else {
        resolve(true); // Tên miền tồn tại
      }
    });
  });
};

const createNew = async reqBody => {
  try {
    if (!reqBody || !reqBody.username) {
      throw new Error('Username is required');
    }
    const existingUser = await AuthModel.findOne({ email: reqBody.email });
    if (existingUser) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Email already exists in the database',
      );
    }

    // Kiểm tra tên miền email
    const isDomainValid = await validateEmailDomain(reqBody.email); // Kiểm tra tên miền email
    if (!isDomainValid) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid email domain');
    }

    // xử lý logic dữ liệu tùy đặc thù dự án
    const newUser = {
      ...reqBody,
      slug: slugify(reqBody.username),
    };
    // Gọi tầng Models để xử lý  lưu bản ghi newUser vào database
    const createdUser = await AuthModel.createNew(newUser);
    // lấy bản ghi User sau khi gọi
    const getNewUser = await AuthModel.findOneById(createdUser.insertedId);
    // trả kết quả trong service
    return getNewUser;
  } catch (error) {
    throw error;
  }
};

const getDetails = async Userid => {
  try {
    const User = await AuthModel.getDetails(Userid);
    if (!User) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const userData = User._doc || User; // Handle cases where _doc might be missing
    const {
      password,
      slug,
      admin,
      createdAt,
      updatedAt,
      _destroy,
      ...UsertoUI
    } = userData;

    return UsertoUI;
  } catch (error) {
    throw error;
  }
};

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

    return {
      message:
        'Password updated successfully! Please log in again after 3 seconds.',
    };
  } catch (error) {
    throw error;
  }
};

const generateResetPasswordToken = async email => {
  try {
    const user = await AuthModel.findOne({ email });
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    // Cập nhật document trong MongoDB
    await GET_DB()
      .collection(AuthModel.USER_COLLECTION_NAME)
      .updateOne(
        { email: email },
        {
          $set: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: Date.now() + 3600000,
          },
        },
      );

    return resetToken;
  } catch (error) {
    throw error;
  }
};

const resetPassword = async (token, email, password, confirmPassword) => {
  try {
    const user = await AuthModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
    }

    // Kiểm tra mật khẩu và xác nhận mật khẩu
    if (password !== confirmPassword) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Passwords do not match');
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    await AuthModel.resetPassword(email, hashedPassword);
  } catch (error) {
    throw error;
  }
};

const changeUsername = async (userId, username) => {
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

    // 3. Cập nhật username trong database (gọi AuthModel)
    await AuthModel.changeUsername(userId, username);

    return { message: 'Username updated successfully!' };
  } catch (error) {
    throw error;
  }
};

export const AuthService = {
  createNew,
  getDetails,
  changePassword,
  validateEmailDomain,
  generateResetPasswordToken,
  resetPassword,
  changeUsername,
};
