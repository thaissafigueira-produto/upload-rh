---
status: accepted
---

# V1 é frontend-only, sem backend real

O produto foi especificado com banco de dados persistente, autenticação e isolamento
multi-tenant real. Ao iniciar a implementação, decidimos entre construir isso com
Supabase (Postgres + Auth + Storage) desde já, ou entregar primeiro uma versão
frontend-only com dados mockados em `localStorage`, para validar o fluxo e o visual
antes de investir em infraestrutura. Optamos pela segunda opção — é uma escolha
explícita do usuário, não uma limitação técnica.

Isso significa que, hoje, não há isolamento de dados real entre empresas, nem login
real: existe apenas a empresa de demonstração (Venturus) e um usuário fixo. A
arquitetura (modelo de dados, cálculo de diff, fluxo de versionamento) foi desenhada
para não precisar de reconstrução quando um backend real for adicionado — ver
`PRODUCT.md` para o racional completo.
