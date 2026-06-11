# Copa 2026 Simulador

Site publico, responsivo e nao oficial para simular a Copa do Mundo FIFA 2026 manualmente.

Site publicado: https://somosnext.github.io/copa-2026-simulador/

## Funcionalidades

- Todos os 72 jogos da fase de grupos, separados por grupo.
- Campos manuais de placar, sem login.
- Atualizacao opcional de placares pela API-Football/API-SPORTS.
- Classificacao automatica com pontos, vitorias, empates, derrotas, gols pro, gols contra e saldo.
- Avanco automatico dos dois primeiros de cada grupo e dos oito melhores terceiros.
- Area para editar ou confirmar os classificados dos 32 avos.
- Chaveamento visual ate oitavas, quartas, semifinais, terceiro lugar e final.
- Desempate manual em jogos eliminatorios empatados.
- Campeao, vice, terceiro lugar e resumo de campanha.
- Dados salvos no navegador com `localStorage`.
- Botoes para limpar simulacao e exportar/copiar resultados.

## Tecnologias

- React
- Vite
- Tailwind CSS
- lucide-react
- localStorage
- API-Football/API-SPORTS opcional

## Atualizar placares automaticamente

O site busca resultados da Copa 2026 pelo endpoint:

```txt
https://v3.football.api-sports.io/fixtures?league=1&season=2026
```

### Modo recomendado: Vercel

Use o endpoint seguro em `api/worldcup-results.js`. A chave fica no servidor e nao aparece no navegador.

1. Crie uma conta em [API-Football](https://www.api-football.com/).
2. Pegue sua chave no painel.
3. No deploy da Vercel, configure a variavel:

```txt
API_FOOTBALL_KEY=sua_chave
```

4. Publique o projeto na Vercel.

O botao "Atualizar placares" chamara `/api/worldcup-results` automaticamente.

### Modo local ou GitHub Pages

Tambem existe fallback direto pelo navegador:

```txt
VITE_API_FOOTBALL_KEY=sua_chave
```

Crie um arquivo `.env.local` para testar localmente. Em GitHub Pages, essa chave ficara exposta no JavaScript final, entao use apenas se aceitar esse risco.

## Rodar localmente

```bash
npm install
npm run dev
```

## Gerar build

```bash
npm run build
```

## Deploy no GitHub Pages

O site esta publicado pelo GitHub Pages usando a branch `gh-pages`.

Para republicar depois de alguma alteracao:

```bash
npm run build
git worktree add --detach /tmp/copa-2026-gh-pages
cd /tmp/copa-2026-gh-pages
git checkout --orphan gh-pages
git rm -rf .
cp -R /caminho/do/projeto/dist/. .
touch .nojekyll
git add .
git commit -m "Deploy GitHub Pages"
git push origin gh-pages --force
```

## Aviso

Este e um projeto nao oficial, sem ligacao com FIFA, organizadores, patrocinadores ou emissoras. A estetica usa contraste, escala tipografica e composicao editorial inspiradas no clima visual da Copa de 2026, sem copiar logos, imagens ou arquivos protegidos.
