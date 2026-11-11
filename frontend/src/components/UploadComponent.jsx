import { useState } from 'react';
import { uploadDocument } from '../services/documentApi';

export default function UploadComponent({ owner, onUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setError('');
    try {
      await uploadDocument(selectedFile, owner);
      setMessage(`Arquivo "${selectedFile.name}" enviado com sucesso.`);
      setSelectedFile(null);
      event.target.reset();
      onUploaded();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        name="file"
        onChange={(event) => setSelectedFile(event.target.files[0] || null)}
      />
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar'}
      </button>
      {message && <p>{message}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
