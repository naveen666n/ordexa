const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = (file) => {
  // file.filename is already set by Multer (UUID-based)
  const relativePath = `/uploads/${file.filename}`;
  return relativePath;
};

const deleteFile = (filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

module.exports = { upload, deleteFile };
