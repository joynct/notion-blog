# Clog Criativo v2: blog com Notion como CMS

O Notion continua sendo onde você escreve e controla as publicações. A diferença é **como** o site lê o Notion:

| Antes (v1) | Agora (v2) |
|---|---|
| API não oficial do Notion, com o cookie `token_v2` da sua conta (expira e quebra sem aviso) | API oficial do Notion, com uma integração (estável) |
| Páginas geradas na hora da visita (ISR + `fallback`): o 1º visitante, e o Google, viam "Loading..." ou uma versão antiga | **Todas** as páginas são geradas no build como HTML pronto. O Google lê o conteúdo completo |
| Sitemap consultava o Notion a cada acesso e estourava o tempo limite da Vercel | `sitemap.xml` é um arquivo estático gerado no build |
| Imagens com links do Notion, que expiram em ~1h | Imagens baixadas e servidas pelo próprio site |
| Post inexistente respondia "200 OK" | 404 de verdade |
| `lang="en"`, mesma descrição em todas as páginas | `pt-BR`, título/descrição/imagem por post, URL canônica, dados estruturados (JSON-LD) |
| Next 11 | Next 15 |

## Como funciona

```
Notion ──(npm run build)──► scripts/sync-notion.mjs ──► content/*.json + public/notion-assets/
                                                     └► sitemap.xml, rss.xml, robots.txt, search-index.json
                                    next build ──► HTML estático de todas as páginas
```

Publicou ou editou um post no Notion? O site atualiza no próximo build: automático 2x por dia, ou na hora pelo botão (veja o passo 5).

Se o Notion estiver fora do ar ou algo der errado na sincronização, o build falha **de propósito**. A Vercel então mantém a última versão boa no ar, em vez de publicar um blog vazio.

---

## Configuração (uma vez só)

### 1. Criar a integração no Notion

1. Acesse https://www.notion.so/profile/integrations → **Nova integração**.
2. Tipo **Interna**, escolha o workspace do blog e salve.
3. Em **Capacidades**, deixe marcado "Ler conteúdo". Em "Informações do usuário", marque **"Ler informações do usuário, incluindo e-mail"** para o nome do autor aparecer.
4. Copie o **Token de integração interna** (começa com `ntn_`). Esse é o seu `NOTION_TOKEN`.

> ⚠️ O `NOTION_TOKEN` antigo (o `token_v2`) **não funciona** aqui. Se ele ainda estiver em algum lugar, apague: ele dá acesso total à sua conta do Notion. Por segurança, saia e entre de novo no Notion para invalidá-lo.

### 2. Dar acesso ao banco de dados

No Notion, abra o banco de dados dos posts → **•••** (canto superior direito) → **Conexões** → adicione a integração que você criou.

### 3. Pegar o ID do banco de dados

Abra o banco de dados como página inteira. A URL fica assim:

```
https://www.notion.so/seu-workspace/2068f0xxxxxxxxxxxxxxxxxxxxxxxxxx?v=...
                                    └──────────── ID (32 caracteres) ──┘
```

Esse é o `NOTION_DATABASE_ID`. O `BLOG_INDEX_ID` do blog antigo também funciona: se ele for de uma página que contém o banco de dados, o script encontra o banco sozinho.

### 4. Colunas do banco de dados

O script aceita os nomes do blog antigo e os equivalentes em português (maiúsculas não importam):

| Coluna | Tipo no Notion | Obrigatória? | Nomes aceitos |
|---|---|---|---|
| Título | Título | sim | qualquer nome |
| Publicação | Checkbox, ou Select/Status com "Yes"/"Sim"/"Publicado" | sim | `Published`, `Publicado`, `Status` |
| Slug | Texto | não (usa o título) | `Slug`, `URL` |
| Data | Data | não (usa a data de criação) | `Date`, `Data` |
| Autores | Pessoa | não | `Authors`, `Autor`, `Autores` |
| Categorias | Multi-select ou Select | não | `Category`, `Categoria`, `Categorias`, `Tags` |
| Descrição | Texto | não* | `Description`, `Descrição`, `Resumo` |
| Capa | Arquivos | não** | `Cover`, `Capa`, `Imagem` |

\* Sem descrição, o resumo vem do texto antes do primeiro **divisor** do post (como no blog antigo) ou do primeiro parágrafo. Vale preencher: é o texto que aparece no Google e no WhatsApp.
\** Sem capa, usa a capa da página do Notion ou a primeira imagem do post.

Para mudar os nomes aceitos, edite `PROPS` no topo de `scripts/sync-notion.mjs`.

### 5. Vercel

1. Suba esta pasta para o GitHub. Pode ser o mesmo repositório `joynct/notion-blog`, substituindo o conteúdo, ou um novo.
2. Na Vercel → projeto → **Settings → Environment Variables**, cadastre:
   - `NOTION_TOKEN` = token do passo 1
   - `NOTION_DATABASE_ID` = ID do passo 3
   - `SITE_URL` = `https://clogcriativo.vercel.app` (ou seu domínio, quando tiver)
   - Remova o `NOTION_TOKEN` antigo, o `BLOG_INDEX_ID` e o `USE_CACHE`, se ainda estiverem lá.
3. **Settings → General → Node.js Version**: 22.x.
4. Faça um deploy.

**Atualização automática:**

1. Vercel → **Settings → Git → Deploy Hooks** → crie um hook para a branch `main` e copie a URL.
2. GitHub → repositório → **Settings → Secrets and variables → Actions** → novo secret `VERCEL_DEPLOY_HOOK` com essa URL.

Pronto. O blog atualiza sozinho todo dia às 18h. Para atualizar na hora: GitHub → aba **Actions** → "Atualizar blog" → **Run workflow**. Para mudar o horário, edite o `cron` em `.github/workflows/atualizar-blog.yml`.

> Dica: no Notion, dá para criar um **botão** com a ação "Enviar webhook" apontando para a URL do Deploy Hook (disponível nos planos pagos do Notion). Assim você publica direto de lá.

### 6. Google Search Console

1. Em https://search.google.com/search-console, use a propriedade que você já tem. O arquivo de verificação `google150bc454607f80b9.html` continua no site.
2. **Sitemaps** → envie `sitemap.xml`.
3. Para acelerar um post novo: **Inspeção de URL** → cole o link do post → **Solicitar indexação**.

A indexação de um site novo leva de alguns dias a algumas semanas. Isso é normal.

---

## Rodar no computador

```bash
npm install
copy .env.example .env.local   # no Windows (no Mac/Linux: cp)
# preencha o .env.local com NOTION_TOKEN e NOTION_DATABASE_ID
npm run sync     # baixa os posts do Notion
npm run dev      # abre em http://localhost:3000
```

Rode `npm run sync` de novo sempre que quiser ver mudanças feitas no Notion. Para testar a versão final: `npm run build` e depois `npm start`.

## Onde mudar o quê

| Quero mudar... | Arquivo |
|---|---|
| Nome do site, descrição, URL, redes sociais, Google Analytics, posts por página | `site.config.js` |
| Texto da home | `src/pages/index.tsx` |
| Menu | `src/components/Header.tsx` |
| Visual | `src/styles/*.css` |
| Como cada tipo de bloco do Notion aparece | `src/components/NotionRenderer.tsx` |

## Blocos do Notion suportados

Parágrafo, títulos 1 a 3 (inclusive os recolhíveis), listas com marcadores e numeradas (com subníveis), to-do, citação, callout, toggle, código (com cores), equação, divisor, sumário, tabela, colunas, bloco sincronizado, imagem, vídeo (YouTube, Vimeo ou arquivo), áudio, arquivo/PDF, bookmark e embed (YouTube, Vimeo, Spotify, Loom, Google Maps, Canva, tweets). Texto em negrito, itálico, sublinhado, riscado, código, cores, links e equações inline.

Blocos não suportados são ignorados, e o build mostra um aviso com o nome do post.

## Endereços

- `/blog`: lista de posts (página 1); `/blog/page/2`, `/blog/page/3`...
- `/blog/<slug>`: post
- `/categoria/<categoria>`: posts da categoria. O nome vira endereço sem acentos: "Marketing Digital" → `/categoria/marketing-digital`
- `/sitemap.xml`, `/rss.xml`, `/robots.txt`
