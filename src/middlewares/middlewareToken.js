// src/middlewares/middlewareToken.js
import jwt from 'jsonwebtoken'
import { StatusCodes } from 'http-status-codes'
import { AuthModel } from '~/models/AuthModel.js'
import { env } from '~/config/environment.js' // chỉnh import theo project bạn

// Ưu tiên lấy token từ Authorization: Bearer <token>, fallback sang cookie "jwt"
const getTokenFromReq = (req) => {
  const header = req.headers.authorization || req.headers.Authorization
  if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7)
  }
  return req.cookies?.jwt
}

const middlewareToken = {
  verifyToken: async (req, res, next) => {
  try {
    const token = getTokenFromReq(req)
    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'Access token is required to access this resource.' })
    }

    // 👉 Dùng sync thay vì callback async
    const decoded = jwt.verify(token, env.JWT_ACCESS_TOKEN_SECRET)

    // ✅ Debug kỹ
    console.log("🧩 decoded:", decoded)

    const userId = decoded.userId || decoded.id || decoded._id
    const user = userId ? await AuthModel.findOneById(userId) : null

    console.log("👤 user:", user)

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'User does not exist or is inactive.' })
    }

    req.user = { ...user, _id: user._id?.toString?.() ?? user._id }
    next()
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'Invalid or expired token.' })
  }
},


  // Cho phép: chủ sở hữu (params.id) hoặc admin
  verifyTokenAndAdminAuth: (req, res, next) => {
    middlewareToken.verifyToken(req, res, () => {
      const isOwner = String(req.user._id) === String(req.params.id)
      const isAdmin = !!req.user.admin
      if (isOwner || isAdmin) return next()
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'You are not allowed to access this resource' })
    })
  },

  // Chỉ admin
  verifyTokenAndAdmin: (req, res, next) => {
    middlewareToken.verifyToken(req, res, () => {
      if (req.user?.admin) return next()
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'Admin only' })
    })
  }
}

export { middlewareToken }
