import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';

export default function App() {
  const [owner, setOwner] = useState('usuario-1');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const ownerId = owner.trim();

  const loadDocuments = useCallback(async () => {
    if (!ownerId) {
      setDocuments([]);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      setDocuments(await listDocuments(ownerId));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <label>
        Usuário (X-User-Id):{' '}
        <input value={owner} onChange={(event) => setOwner(event.target.value)} />
      </label>

      <section>
        <h2>Enviar documento</h2>
        <UploadComponent owner={ownerId} onUploaded={loadDocuments} />
      </section>

      <section>
        <h2>Documentos</h2>
        <DocumentList
          documents={documents}
          owner={ownerId}
          isLoading={isLoading}
          error={error}
        />
      </section>
    </main>
  );
}
