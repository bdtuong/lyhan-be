import { WHITELIST_DOMAINS } from '~/utils/constant.js';
import { env } from '~/config/environment.js';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';

export const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS Origin:', origin);

    // ✅ Cho phép origin undefined (UptimeRobot, curl, Postman...)
    if (!origin) {
      return callback(null, true);
    }

    // ✅ Cho phép nếu nằm trong danh sách domain hợp lệ
    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true);
    }

    // ❌ Còn lại thì chặn
    return callback(
      new ApiError(
        StatusCodes.FORBIDDEN,
        `${origin} not allowed by our CORS Policy.`,
      ),
    );
  },

  optionsSuccessStatus: 200,
  credentials: true,
};

