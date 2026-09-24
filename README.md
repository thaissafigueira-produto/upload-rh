# Guapeco RH — Hub de Gestão da Base

Protótipo navegável para teste interno da diretoria da Guapeco. Permite ao RH de uma empresa
cliente consultar a base de colaboradores, enviar uma nova versão da planilha, revisar o que
mudou, resolver colaboradores não encontrados, alterar CNPJs e conferir os CNPJs do mês.

Este produto **não** é o dashboard de indicadores/adesão/reembolso/engajamento da Guapeco —
esse é outro MVP. Aqui é gestão de dados: base, comparações, conferências e histórico.

## Stack

- React + Vite + TypeScript (hospedagem prevista: Vercel)
- Tailwind CSS v4 + shadcn/ui (Radix), fonte League Spartan
- React Router
- SheetJS (`xlsx`) para ler planilhas .xlsx/.csv no navegador

**Sem backend.** Os dados vivem em `localStorage` e são carregados automaticamente, com dados
fictícios da Venturus, no primeiro acesso. O login é simulado.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Na tela de entrada, e-mail e senha já vêm preenchidos:

- Usuária de demonstração: **Maria Souza** (Analista de RH, Venturus)
- E-mail: `maria.souza@venturus.com.br` · senha: `demonstracao` (login simulado, qualquer clique em "Entrar" funciona)

Entre os testes, use **menu do usuário → Restaurar dados de demonstração** para voltar tudo ao
estado inicial. Em **Atualizar base** há botões para baixar o modelo, baixar um arquivo de
exemplo (com erros de validação) e usar exemplos prontos.

```bash
npm run build   # build de produção
npm run lint    # oxlint
npm run preview # servir o build de produção localmente
```

## Estrutura

- `src/services/` — **camada de dados**. Todo acesso a dados passa por aqui
  (`employeesService`, `uploadsService`, `versionsService`, `cnpjService`, `auditService`,
  `authService`, `dashboardService`). As telas nunca tocam o `localStorage`; só
  `services/database.ts` o faz. Todo dado carrega `empresaId` e os services sempre filtram
  pela empresa do usuário logado, então a camada pode ser trocada por um backend real
  (ex.: Supabase) sem refazer as telas. Ver `docs/adr/0005-camada-de-services.md`.
- `src/lib/` — regras puras: leitura de planilha, validação, comparação entre versões, CSV, formatação
- `src/data/seed.ts` — dados de demonstração (Venturus, 160+ colaboradores, 3 CNPJs ativos + 1 inativo, 5 versões, conferências)
- `src/pages/` — Visão geral, Colaboradores, Atualizar base, CNPJs (+ conferência), Histórico (+ detalhe), Login
- `src/components/` — layout, componentes comuns (stepper, dica, badges) e primitivos shadcn (`components/ui`)

## Documentação de produto e design

- `PRODUCT.md` — contexto de produto, usuários, posicionamento e princípios
- `DESIGN.md` — identidade visual e convenções de UI
- `CONTEXT.md` — glossário dos termos do domínio
- `docs/adr/` — decisões tomadas, o porquê e o que não fazer sem revisitá-las
