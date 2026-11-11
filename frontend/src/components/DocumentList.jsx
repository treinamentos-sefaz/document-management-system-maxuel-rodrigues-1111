import DownloadButton from './DownloadButton';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, owner, isLoading, error }) {
  if (isLoading) return <p>Carregando documentos...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (documents.length === 0) return <p>Nenhum documento enviado.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tamanho</th>
          <th>Enviado em</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((item) => (
          <tr key={item.id}>
            <td>{item.originalName}</td>
            <td>{formatSize(item.size)}</td>
            <td>{new Date(item.uploadedAt).toLocaleString('pt-BR')}</td>
            <td>
              <DownloadButton
                documentId={item.id}
                fileName={item.originalName}
                owner={owner}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
