import multer from 'multer'

// ✅ Dùng diskStorage để Cloudinary nhận path
const storage = multer.diskStorage({})

// ✅ Cho phép upload ảnh & video (<= 8MB)
export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime' // mov
    ]
    if (allowedTypes.includes(file.mimetype)) cb(null, true)
    else cb(new Error('❌ Unsupported file type: ' + file.mimetype))
  }
})
