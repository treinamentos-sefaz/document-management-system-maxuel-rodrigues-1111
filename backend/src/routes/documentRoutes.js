const crypto = require('crypto');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const config = require('../config');
const documentController = require('../controllers/documentController');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdir(config.storageDir, { recursive: true }, (error) => cb(error, config.storageDir));
    },
    filename: (req, file, cb) => cb(null, crypto.randomUUID()),
  }),
  limits: { fileSize: config.maxUploadSizeBytes },
});

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;
