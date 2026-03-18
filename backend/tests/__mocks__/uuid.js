// CJS shim for uuid v13 (which is pure ESM) — used only in Jest test environment
const { randomUUID } = require('crypto');
module.exports = {
  v4: () => randomUUID(),
  v1: () => randomUUID(),
};
