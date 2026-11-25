-- Zeus AeroDesign (UEMA) — Schema V1 + Row Level Security (Supabase / Postgres)
-- Aplicado via migration no projeto Supabase zeus-aerodesign.

create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type zeus_role as enum (
    'desenvolvedor',
    'capitao',
    'cocapitao',
    'diretor',
    'efetivado',
    'calouro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type zeus_account_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type zeus_task_status as enum ('red', 'yellow', 'green');
exception when duplicate_object then null; end $$;

do $$ begin
  create type zeus_priority as enum ('critical', 'high', 'medium', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type zeus_attendance_status as enum ('present', 'absent', 'justified');
exception when duplicate_object then null; end $$;

-- 1. Areas (11 areas fixas da equipe)
create table if not exists public.areas (
  id text primary key,
  name text not null unique,
  slug text not null unique,
  short_code text not null
);

insert into public.areas (id, name, slug, short_code) values
  ('aerodinamica', 'Aerodinâmica', 'aerodinamica', 'AERO'),
  ('cargas', 'Cargas e Aeroelasticidade', 'cargas-aeroelasticidade', 'CARG'),
  ('estabilidade', 'Estabilidade e Controle', 'estabilidade-controle', 'ESTB'),
  ('estruturas', 'Estruturas', 'estruturas', 'ESTR'),
  ('desempenho', 'Desempenho', 'desempenho', 'DESM'),
  ('eletrico', 'Proj. Elétrico', 'projeto-eletrico', 'ELET'),
  ('marketing', 'Marketing', 'marketing', 'MKT'),
  ('plantas', 'Plantas', 'plantas', 'PLAN'),
  ('integracao', 'Integração', 'integracao', 'INTG'),
  ('gestao', 'Gestão', 'gestao', 'GEST'),
  ('financeiro', 'Financeiro', 'financeiro', 'FIN')
on conflict (id) do nothing;

-- 2. Profiles (vinculado ao auth.users do Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role zeus_role not null default 'calouro',
  account_status zeus_account_status not null default 'pending',
  requested_role zeus_role default 'calouro',
  avatar_url text,
  course text,
  bio text,
  in_lab_now boolean not null default false,
  lab_schedule text,
  lab_slots jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 3. Multiplas areas por membro + flag de diretor
create table if not exists public.profile_areas (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  area_id text not null references public.areas(id) on delete cascade,
  is_director boolean not null default false,
  primary key (profile_id, area_id)
);

-- 4. Sprints quinzenais
create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. Tarefas da Sprint (com dupla validacao e preparo para Grafo V2)
create table if not exists public.sprint_tasks (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references public.sprints(id) on delete cascade,
  area_id text not null references public.areas(id) on delete cascade,
  assignee_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null,
  description text not null default '',
  priority zeus_priority not null default 'medium',
  status zeus_task_status not null default 'red',
  director_validated boolean not null default false,
  director_validated_by uuid references public.profiles(id),
  meeting_approved boolean not null default false,
  meeting_approved_by uuid references public.profiles(id),
  external_url text,
  impacted_area_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- 6. Relatorios SAE por area (checklist + override manual)
create table if not exists public.report_sections (
  id uuid primary key default gen_random_uuid(),
  area_id text not null references public.areas(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  impacted_area_ids text[] not null default '{}',
  external_url text,
  max_score numeric(6,2),
  min_score numeric(6,2),
  created_at timestamptz not null default now()
);

create table if not exists public.area_report_overrides (
  area_id text primary key references public.areas(id) on delete cascade,
  manual_percentage integer check (manual_percentage between 0 and 100),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- 7. Reunioes quinzenais e presenca
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  meeting_type text not null check (meeting_type in ('general', 'area')),
  area_id text references public.areas(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_attendance (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status zeus_attendance_status not null default 'present',
  primary key (meeting_id, profile_id)
);

-- 8. Espaco Privado da Area (notas internas, rascunhos, links)
create table if not exists public.area_notes (
  id uuid primary key default gen_random_uuid(),
  area_id text not null references public.areas(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null,
  content text not null default '',
  external_url text,
  updated_at timestamptz not null default now()
);

-- 9. Mural de Avisos
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id),
  title text not null,
  content text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- 10. Calendario & Data da Competicao SAE
create table if not exists public.team_settings (
  id integer primary key default 1 check (id = 1),
  competition_date date not null default '2027-10-28'
);

insert into public.team_settings (id, competition_date)
values (1, '2027-10-28')
on conflict (id) do nothing;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  category text not null check (category in ('competition', 'meeting', 'sprint', 'deadline')),
  description text,
  area_id text references public.areas(id) on delete set null,
  created_by uuid references public.profiles(id)
);

-- Helpers de autorizacao para RLS (search_path travado)
create or replace function public.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and account_status = 'approved'
  );
$$;

create or replace function public.is_top_leadership()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and account_status = 'approved'
      and role in ('desenvolvedor', 'capitao', 'cocapitao')
  );
$$;

create or replace function public.is_area_director(target_area text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_top_leadership() or exists (
    select 1
    from public.profiles p
    join public.profile_areas pa on pa.profile_id = p.id
    where p.id = (select auth.uid())
      and p.account_status = 'approved'
      and p.role = 'diretor'
      and pa.area_id = target_area
      and pa.is_director = true
  );
$$;

create or replace function public.is_in_area(target_area text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_top_leadership() or exists (
    select 1 from public.profile_areas pa
    join public.profiles p on p.id = pa.profile_id
    where p.id = (select auth.uid())
      and p.account_status = 'approved'
      and pa.area_id = target_area
  );
$$;

-- Bootstrap seguro no primeiro cadastro:
-- Se nao houver nenhum perfil no banco, o primeiro usuario vira Desenvolvedor aprovado;
-- os seguintes entram como Calouro Pendente aguardando aprovacao.
create or replace function public.register_or_bootstrap_profile(
  p_full_name text,
  p_email text,
  p_requested_role zeus_role default 'calouro',
  p_area_ids text[] default array['aerodinamica']
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_is_first boolean;
  v_profile public.profiles;
  v_area text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if found then
    return v_profile;
  end if;

  -- Lock leve para garantir unicidade do primeiro usuario bootstrap
  lock table public.profiles in share row exclusive mode;
  select not exists (select 1 from public.profiles) into v_is_first;

  insert into public.profiles (id, full_name, email, role, account_status, requested_role)
  values (
    v_uid,
    coalesce(nullif(trim(p_full_name), ''), p_email),
    p_email,
    case when v_is_first then 'desenvolvedor'::zeus_role else 'calouro'::zeus_role end,
    case when v_is_first then 'approved'::zeus_account_status else 'pending'::zeus_account_status end,
    p_requested_role
  )
  returning * into v_profile;

  if array_length(p_area_ids, 1) is not null then
    foreach v_area in array p_area_ids loop
      insert into public.profile_areas (profile_id, area_id, is_director)
      values (v_uid, v_area, false)
      on conflict do nothing;
    end loop;
  end if;

  return v_profile;
end;
$$;

-- Habilitar RLS em todas as tabelas
alter table public.areas enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_areas enable row level security;
alter table public.sprints enable row level security;
alter table public.sprint_tasks enable row level security;
alter table public.report_sections enable row level security;
alter table public.area_report_overrides enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_attendance enable row level security;
alter table public.area_notes enable row level security;
alter table public.announcements enable row level security;
alter table public.team_settings enable row level security;
alter table public.calendar_events enable row level security;

-- Leitura transparente para membros aprovados (exceto area_notes)
create policy "approved_read_areas" on public.areas for select to authenticated using (public.is_approved_member());
create policy "read_own_or_approved_profiles" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_approved_member());
create policy "approved_read_profile_areas" on public.profile_areas for select to authenticated using (public.is_approved_member() or profile_id = (select auth.uid()));
create policy "approved_read_sprints" on public.sprints for select to authenticated using (public.is_approved_member());
create policy "approved_read_tasks" on public.sprint_tasks for select to authenticated using (public.is_approved_member());
create policy "approved_read_report_sections" on public.report_sections for select to authenticated using (public.is_approved_member());
create policy "approved_read_report_overrides" on public.area_report_overrides for select to authenticated using (public.is_approved_member());
create policy "approved_read_meetings" on public.meetings for select to authenticated using (public.is_approved_member());
create policy "approved_read_attendance" on public.meeting_attendance for select to authenticated using (public.is_approved_member());
create policy "approved_read_announcements" on public.announcements for select to authenticated using (public.is_approved_member());
create policy "approved_read_team_settings" on public.team_settings for select to authenticated using (public.is_approved_member());
create policy "approved_read_calendar_events" on public.calendar_events for select to authenticated using (public.is_approved_member());

-- Auto-atualizacao do proprio perfil sem escalar role/status
create policy "self_update_profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (
      public.is_top_leadership()
      or (
        role = (select p.role from public.profiles p where p.id = (select auth.uid()))
        and account_status = (select p.account_status from public.profiles p where p.id = (select auth.uid()))
      )
    )
  );

-- Mutacoes da lideranca maxima (Desenvolvedor, Capitao, Co-Capitao)
create policy "leadership_manage_profiles" on public.profiles
  for update to authenticated
  using (public.is_top_leadership())
  with check (public.is_top_leadership());

create policy "leadership_manage_profile_areas" on public.profile_areas
  for all to authenticated
  using (public.is_top_leadership())
  with check (public.is_top_leadership());

create policy "leadership_manage_sprints" on public.sprints
  for all to authenticated
  using (public.is_top_leadership())
  with check (public.is_top_leadership());

create policy "leadership_manage_announcements" on public.announcements
  for all to authenticated
  using (public.is_top_leadership())
  with check (public.is_top_leadership());

create policy "leadership_manage_team_settings" on public.team_settings
  for all to authenticated
  using (public.is_top_leadership())
  with check (public.is_top_leadership());

-- Eventos do calendario: lideranca ou diretor da area vinculada
create policy "director_manage_calendar_events" on public.calendar_events
  for all to authenticated
  using (public.is_top_leadership() or (area_id is not null and public.is_area_director(area_id)))
  with check (public.is_top_leadership() or (area_id is not null and public.is_area_director(area_id)));

-- Tarefas: diretores/lideranca criam e deletam; responsavel ou diretor da area atualiza
create policy "director_insert_tasks" on public.sprint_tasks
  for insert to authenticated
  with check (public.is_area_director(area_id));

create policy "member_or_director_update_tasks" on public.sprint_tasks
  for update to authenticated
  using (assignee_id = (select auth.uid()) or public.is_area_director(area_id))
  with check (assignee_id = (select auth.uid()) or public.is_area_director(area_id));

create policy "director_delete_tasks" on public.sprint_tasks
  for delete to authenticated
  using (public.is_area_director(area_id));

-- Relatorios e Reunioes: diretores da area ou lideranca maxima
create policy "director_manage_report_sections" on public.report_sections
  for all to authenticated
  using (public.is_area_director(area_id))
  with check (public.is_area_director(area_id));

create policy "director_manage_report_overrides" on public.area_report_overrides
  for all to authenticated
  using (public.is_area_director(area_id))
  with check (public.is_area_director(area_id));

create policy "director_manage_meetings" on public.meetings
  for all to authenticated
  using (
    public.is_top_leadership() or (meeting_type = 'area' and area_id is not null and public.is_area_director(area_id))
  )
  with check (
    public.is_top_leadership() or (meeting_type = 'area' and area_id is not null and public.is_area_director(area_id))
  );

create policy "director_manage_attendance" on public.meeting_attendance
  for all to authenticated
  using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_id
        and (public.is_top_leadership() or (m.meeting_type = 'area' and m.area_id is not null and public.is_area_director(m.area_id)))
    )
  )
  with check (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_id
        and (public.is_top_leadership() or (m.meeting_type = 'area' and m.area_id is not null and public.is_area_director(m.area_id)))
    )
  );

-- 11. Votacao conceitual (Monoplano / Biplano / Asa Voadora)
create table if not exists public.concept_votes (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  concept text not null check (concept in ('monoplano', 'biplano', 'asa_voadora')),
  updated_at timestamptz not null default now()
);

alter table public.concept_votes enable row level security;

create policy "approved_read_concept_votes" on public.concept_votes for select to authenticated using (public.is_approved_member());
create policy "self_upsert_concept_votes" on public.concept_votes for insert to authenticated with check (profile_id = (select auth.uid()) and public.is_approved_member());
create policy "self_update_concept_votes" on public.concept_votes for update to authenticated using (profile_id = (select auth.uid()) and public.is_approved_member()) with check (profile_id = (select auth.uid()) and public.is_approved_member());
create policy "self_delete_concept_votes" on public.concept_votes for delete to authenticated using (profile_id = (select auth.uid()) and public.is_approved_member());

-- Espaco Privado da Area: SOMENTE membros daquela area + Desenvolvedor/Capitao/Co-Capitao
create policy "private_area_notes_all" on public.area_notes
  for all to authenticated
  using (public.is_in_area(area_id))
  with check (public.is_in_area(area_id));
