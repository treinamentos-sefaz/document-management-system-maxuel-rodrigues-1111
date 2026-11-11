const documentService = require('../services/documentService');
const { AppError } = require('../services/appError');

function requireOwner(req, res, next) {
  const owner = (req.get('X-User-Id') || '').trim();
  if (!owner) {
    return next(new AppError(400, 'Cabeçalho X-User-Id é obrigatório.'));
  }
  req.owner = owner;
  return next();
}

function upload(req, res) {
  if (!req.file) {
    throw new AppError(400, 'Arquivo não enviado. Use o campo "file".');
  }
  const metadata = documentService.registerUpload({
    originalName: req.file.originalname,
    size: req.file.size,
    storedPath: req.file.path,
    owner: req.owner,
  });
  res.status(201).json(metadata);
}

function list(req, res) {
  res.status(200).json(documentService.listDocuments(req.owner));
}

function download(req, res, next) {
  const { fileName, filePath } = documentService.getDownloadableFile(req.params.id, req.owner);
  res.attachment(fileName);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.sendFile(filePath, (error) => {
    if (error && !res.headersSent) {
      next(error);
    }
  });
}

module.exports = { requireOwner, upload, list, download };
