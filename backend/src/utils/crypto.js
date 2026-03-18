const crypto = require('crypto');
const env = require('../config/env');

const ALGORITHM = 'aes-256-cbc';
// ENCRYPTION_KEY must be 64 hex chars (= 32 bytes)
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');

const encrypt = (plainText) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (cipherText) => {
  const [ivHex, encryptedHex] = cipherText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

module.exports = { encrypt, decrypt };
