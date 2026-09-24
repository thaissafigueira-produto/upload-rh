# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript + Tailwind CSS + shadcn/ui. Frontend-only for V1: state lives in memory/localStorage over realistic mock data (no real backend, auth, or database yet). Confirmed directly with the user, who chose this over a full-stack build with Supabase (Postgres + Auth + Storage) to validate the UX/workflow before investing in real infrastructure.

## Users

HR (RH) professionals at companies that offer Guapeco benefits to their employees. The primary demo user is "Maria Souza," an HR person at a demo company ("Venturus"). She is not technical and needs to keep the eligible-employee population accurate: consulting the current base, uploading updated spreadsheets, resolving what changed, and tracking terminations/CNPJs — all in plain, non-technical Portuguese (pt-BR).

## Product Purpose

A "Hub de Gestão da Base" (employee-population management hub) for Guapeco's B2B clients. It exists to solve the operational problem of keeping the eligible-employee base accurate over time: query the base, submit a new version, detect what changed (new/removed/altered), review pending issues, manage CNPJs, and flag terminations. Success for V1 means an HR user can complete the full loop — ENTRAR → CONSULTAR BASE → ENVIAR NOVA BASE → VER O QUE MUDOU → RESOLVER PENDÊNCIAS — end to end, on realistic demo data, and it should read as a real first version of a B2B SaaS, not a concept screen.

The underlying hypothesis being validated: if HR has a secure, simple, transparent environment to administer the employee population, companies keep their base updated more easily, and Guapeco increases benefit coverage and adhesion.

## Positioning

Guapeco already has a separate MVP dashboard covering benefit indicators: adhesion, utilization, reimbursements, and engagement analytics. This product is explicitly **not** that dashboard and must not duplicate it. Its distinct mechanism is population **data management**: upload → diff against the prior version → review → confirm → audit trail → versioned history. No neighboring analytics product does base-versioning and change-detection for the employee roster; that is this product's reason to exist.

## Operating Context

HR periodically exports an employee roster (XLSX/CSV) from internal systems and uploads it here to replace the previous version. The tool validates the file, diffs it against the currently stored base, and requires HR to review and confirm before the new version becomes authoritative. Employees can have multiple associated CNPJs (legal entities) within one company. Today the process is fully manual upload; the architecture should anticipate — without building yet — automatic ingestion from ERPs (TOTVS, ADP, SAP SuccessFactors).

## Capabilities and Constraints

- Multi-tenant by company is a product requirement (one company must never see another's employees), but for V1 this is demonstrated with a single mock tenant ("Venturus") and mock data/local state — real enforced isolation is deferred to a future backend and explicitly not built now.
- Core entity: colaborador (employee) with fields Nome, E-mail corporativo, Matrícula, CNPJ, Departamento, Cargo, Status (Ativo/Desligado), Status do benefício (Com adesão/Sem adesão), datas de entrada/atualização. CPF is intentionally not used as a required field (LGPD minimization).
- Core workflows: consultar/buscar/filtrar colaboradores; baixar modelo de planilha; upload (drag-and-drop) de XLSX/CSV; validação com relatório de erros/duplicados/e-mails inválidos/campos obrigatórios; comparação com a versão anterior (novos/removidos/alterados) with a per-field before/after diff; confirmação que gera uma nova versão imutável da base; histórico de versões e ações; marcar colaborador como desligado (with confirmation dialog); editar CNPJ; visão simples da distribuição de colaboradores por CNPJ.
- Auditoria: uploads, confirmações, desligamentos e alterações de CNPJ must be recorded (user, date, time, action) as structured events, even though V1 has no dedicated audit screen.
- Explicitly out of scope for this product (belongs to the sibling analytics MVP or a future phase): utilization/reimbursement/adhesion charts, engagement features, campaigns, trilhas, advanced analytics, ERP integrations (TOTVS/ADP/SAP SuccessFactors), corporate SSO/Azure AD, billing approval, carência exceptions, termination pro-rata financial calculations, complex notifications.
- Security/LGPD messaging must never claim unimplemented technical guarantees (e.g. no "end-to-end encrypted" copy) since no real backend exists yet in V1.
- pt-BR only. Desktop-first, responsive down to tablet; mobile phone layout not a priority.

## Brand Commitments

Product is a Guapeco product ("Guapeco" wordmark in the top nav alongside company name and user menu). Demo tenant: **Venturus**. Demo HR user: **Maria Souza** (greeted as "Olá, Maria 👋" on the overview page). V2 adds CNPJ match/monthly conference and a services data layer — see README and `docs/adr/0005-camada-de-services.md`.

## Evidence on Hand

The user supplied an exhaustive functional/UX spec (screens, copy strings, fields, states) covering: Visão geral, Colaboradores (list + side panel), Atualizar base (upload + validation + comparison + confirmation), Histórico, versionamento, desligamentos, CNPJ, auditoria, and explicit LGPD/security copy constraints. Demo data must be realistic: at least 100 colaboradores for Venturus, spread across Tecnologia, RH, Financeiro, Comercial, Marketing, Operações; multiple CNPJs; a mix of ativos-com-adesão / ativos-sem-adesão / desligados; and at least 5 historical base versions with real new/removed/changed diffs between them. No other real content, logos, or brand assets were provided — visual identity beyond "Guapeco" wordmark is not fixed and is open for the design phase.

## Product Principles

1. **Hub de gestão, não dashboard.** Never add utilization/reimbursement/adhesion/engagement analytics — that space belongs to a sibling product and duplicating it is an explicit failure mode.
2. **Transparência total sobre mudanças.** Every base update must be inspectable: diffs before confirmation, permanent version history after, audit trail underneath.
3. **Segurança percebida, honestamente.** Convey trust through UX (confirmations on destructive actions, clear review-before-commit steps, minimal data exposure) without asserting technical security properties that V1 doesn't implement.
4. **Não technical audience.** Every flow (upload, validation errors, comparison, confirmation) must read clearly to a non-technical HR person — plain pt-BR, no jargon.
5. **Built to grow without a rebuild.** Data model and flows should anticipate multi-tenant enforcement and automatic ERP ingestion later, even though V1 is mock-data/frontend-only.

## Accessibility & Inclusion

No project-specific accessibility requirement was established beyond general good practice; follow standard web accessibility hygiene (keyboard navigation, contrast, semantic markup) as a baseline.
