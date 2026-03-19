'use strict';

const fs = require('fs');

// AWS SDK v3 — install with: npm install @aws-sdk/client-s3
let S3Client, PutObjectCommand, DeleteObjectCommand;
try {
  ({ S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3'));
} catch {
  // Package not installed — all calls will throw a clear error
}

// Read storage config directly from DB to get actual secret values (config service masks them).
const getS3Config = async () => {
  const SiteConfig = require('../../models/SiteConfig');
  const rows = await SiteConfig.findAll({ where: { group: 'storage' } });
  const cfg = {};
  for (const row of rows) cfg[row.key] = row.value; // raw string values
  if (!cfg.s3_bucket) throw new Error('S3 storage is not configured. Please set s3_bucket, s3_region, and credentials in Storage Settings.');
  return cfg;
};

const getClient = (cfg) => {
  if (!S3Client) throw new Error('@aws-sdk/client-s3 is not installed. Run: npm install @aws-sdk/client-s3');
  const options = {
    region: cfg.s3_region || 'us-east-1',
    credentials: {
      accessKeyId: cfg.s3_access_key_id || '',
      secretAccessKey: cfg.s3_secret_access_key || '',
    },
  };
  if (cfg.s3_endpoint) options.endpoint = cfg.s3_endpoint;
  if (cfg.s3_endpoint) options.forcePathStyle = true; // needed for MinIO / R2
  return new S3Client(options);
};

const upload = async (file) => {
  const cfg = await getS3Config();
  const client = getClient(cfg);

  const key = `uploads/${file.filename}`;
  const fileStream = fs.createReadStream(file.path);

  await client.send(new PutObjectCommand({
    Bucket: cfg.s3_bucket,
    Key: key,
    Body: fileStream,
    ContentType: file.mimetype,
  }));

  // Remove the local temp file written by multer
  try { fs.unlinkSync(file.path); } catch { /* ignore */ }

  // Return public URL
  if (cfg.s3_cdn_url) return `${cfg.s3_cdn_url.replace(/\/$/, '')}/${key}`;
  if (cfg.s3_endpoint) return `${cfg.s3_endpoint.replace(/\/$/, '')}/${cfg.s3_bucket}/${key}`;
  return `https://${cfg.s3_bucket}.s3.${cfg.s3_region || 'us-east-1'}.amazonaws.com/${key}`;
};

const deleteFile = async (urlOrKey) => {
  const cfg = await getS3Config();
  const client = getClient(cfg);

  // Extract the S3 key from full URL if needed
  let key = urlOrKey;
  if (urlOrKey.startsWith('http')) {
    const url = new URL(urlOrKey);
    key = url.pathname.replace(/^\//, '');
    // For path-style URLs (MinIO), strip the bucket prefix
    if (key.startsWith(`${cfg.s3_bucket}/`)) key = key.slice(cfg.s3_bucket.length + 1);
  }

  try {
    await client.send(new DeleteObjectCommand({ Bucket: cfg.s3_bucket, Key: key }));
  } catch (err) {
    console.error('[s3.storage] deleteFile error:', err.message);
  }
};

module.exports = { upload, deleteFile };
