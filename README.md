# Pelipper Town Stats

Site com as stats base de todos os Pokémon do mod **Pelipper Town** para Stardew Valley. Dá para filtrar por geração e grupo, buscar por nome ou número, ordenar, marcar favoritos e ver as tarefas (jobs) que cada Pokémon faz no jogo.

Acesse: https://pelipper-town-stats.vercel.app

## Funcionalidades

### Troca de idioma

Os botões de bandeira alternam a interface entre português (Brasil) e inglês.

![Troca de idioma](docs/gifs/idioma.gif)

### Busca

Busque pelo nome ou pelo número da Pokédex. A lista filtra enquanto você digita.

![Busca](docs/gifs/busca.gif)

### Grupos

A lateral separa os Pokémon por geração e por grupos especiais, como formas de Alola, Mega Evoluções e rivais elementais.

![Grupos](docs/gifs/grupos.gif)

### Ordenação e filtro por tipo

Ordene por número da Pokédex, força total, ordem alfabética, favoritos ou por um stat específico. O filtro de tipo mostra só os Pokémon de um tipo.

![Ordenação e filtro por tipo](docs/gifs/filtros-ordenacao.gif)

### Favoritos

Clique em **Favoritar** em um card para salvar. Os favoritos ficam salvos no navegador e podem ser usados como ordenação ou como grupo na lateral.

![Favoritos](docs/gifs/favoritos.gif)

### Tarefas (jobs)

Cada card mostra os ícones das tarefas do Pokémon no jogo. Passe o mouse sobre um ícone para ver o nome da tarefa.

![Tarefas](docs/gifs/tarefas.gif)

## Rodando localmente

Requisitos: Node.js 20 ou mais recente.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

### Atualizando os dados

Os dados ficam em `app/data/pokemon.json`. Para gerar esse arquivo de novo a partir da pasta do mod instalado no Steam:

```bash
npm run data
```

O script `scripts/build-data.mjs` aceita o caminho da pasta `assets/data` do mod como argumento. Sem argumento, ele usa o caminho padrão do Steam no Windows.

## Stack

- [Next.js](https://nextjs.org) 16 com React 19
- TypeScript
- CSS Modules

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Gera a build de produção |
| `npm run start` | Sobe a build de produção |
| `npm run lint` | Roda o ESLint |
| `npm run data` | Regenera `app/data/pokemon.json` a partir do mod |
