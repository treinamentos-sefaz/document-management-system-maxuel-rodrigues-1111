const documentService = require('../services/documentService');
const { AppError } = require('../services/appError');

function getOwner(req) {
  const owner = (req.get('X-User-Id') || '').trim();
  if (!owner) {
    throw new AppError(400, 'Cabeçalho X-User-Id é obrigatório.');
  }
  return owner;
}

function upload(req, res, next) {
  try {
    const owner = getOwner(req);
    if (!req.file) {
      throw new AppError(400, 'Arquivo não enviado. Use o campo "file".');
    }
    const metadata = documentService.registerUpload({ file: req.file, owner });
    res.status(201).json(metadata);
  } catch (error) {
    next(error);
  }
}

function list(req, res, next) {
  try {
    const owner = getOwner(req);
    res.status(200).json(documentService.listDocuments(owner));
  } catch (error) {
    next(error);
  }
}

function download(req, res, next) {
  try {
    const owner = getOwner(req);
    const document = documentService.getDownloadableDocument(req.params.id, owner);
    res.attachment(document.originalName);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(document.storagePath, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, list, download };
