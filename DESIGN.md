# Design

<!-- impeccable:design-schema 1 -->

## Mode

Operate. The visitor (an HR analyst) completes tasks — consulting, uploading, reviewing diffs, resolving pendências — so scanability, consistency and native table/form affordances outrank expression.

## World

Canon B2B SaaS operate grammar, taken as the standing exit and named directly by the brief: Stripe, Linear, Rippling, Deel as the craft bar. No concept-seed roll — the brief pinned the aesthetic references, which beats the roll per the "brief wins" rule.

Restrained color strategy: a near-black/white neutral scale (shadcn "Nova" preset, zinc-based) carries the entire interface — text, borders, primary buttons — with one deep-emerald brand accent (`--brand`) reserved for identity (wordmark tone), active navigation state, links, and "com adesão" affirmative badges. Semantic accents (`--success`, `--warning`, `--destructive`) are used only for status meaning (ativo/pendência/erro), never decoration.

Dark mode tokens exist (system default), but the shipped experience is optimized for light mode, matching the reference products' primary surface.

## Typography

Geist Variable (`@fontsource-variable/geist`) as the sole face, for both UI text and headings — a workhorse geometric sans appropriate to Operate mode. No secondary display face; hierarchy comes from size/weight/color, not font mixing.

## Layout & Components

- Fixed 240px sidebar (icon + label nav, active item gets `bg-brand-soft`/`text-brand`) + 56px topbar (Guapeco wordmark / company / user menu), content column capped at `max-w-7xl` with generous padding.
- shadcn/ui (Radix primitives) throughout: Card, Table, Sheet (employee & version detail side panels), Tabs (Novos/Removidos/Alterados/Erros), AlertDialog (destructive confirmations), Select, DropdownMenu, Sonner toasts.
- Cards: `rounded-lg`, 1px hairline border, no shadow-heavy elevation — quiet containers, not decorative chrome.
- Tables: dense, whitespace-nowrap cells, hover row highlight, horizontal scroll on overflow rather than truncation — status/benefit columns always render as pill badges, never raw enum strings.
- Status badges: small pill with a 6px dot — `success-soft`/`success` for Ativo, neutral `muted` for Desligado, `brand-soft`/`brand` for Com adesão, `warning-soft`/`warning` for "Não encontrado na nova base" pendências.
- Icons: lucide-react, 16–20px, `strokeWidth 1.75–2`, used sparingly (nav, empty states, upload states) — never decorative filler.
- Empty states: centered icon-in-circle + one-line title + optional description, dashed border container.

## Interaction

- Destructive/consequential actions (marcar como desligado, confirmar atualização) always route through an AlertDialog with plain-language copy before executing.
- The upload flow is a single-page state machine (idle → analisando → erros | comparação → sucesso), not a multi-route wizard, so context (the file, the summary) never gets lost in navigation.
- Toasts (sonner, top-right) confirm the result of every mutating action (desligamento, CNPJ, restaurar dados).

## Motion

Deliberately minimal: default shadcn/Radix open/close transitions on Sheet/Dialog/Select only. No custom choreographed motion — appropriate for a dense operational tool where movement should never compete with data.
