# Sistema Cronograma Zeus

Este pacote transforma o cronograma da Zeus em um site estático feito em HTML, CSS e JavaScript puro.

## Como abrir
1. Extraia o arquivo ZIP.
2. Abra o arquivo `index.html` no navegador.
3. Use o botão **Trocar logo** para colocar a logo oficial da Zeus.

## Arquivos
- `index.html`: estrutura do site.
- `style.css`: visual do sistema.
- `script.js`: filtros, calendário, dashboard, status e prioridade dinâmica.
- `dados.js`: dados do cronograma extraídos do Excel.
- `assets/logo-zeus-placeholder.svg`: logo provisória.

## Funcionalidades
- Dashboard com total de tarefas, atrasadas, urgentes e horas previstas.
- Calendário visual de postagens e entregas.
- Lista com filtros por área, responsável, status e prioridade.
- Atualização de status salva no navegador com `localStorage`.
- Prioridade dinâmica calculada conforme a data de controle.
- Upload local da logo da Zeus.
- Exportação do status salvo em JSON.

## Observação
O site funciona sem servidor. Para publicar no GitHub Pages, basta subir todos os arquivos da pasta.
