import { useCallback, useEffect, useRef, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';

export default function App() {
  const [owner, setOwner] = useState('usuario-1');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const ownerId = owner.trim();
  const latestRequestRef = useRef(0);

  const loadDocuments = useCallback(async () => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    const isLatest = () => requestId === latestRequestRef.current;

    if (!ownerId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await listDocuments(ownerId);
      if (isLatest()) setDocuments(result);
    } catch (loadError) {
      if (isLatest()) setError(loadError.message);
    } finally {
      if (isLatest()) setIsLoading(false);
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
