# Especificação - Document Management System

> Especificação derivada de [spec-template.md](spec-template.md). Premissas
> marcadas como **(premissa)** foram adotadas com os valores recomendados e
> podem ser revisadas.

## 1. Objetivo

Entregar um sistema web que permite a um usuário enviar, listar e baixar seus documentos, com armazenamento local à aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos do próprio usuário
- Download de documentos pelo identificador
- Gestão simples por usuário (identificação por cabeçalho `X-User-Id`, **(premissa)**)
- Limite de tamanho de upload configurável por variável de ambiente, com padrão de 10 MB **(premissa)**

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Persistência de metadados em banco de dados (nesta fase, apenas em memória)
- Autenticação e autorização completas (login, senhas, tokens)
- Filtro de tipos de arquivo (nesta fase)
- Exclusão, edição e compartilhamento de documentos

## 3. Requisitos funcionais

| ID    | Requisito | Critérios de aceite |
| ----- | --------- | ------------------- |
| RF-01 | O usuário pode enviar um documento | Aceita `multipart/form-data` com campo de arquivo; retorna 201 com os metadados; retorna 400 se o arquivo estiver ausente; retorna 413 se exceder o limite; retorna 400 se `X-User-Id` estiver ausente |
| RF-02 | O usuário pode listar os documentos enviados | Retorna 200 com array apenas com documentos cujo `owner` corresponde ao `X-User-Id`; retorna lista vazia se não houver documentos |
| RF-03 | O usuário pode baixar um documento pelo identificador | Retorna 200 com o conteúdo binário e cabeçalho `Content-Disposition` com o `originalName`; retorna 404 se o id não existir ou pertencer a outro usuário |

## 4. Requisitos não funcionais

| ID     | Requisito |
| ------ | --------- |
| RNF-01 | Arquivos gravados no filesystem local em `backend/storage` via `multer` com `diskStorage` |
| RNF-02 | Metadados mantidos em memória nesta fase |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor): `PORT`, `STORAGE_DIR` e `MAX_UPLOAD_SIZE_BYTES` |
| RNF-04 | Erros tratados nos limites do sistema (entrada HTTP e leitura/escrita de arquivos), com resposta JSON padronizada |
| RNF-05 | Nomes de arquivo gravados no disco são gerados pela aplicação (ex.: UUID), não pelo nome original enviado |

## 5. Modelo de dados (metadados do documento)

| Campo        | Tipo   | Descrição |
| ------------ | ------ | --------- |
| id           | string | Identificador único do documento (UUID) |
| originalName | string | Nome original do arquivo enviado |
| size         | number | Tamanho em bytes |
| uploadedAt   | string | Data/hora do upload (ISO 8601) |
| owner        | string | Valor do cabeçalho `X-User-Id` no momento do upload |

Observações:

- O caminho físico do arquivo fica no repositório e não é exposto na API.
- Conteúdo binário não faz parte dos metadados.

## 6. Contratos de API

Todas as respostas de erro seguem o formato:

```json
{ "error": "mensagem em português" }
```

### GET /health

- Saída (200): `{ "status": "ok" }`

### POST /upload

- Cabeçalhos: `X-User-Id` (obrigatório)
- Entrada: `multipart/form-data`, campo `file`
- Saída (201): metadados do documento criado
- Erros: 400 (arquivo ausente ou `X-User-Id` ausente), 413 (arquivo acima do limite)

```json
{
  "id": "3f2a9c1e-0b7d-4e8a-9d2b-6c1f5a7e4b10",
  "originalName": "contrato.pdf",
  "size": 20480,
  "uploadedAt": "2026-11-11T12:00:00.000Z",
  "owner": "user-123"
}
```

### GET /documents

- Cabeçalhos: `X-User-Id` (obrigatório)
- Saída (200): array de metadados do próprio usuário
- Erros: 400 (`X-User-Id` ausente)

### GET /documents/:id/download

- Cabeçalhos: `X-User-Id` (obrigatório)
- Saída (200): conteúdo binário com `Content-Type: application/octet-stream` e `Content-Disposition: attachment; filename="<originalName>"`
- Erros: 400 (`X-User-Id` ausente), 404 (documento inexistente ou de outro usuário)

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples, com fluxo de dependência `routes -> controllers -> services -> repositories`
  - `routes/`: definição dos endpoints
  - `controllers/`: entrada e saída HTTP, validação básica
  - `services/`: regras de negócio (ownership, limites)
  - `repositories/`: persistência (arquivos locais via multer e metadados em memória)
- Camadas internas não dependem de Express nem de multer.
- Backend em Node.js + Express 5 em CommonJS, com `multer` 2.x.
- Testes do backend com o runner nativo `node:test`.
- Frontend em React + Vite (ESM), com componentes funcionais e Hooks.
- Organização do frontend em `components/`, `pages/` e `services/`.
- Comunicação com o backend via `fetch` com prefixo `/api`, configurado como proxy no Vite.
- JavaScript puro, sem TypeScript nesta fase.
- Armazenamento estritamente local; nenhum provedor externo.

## 8. Plano de execução

Etapas na ordem de implementação. Cada etapa deve deixar a aplicação funcional.

1. **Configuração e armazenamento** (independente)
   - Criar leitura de variáveis de ambiente (`PORT`, `STORAGE_DIR`, `MAX_UPLOAD_SIZE_BYTES`) com padrões.
   - Garantir a existência de `backend/storage`.
2. **Repositório** (depende de 1)
   - Repositório de metadados em memória (criar, listar por dono, buscar por id).
   - Repositório de arquivos com `multer` `diskStorage`.
3. **Services** (depende de 2)
   - Regras de upload, listagem filtrada por dono e download com verificação de ownership.
4. **Controllers e rotas** (depende de 3)
   - Rotas `POST /upload`, `GET /documents` e `GET /documents/:id/download`.
   - Middleware de tratamento de erros com formato JSON padrão (400, 404, 413).
5. **Testes do backend** (depende de 4)
   - Testes com `node:test` em `backend/test` cobrindo os três endpoints e os cenários de erro.
6. **Frontend** (depende do contrato da seção 6; pode iniciar em paralelo à etapa 4)
   - Serviço de API em `services/` com `fetch` para `/api`.
   - Componentes de upload e de listagem, com botão de download.
   - Página principal em `pages/`, com tratamento de erros exibido ao usuário.
7. **Validação ponta a ponta** (depende de 5 e 6)
   - Executar o fluxo completo: upload, listagem e download.
   - Revisar esta especificação contra a implementação.

## 9. Critérios de conclusão

- Todos os requisitos funcionais da seção 3 atendidos.
- Contratos da seção 6 respeitados pelo backend.
- Testes do backend passando com `npm test`.
- Nenhum armazenamento externo utilizado.
