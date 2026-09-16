# Colaborador ausente na nova base nunca é desligado automaticamente

Quando um colaborador ativo não aparece na planilha enviada, a opção mais simples
seria removê-lo da base automaticamente. Rejeitamos essa opção: um erro no export
do RH (uma aba errada, um filtro esquecido, uma linha cortada) desligaria pessoas
reais do benefício sem confirmação — um custo alto e, em alguns casos, difícil de
perceber a tempo.

Em vez disso, esse colaborador é marcado como `naoEncontradoNaUltimaBase` (badge
"Não encontrado na nova base" / Pendência) e continua Ativo até o RH revisar e
confirmar explicitamente "Marcar como desligado". Isso está refletido em
`computeDiff` (`src/lib/diff.ts`) e no card "Pendências" da Visão geral. A
contrapartida é que uma empresa com alta rotatividade acumula pendências que o RH
precisa resolver ativamente — aceitável para V1, mas candidato a revisão se o
volume de pendências não resolvidas crescer sem controle.
