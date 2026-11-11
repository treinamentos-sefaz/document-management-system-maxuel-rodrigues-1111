const API_PREFIX = '/api';

async function request(path, { owner, ...options } = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers: { 'X-User-Id': owner, ...options.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Falha na comunicação com o servidor.');
  }

  return response;
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', { method: 'POST', body: formData, owner });
  return response.json();
}

export async function listDocuments(owner) {
  const response = await request('/documents', { owner });
  return response.json();
}

export async function downloadDocument(id, owner) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, { owner });
  return response.blob();
}
