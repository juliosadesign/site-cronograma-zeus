-- Migration: add_area_feature_requests_and_ghost_allocations
-- Cria pedidos exclusivos dos diretores de área e vinculação persistente de perfis fantasmas.

create table if not exists public.area_feature_requests (
  id uuid primary key default gen_random_uuid(),
  area_id text not null references public.areas(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  details text not null default '',
  priority text not null default 'media' check (priority in ('alta', 'media', 'baixa')),
  status text not null default 'pendente' check (status in ('pendente', 'em_analise', 'planejado', 'entregue')),
  dev_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_area_feature_requests_area_id
  on public.area_feature_requests (area_id);
create index if not exists idx_area_feature_requests_author_id
  on public.area_feature_requests (author_id);

alter table public.area_feature_requests enable row level security;

create policy "Directors and top leadership can view area feature requests"
  on public.area_feature_requests
  for select
  to authenticated
  using (
    public.is_area_director(area_id)
    or public.is_top_leadership()
  );

create policy "Directors and top leadership can insert area feature requests"
  on public.area_feature_requests
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      public.is_area_director(area_id)
      or public.is_top_leadership()
    )
  );

create policy "Directors and top leadership can update area feature requests"
  on public.area_feature_requests
  for update
  to authenticated
  using (
    public.is_area_director(area_id)
    or public.is_top_leadership()
  )
  with check (
    public.is_area_director(area_id)
    or public.is_top_leadership()
  );

create policy "Authors or top leadership can delete area feature requests"
  on public.area_feature_requests
  for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    or public.is_top_leadership()
  );

create table if not exists public.ghost_allocations (
  ghost_id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  allocated_by uuid references public.profiles(id) on delete set null,
  allocated_at timestamptz not null default now()
);

create index if not exists idx_ghost_allocations_profile_id
  on public.ghost_allocations (profile_id);

alter table public.ghost_allocations enable row level security;

create policy "Approved members can view ghost allocations"
  on public.ghost_allocations
  for select
  to authenticated
  using (public.is_approved_member());

create policy "Top leadership can insert ghost allocations"
  on public.ghost_allocations
  for insert
  to authenticated
  with check (public.is_top_leadership());

create policy "Top leadership can update ghost allocations"
  on public.ghost_allocations
  for update
  to authenticated
  using (public.is_top_leadership())
  with check (public.is_top_leadership());

create policy "Top leadership can delete ghost allocations"
  on public.ghost_allocations
  for delete
  to authenticated
  using (public.is_top_leadership());
