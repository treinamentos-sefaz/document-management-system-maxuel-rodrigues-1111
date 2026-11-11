const crypto = require('crypto');
const documentRepository = require('../repositories/documentRepository');
const { AppError } = require('./appError');

function toPublicMetadata({ id, originalName, size, uploadedAt, owner }) {
  return { id, originalName, size, uploadedAt, owner };
}

function registerUpload({ file, owner }) {
  const document = documentRepository.save({
    id: crypto.randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath: file.path,
  });
  return toPublicMetadata(document);
}

function listDocuments(owner) {
  return documentRepository
    .findAll()
    .filter((document) => document.owner === owner)
    .map(toPublicMetadata);
}

function getDownloadableDocument(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw new AppError(404, 'Documento não encontrado.');
  }
  return document;
}

module.exports = { registerUpload, listDocuments, getDownloadableDocument };
