# Zeus AeroDesign — Plataforma de Gestão de Sprints (UEMA)

Web App responsivo instalável como aplicativo (**PWA**) para substituir a planilha Excel da **Equipe Zeus AeroDesign** na preparação para a **SAE AeroDesign Brasil**.

## Funcionalidades da V1

- **Hierarquia & Patentes**: `Desenvolvedor` (acesso total + poderes de Capitão), `Capitão`, `Co-Capitão`, `Diretor`, `Efetivado`, `Calouro` e fluxo de contas `Pendente` para aprovação pela liderança.
- **11 Áreas Técnicas e de Gestão**: suporte a múltiplas áreas por membro e **Espaço Privado da Área** protegido.
- **Sprints com Dupla Validação**: status visual (`Vermelho`, `Amarelo`, `Verde`), matriz de prioridade (Crítica `4`, Alta `3`, Média `2`, Baixa `1`), link externo (Drive/CAD/Docs), campo de áreas impactadas (base do grafo V2), validação do Diretor e aprovação oficial em reunião pelo Capitão/Co-Capitão/Desenvolvedor.
- **Ranking Anual & Perfis**: pontos ponderados das tarefas aprovadas em reunião, histórico completo de sprints e taxa de presença no perfil.
- **% de Conclusão de Relatórios SAE**: checklist por área com cálculo automático + ajuste manual por Diretor/Capitão.
- **Chamada Quinzenal**: reuniões Gerais ou de Área com `Presente`, `Falta` e `Falta Justificada`.
- **Mural de Avisos**: comunicados fixados e cronológicos da liderança.

## Rodar localmente

```bash
npm install
npm run dev
```

Sem `.env.local`, o app roda imediatamente em **Modo Local / Demo** com persistência no `localStorage` e um seletor de perfil no topo para testar todos os níveis de permissão.

## Conectar Supabase (Free Tier) e publicar na Vercel

1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. No **SQL Editor**, execute o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql).
3. Copie `.env.example` para `.env.local` (ou configure na Vercel) com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Faça deploy conectando o repositório na [Vercel](https://vercel.com) (Free Tier).
