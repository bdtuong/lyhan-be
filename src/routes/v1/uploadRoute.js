// src/routes/uploadRoute.js
import express from "express"
import { upload } from '~/middlewares/uploadMiddleware.js';
import { v2 as cloudinary } from "cloudinary"

const router = express.Router()

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" })
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "editor"
    })

    return res.status(201).json({ url: result.secure_url })
  } catch (err) {
    next(err)
  }
})

// 🟢 export named
export const uploadRoute = router