const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const config = require('../config');

fs.mkdirSync(config.storageDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: config.storageDir,
    filename: (req, file, cb) => cb(null, crypto.randomUUID()),
  }),
  limits: { fileSize: config.maxUploadSizeBytes },
});

module.exports = { singleFileUpload: upload.single('file') };
