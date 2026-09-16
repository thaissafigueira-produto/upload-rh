# Guapeco RH — Hub de Gestão da Base

Glossário dos termos do domínio usados neste produto: um hub para o RH de empresas
clientes da Guapeco administrar a população de colaboradores elegíveis ao benefício.

## Empresa e colaborador

**Empresa**:
Cliente da Guapeco cujos colaboradores são geridos na plataforma. É o limite de
isolamento de dados — uma empresa nunca vê colaboradores de outra.
_Avoid_: tenant, organização, conta.

**Colaborador**:
Pessoa elegível ao benefício, membro da população gerida por uma empresa.
_Avoid_: funcionário, usuário (usuário é quem acessa a plataforma, não quem está na base).

**Matrícula**:
Identificador único e estável do colaborador, usado para casar seu registro entre
versões diferentes da base. É a chave de identidade, não um dado de exibição.

**CNPJ**:
Entidade legal à qual o colaborador está vinculado. Uma empresa pode ter múltiplos
CNPJs (matriz e filiais); um colaborador pertence a exatamente um.

**Status**:
"Ativo" ou "Desligado". Só muda para Desligado por ação explícita do RH — nunca
automaticamente por ausência na base enviada.
_Avoid_: confundir com Status do benefício.

**Status do benefício**:
"Com adesão" ou "Sem adesão" — se o colaborador aderiu ao benefício da Guapeco.
Independente do Status (Ativo/Desligado).

## Base e versionamento

**Base (de colaboradores)**:
O conjunto vigente de colaboradores elegíveis de uma empresa, mantido pelo RH.
_Avoid_: planilha (a planilha é o arquivo de entrada; a base é o estado resultante).

**Versão da base**:
Um snapshot imutável da base, criado sempre que o RH confirma uma atualização.
Versões anteriores nunca são alteradas — apenas consultadas.
_Avoid_: upload (upload é a ação de enviar o arquivo; versão é o resultado confirmado).

**Atualização da base**:
O fluxo completo de enviar uma nova planilha, validá-la, comparar com a versão
vigente, revisar e confirmar — criando uma nova Versão da base.

**Comparação (diff)**:
O resultado de comparar a planilha enviada com a versão vigente da base, dividido
em três grupos: Novos, Removidos e Alterados.

**Novo**:
Colaborador presente na planilha enviada que não existia (ou estava desligado) na
versão vigente da base.

**Removido**:
Colaborador que estava ativo na versão vigente mas não aparece na planilha enviada.
Não é desligado automaticamente — vira uma Pendência.

**Alterado**:
Colaborador presente em ambas as versões, mas com um ou mais campos diferentes.
Cada alteração registra o campo, o valor anterior e o novo valor.

**Pendência**:
Colaborador ativo marcado como "não encontrado na nova base": desapareceu de uma
planilha enviada, mas o RH ainda não confirmou se ele foi desligado. Fica com o
status Ativo até essa confirmação.
_Avoid_: tratar como sinônimo de Desligado — são estados diferentes.

**Desligamento**:
Ação explícita do RH ("Marcar como desligado") que muda o Status de um colaborador
para Desligado. É sempre uma decisão humana, nunca inferida automaticamente.

## Governança

**Auditoria**:
Registro de eventos relevantes da plataforma (upload iniciado/concluído, atualização
confirmada, colaborador desligado, CNPJ alterado), com usuário, data e ação.
