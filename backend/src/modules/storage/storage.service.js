'use strict';

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Multer always writes to local disk first (temp step before provider upload).
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

const uploadMiddleware = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }).single('image');
const uploadMultipleMiddleware = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }).array('images', 10);

// ─── Provider resolution ──────────────────────────────────────────────────────
// Reads 'storage.provider' from site_config (defaults to 'local').
// Lazy-loads the appropriate storage backend.
let _cachedProvider = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 60_000; // re-read config at most once per minute

const getProvider = async () => {
  const now = Date.now();
  if (_cachedProvider && now - _cacheTs < CACHE_TTL_MS) return _cachedProvider;

  try {
    // Read directly from DB to avoid config service's secret masking
    const SiteConfig = require('../../models/SiteConfig');
    const row = await SiteConfig.findOne({ where: { group: 'storage', key: 'provider' } });
    const providerName = row?.value || 'local';

    if (providerName === 's3') {
      _cachedProvider = require('./s3.storage');
    } else {
      _cachedProvider = require('./local.storage');
    }
  } catch {
    _cachedProvider = require('./local.storage');
  }

  _cacheTs = Date.now();
  return _cachedProvider;
};

// Call this when the admin changes storage config so the next upload picks it up.
const clearProviderCache = () => { _cachedProvider = null; _cacheTs = 0; };

const uploadFile = async (file) => {
  const provider = await getProvider();
  return provider.upload(file);
};

const deleteFile = async (urlPath) => {
  const provider = await getProvider();
  return provider.deleteFile(urlPath);
};

module.exports = { uploadMiddleware, uploadMultipleMiddleware, uploadFile, deleteFile, clearProviderCache };
