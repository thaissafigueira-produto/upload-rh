# Design

## Mode

Operate. Quem usa (uma pessoa de RH) executa tarefas — consultar, atualizar a base, revisar o que mudou, resolver pendências, conferir CNPJs — então leitura rápida, consistência e tabelas/formulários nativos vêm antes de expressão. A referência de estrutura e visual é o portal de RH da Wellhub, com a identidade da Guapeco; referências de qualidade: Stripe, Linear, Rippling, Deel.

## Identidade Guapeco

- Primária: roxo `#4e4394` (hover `#46408e`, pressionado `#3d3c87`) — botões primários, item ativo da sidebar, links e destaques. Tokens `--primary`, `--primary-hover`, `--primary-active`, `--brand`.
- Destaque: rosa `#e89c9c` (`--rose`, `--rose-soft`) — com moderação: badge "Novo" (estrela de 4 pontas) e detalhes.
- Lilás `#c4b6da` (`--lilac`, `--lilac-soft`) — fundos suaves, cards de atenção, estados selecionados.
- Marrom `#b4715e` — apoio pontual (não usado por padrão).
- Neutros quentes: sidebar em creme `#faf6ef`; conteúdo branco. Cores semânticas (`--success`, `--warning`, `--destructive`) só para significado de status.
- Tipografia: League Spartan (Google Fonts, pesos 400–700) em toda a interface.
- Wordmark "Guapeco" em roxo no topo da sidebar. Ícones lucide outline; detalhes de pet (pata, coração) só em empty states, sucesso e dicas.

## Layout & Componentes

- Sidebar creme de 16rem: logo, seletor empresa/usuário (menu: perfil, restaurar dados de demonstração, sair), itens com ícone outline e item ativo em fundo lilás suave; badge numérico no item "CNPJs" quando há conferência pendente. Selo discreto "Ambiente de demonstração" no topo do conteúdo.
- Cabeçalho de página: título grande e em negrito, subtítulo cinza, botão "Glossário de termos" ao lado do título, breadcrumb em páginas internas.
- Cards brancos com raio 16px e sombra muito leve; botões primários em pílula; links de ação em roxo, sublinhados.
- Números grandes nos cards de resumo com uma linha de contexto; caixas de dica (lâmpada, fundo bege) explicam o que fazer; `Stepper` numerado para o fluxo de atualização.
- Tabelas: cabeçalho em caixa alta pequena, divisórias finas, seta de ação à direita, link "Filtrar" com ícone; status sempre em badges com ícone.
- Sem alertas do navegador: modais (`Dialog`/`AlertDialog`), painéis laterais (`Sheet`) e toasts (Sonner).

## Interação

- Ações destrutivas ou irreversíveis (desligar, confirmar atualização, confirmar conferência, restaurar dados) sempre passam por modal com texto em português simples.
- Atualizar base é uma máquina de estados numa única rota (enviar → validação → o que mudou → confirmar → sucesso); cancelar ou sair descarta a análise.
- Todos os fluxos têm loading, sucesso, erro, empty state e confirmação.

## Movimento

Mínimo: transições padrão do Radix em Sheet/Dialog/Select. Sem coreografia própria.
