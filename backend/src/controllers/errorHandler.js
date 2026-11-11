const multer = require('multer');
const { AppError } = require('../services/appError');

function errorHandler(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE';
    const status = isTooLarge ? 413 : 400;
    const message = isTooLarge
      ? 'Arquivo excede o tamanho máximo permitido.'
      : 'Requisição de upload inválida.';
    return res.status(status).json({ error: message });
  }
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = { errorHandler };
