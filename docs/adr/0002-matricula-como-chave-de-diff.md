# Matrícula é a chave de identidade para comparar versões da base

Para calcular o diff entre a planilha enviada e a base vigente, precisamos de um
campo que identifique de forma estável o mesmo colaborador entre duas versões.
E-mail corporativo parece uma opção natural, mas muda com frequência (nome social,
casamento, correção de digitação, troca de departamento com padrão de e-mail
diferente) — usá-lo como chave faria uma simples correção de e-mail aparecer como
"colaborador removido" + "colaborador novo", em vez de uma alteração de campo.

Decidimos usar **matrícula** como chave de identidade em `computeDiff` (ver
`src/lib/diff.ts`). Nome, e-mail, CNPJ, departamento, cargo e status são todos
tratados como atributos que podem mudar sem que o colaborador deixe de ser "o
mesmo". Isso pressupõe que a matrícula em si é estável — se uma empresa reemitir
matrículas, o diff vai interpretar isso como desligamento + admissão.
