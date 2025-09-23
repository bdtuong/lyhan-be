import multer from 'multer';

// Dùng diskStorage để Cloudinary nhận file từ path
const storage = multer.diskStorage({});

export const upload = multer({ storage });
