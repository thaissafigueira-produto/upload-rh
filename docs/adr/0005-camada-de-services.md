# Camada de services isolando o acesso a dados

A V2 continua sem backend (protótipo para teste interno da diretoria), mas todo acesso a dados
passa por `src/services/`. Só `services/database.ts` lê e escreve no `localStorage`; as telas
consomem os services e reagem a mudanças via `useDatabase()`.

Todo registro carrega `empresaId` e os services filtram sempre pela empresa do usuário logado.
Assim, trocar essa camada por um backend real (Supabase com login e isolamento por empresa no
banco) não exige refazer as telas.

A origem de uma versão da base é um campo (`origem`: `upload_manual` hoje; `integracao_erp` ou
`sftp` no futuro), para que "upload de arquivo" seja só uma das formas de criar uma versão.

**Não fazer** sem revisitar esta decisão: acessar `localStorage` direto de páginas ou
componentes, ou consultar dados sem filtrar por `empresaId`.

Substitui a parte de "estado em contexto React" descrita em `0001-frontend-only-v1.md`.
