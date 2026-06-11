# Copa 2026 Simulador

Site publico, responsivo e nao oficial para simular a Copa do Mundo FIFA 2026 manualmente.

## Funcionalidades

- Todos os 72 jogos da fase de grupos, separados por grupo.
- Campos manuais de placar, sem API e sem login.
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

## Rodar localmente

```bash
npm install
npm run dev
```

## Gerar build

```bash
npm run build
```

## Deploy

O projeto inclui workflow de GitHub Pages em `.github/workflows/deploy.yml`.

Depois de subir para um repositorio publico no GitHub:

1. Abra `Settings > Pages`.
2. Em `Build and deployment`, escolha `GitHub Actions`.
3. Faça push na branch `main`.

## Aviso

Este e um projeto nao oficial, sem ligacao com FIFA, organizadores, patrocinadores ou emissoras. A estetica usa contraste, escala tipografica e composicao editorial inspiradas no clima visual da Copa de 2026, sem copiar logos, imagens ou arquivos protegidos.
