import { useState } from 'react';
import { downloadDocument } from '../services/documentApi';

function saveBlobAsFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DownloadButton({ documentId, fileName, owner }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setIsDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(documentId, owner);
      saveBlobAsFile(blob, fileName);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <span>
      <button type="button" onClick={handleClick} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span role="alert"> {error}</span>}
    </span>
  );
}
