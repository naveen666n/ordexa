const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const localStore = require('./local.storage');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Multer storage — rename file to UUID to prevent path traversal
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and MP4 files are allowed'), false);
  }
};

// Multer middleware for image uploads
const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

// Upload a processed file and return its URL path
const uploadFile = (file) => localStore.upload(file);

// Delete a file by URL path
const deleteFile = (urlPath) => localStore.deleteFile(urlPath);

module.exports = { uploadMiddleware, uploadFile, deleteFile };
