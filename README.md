# Guapeco RH — Hub de Gestão da Base

Aplicação web para times de RH consultarem e atualizarem a base de colaboradores elegíveis
aos benefícios da Guapeco: enviar uma nova versão da planilha, revisar exatamente o que
mudou em relação à versão anterior, resolver pendências de desligamento e administrar CNPJs.

Este produto **não** é o dashboard de indicadores/adesão/reembolso/engajamento da Guapeco —
esse é outro MVP. Este é um hub de gestão de dados: base, diffs e histórico.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix)
- React Router
- SheetJS (`xlsx`) para leitura de planilhas .xlsx/.csv no navegador

**V1 é frontend-only**: os dados (colaboradores, versões, auditoria) vivem em `localStorage`,
semeados por um gerador de dados fictícios da empresa de demonstração "Venturus". Não há
backend, autenticação real ou isolamento multi-tenant persistido nesta versão — ver
`PRODUCT.md` para o racional e o que fica para uma próxima fase.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` e entre com o usuário de demonstração (Maria Andrade,
Analista de RH da Venturus) na tela de login.

Outros comandos:

```bash
npm run build   # build de produção
npm run lint    # oxlint
npm run preview # servir o build de produção localmente
```

## Estrutura

- `src/pages` — as 4 telas do produto (Visão geral, Colaboradores, Atualizar base, Histórico) + Login
- `src/components` — layout (sidebar/topbar), componentes de upload/diff, painéis de detalhe e primitivos de UI (`components/ui`, shadcn)
- `src/lib` — regras de negócio: parsing de planilha, validação, cálculo de diff entre versões, store (contexto + localStorage)
- `src/data/mock-generator.ts` — gera a empresa Venturus, ~130 colaboradores e 5 versões históricas com diffs reais entre si

## Documentação de produto e design

Antes de mexer no projeto, vale ler nessa ordem — é o que permite qualquer pessoa (ou
agente) continuar de onde a última parou sem precisar perguntar tudo de novo:

- `PRODUCT.md` — contexto de produto, usuários, posicionamento e princípios
- `DESIGN.md` — sistema visual, tokens e convenções de UI adotados
- `CONTEXT.md` — glossário dos termos do domínio (Base, Versão, Pendência, Desligamento, etc.)
- `docs/adr/` — decisões que foram tomadas, o porquê, e o que **não** fazer sem revisitar a decisão
