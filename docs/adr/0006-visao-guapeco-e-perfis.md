# Visão da equipe Guapeco e perfis de usuário

O protótipo tem dois perfis: **RH** (da empresa cliente) e **Guapeco** (financeiro/operações).
Cada perfil tem seu conjunto de rotas (`/` e `/guapeco`) e o `AppShell` redireciona quem tenta
abrir a área do outro.

Divisão de responsabilidades:

- **RH:** envia a base (completa, só novos ou só desligamentos), edita dados e status dos
  colaboradores (individual e em massa), confirma a conferência de CNPJs. **Não** altera o benefício.
- **Guapeco:** consulta a base de cada empresa, atualiza o benefício (individual, em massa e por
  planilha) e exporta a base e o resumo das conferências. **Não** altera dados cadastrais nem envia base.

Os services aplicam essas regras (checam o perfil), não só a interface. A Guapeco enxerga uma
empresa por vez: a rota `/guapeco/empresas/:id` define a "empresa em foco", e os mesmos services
do RH passam a ler essa empresa. Isso evita duplicar consultas, mas o foco é silencioso e vive só
na memória — com backend real, o isolamento por empresa e por perfil precisa ser aplicado no banco.

Cada tipo de envio de base tem regras próprias: só a **base completa** marca quem sumiu como
"Não encontrado na última base"; **só novos** rejeita matrículas que já existem; **só
desligamentos** exige matrícula existente e data de desligamento (não futura).
