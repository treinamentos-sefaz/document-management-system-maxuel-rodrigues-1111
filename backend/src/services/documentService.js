const crypto = require('crypto');
const documentRepository = require('../repositories/documentRepository');
const { AppError } = require('./appError');

function toPublicMetadata({ id, originalName, size, uploadedAt, owner }) {
  return { id, originalName, size, uploadedAt, owner };
}

function registerUpload({ originalName, size, storedPath, owner }) {
  const document = documentRepository.save({
    id: crypto.randomUUID(),
    originalName,
    size,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath: storedPath,
  });
  return toPublicMetadata(document);
}

function listDocuments(owner) {
  return documentRepository
    .findAll()
    .filter((document) => document.owner === owner)
    .map(toPublicMetadata);
}

function getDownloadableFile(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw new AppError(404, 'Documento não encontrado.');
  }
  return { fileName: document.originalName, filePath: document.storagePath };
}

module.exports = { registerUpload, listDocuments, getDownloadableFile };
