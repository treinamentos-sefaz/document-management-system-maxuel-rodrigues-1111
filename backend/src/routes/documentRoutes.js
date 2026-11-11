const express = require('express');
const documentController = require('../controllers/documentController');
const { singleFileUpload } = require('../repositories/fileStorage');

const router = express.Router();

router.post(
  '/upload',
  documentController.requireOwner,
  singleFileUpload,
  documentController.upload,
);
router.get('/documents', documentController.requireOwner, documentController.list);
router.get(
  '/documents/:id/download',
  documentController.requireOwner,
  documentController.download,
);

module.exports = router;
