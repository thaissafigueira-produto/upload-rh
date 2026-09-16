# SheetJS instalado via CDN, não pelo pacote `xlsx` do npm

O pacote `xlsx` publicado no registro do npm tem duas vulnerabilidades conhecidas
sem correção disponível ali (prototype pollution e ReDoS — GHSA-4r6h-8v6p-xvw6 e
GHSA-5pgg-2g8v-p4x9). O próprio mantenedor (SheetJS) recomenda instalar a build
corrigida diretamente do CDN oficial deles em vez do pacote do npm.

Por isso, o `package.json` aponta a dependência `xlsx` para
`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` em vez de uma versão do npm.
**Não rode `npm install xlsx` ou `npm update xlsx`** — isso reintroduziria o pacote
vulnerável do registro público. Para atualizar, troque a URL do tarball para uma
versão mais nova publicada em cdn.sheetjs.com.
