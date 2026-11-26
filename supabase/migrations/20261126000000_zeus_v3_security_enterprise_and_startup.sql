-- Zeus AeroDesign V3 (Non-destructive): Private helpers, multi-role per area, season overrides, corporate modules & startup workflows

-- 1. Private schema for SECURITY DEFINER RLS helpers
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

-- 2. Multi-role support on profile_areas
ALTER TABLE public.profile_areas
  ADD COLUMN IF NOT EXISTS area_role text NOT NULL DEFAULT 'efetivado';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profile_areas_area_role_check'
      AND conrelid = 'public.profile_areas'::regclass
  ) THEN
    ALTER TABLE public.profile_areas
      ADD CONSTRAINT profile_areas_area_role_check
      CHECK (area_role IN ('diretor', 'efetivado', 'calouro'));
  END IF;
END $$;

UPDATE public.profile_areas
SET area_role = 'diretor'
WHERE is_director = true AND area_role <> 'diretor';

-- 3. Private RLS Helper Functions
CREATE OR REPLACE FUNCTION private.is_approved_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND account_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_top_leadership()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND account_status = 'approved'
      AND role IN ('desenvolvedor', 'capitao', 'cocapitao')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_area_director(target_area text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_top_leadership() OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.profile_areas pa ON pa.profile_id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.account_status = 'approved'
      AND pa.area_id = target_area
      AND (pa.is_director = true OR pa.area_role = 'diretor')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_in_area(target_area text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_top_leadership() OR EXISTS (
    SELECT 1
    FROM public.profile_areas pa
    JOIN public.profiles p ON p.id = pa.profile_id
    WHERE p.id = (SELECT auth.uid())
      AND p.account_status = 'approved'
      AND pa.area_id = target_area
  );
$$;

CREATE OR REPLACE FUNCTION private.can_access_finance()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_top_leadership() OR private.is_in_area('financeiro');
$$;

REVOKE ALL ON FUNCTION private.is_approved_member() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_top_leadership() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_area_director(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_in_area(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_access_finance() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.is_approved_member() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_top_leadership() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_area_director(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_in_area(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_finance() TO authenticated;

-- Delegate public.is_area_director to private.is_area_director so existing policies support multi-role per area immediately
CREATE OR REPLACE FUNCTION public.is_area_director(target_area text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_area_director(target_area);
$$;

-- 4. V3 Onboarding RPC supporting (area_id, area_role) memberships
CREATE OR REPLACE FUNCTION public.register_or_bootstrap_profile_v3(
  p_full_name text,
  p_email text,
  p_requested_role public.zeus_role DEFAULT 'calouro'::public.zeus_role,
  p_area_memberships jsonb DEFAULT '[]'::jsonb
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_is_first boolean;
  v_profile public.profiles;
  v_item jsonb;
  v_area_id text;
  v_area_role text;
  v_inserted integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF FOUND THEN
    RETURN v_profile;
  END IF;

  LOCK TABLE public.profiles IN SHARE ROW EXCLUSIVE MODE;
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_is_first;

  INSERT INTO public.profiles (id, full_name, email, role, account_status, requested_role)
  VALUES (
    v_uid,
    COALESCE(NULLIF(trim(p_full_name), ''), p_email),
    p_email,
    CASE WHEN v_is_first THEN 'desenvolvedor'::public.zeus_role ELSE 'calouro'::public.zeus_role END,
    CASE WHEN v_is_first THEN 'approved'::public.zeus_account_status ELSE 'pending'::public.zeus_account_status END,
    p_requested_role
  )
  RETURNING * INTO v_profile;

  IF p_area_memberships IS NOT NULL AND jsonb_typeof(p_area_memberships) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_area_memberships) LOOP
      v_area_id := COALESCE(v_item->>'area_id', v_item->>'areaId', '');
      v_area_role := COALESCE(v_item->>'area_role', v_item->>'role', 'calouro');
      IF v_area_role NOT IN ('diretor', 'efetivado', 'calouro') THEN
        v_area_role := 'calouro';
      END IF;
      IF EXISTS (SELECT 1 FROM public.areas WHERE id = v_area_id) THEN
        INSERT INTO public.profile_areas (profile_id, area_id, is_director, area_role)
        VALUES (v_uid, v_area_id, (v_is_first AND v_area_role = 'diretor'), v_area_role)
        ON CONFLICT (profile_id, area_id) DO UPDATE
          SET area_role = EXCLUDED.area_role,
              is_director = EXCLUDED.is_director;
        v_inserted := v_inserted + 1;
      END IF;
    END LOOP;
  END IF;

  IF v_inserted = 0 THEN
    INSERT INTO public.profile_areas (profile_id, area_id, is_director, area_role)
    VALUES (v_uid, 'aerodinamica', false, 'calouro')
    ON CONFLICT (profile_id, area_id) DO NOTHING;
  END IF;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.register_or_bootstrap_profile_v3(text, text, public.zeus_role, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_or_bootstrap_profile_v3(text, text, public.zeus_role, jsonb) TO authenticated;

-- 5. Season-isolated report overrides table (non-destructive replacement for area_report_overrides)
CREATE TABLE IF NOT EXISTS public.season_report_overrides (
  area_id text NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  season_year integer NOT NULL DEFAULT 2026,
  manual_percentage integer CHECK (manual_percentage >= 0 AND manual_percentage <= 100),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (area_id, season_year)
);

INSERT INTO public.season_report_overrides (area_id, season_year, manual_percentage, updated_by, updated_at)
SELECT area_id, 2026, manual_percentage, updated_by, updated_at
FROM public.area_report_overrides
ON CONFLICT (area_id, season_year) DO NOTHING;

ALTER TABLE public.season_report_overrides ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.season_report_overrides TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'season_report_overrides' AND policyname = 'season_report_overrides_select') THEN
    CREATE POLICY season_report_overrides_select ON public.season_report_overrides
      FOR SELECT TO authenticated USING (private.is_approved_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'season_report_overrides' AND policyname = 'season_report_overrides_insert') THEN
    CREATE POLICY season_report_overrides_insert ON public.season_report_overrides
      FOR INSERT TO authenticated WITH CHECK (private.is_area_director(area_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'season_report_overrides' AND policyname = 'season_report_overrides_update') THEN
    CREATE POLICY season_report_overrides_update ON public.season_report_overrides
      FOR UPDATE TO authenticated USING (private.is_area_director(area_id)) WITH CHECK (private.is_area_director(area_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'season_report_overrides' AND policyname = 'season_report_overrides_delete') THEN
    CREATE POLICY season_report_overrides_delete ON public.season_report_overrides
      FOR DELETE TO authenticated USING (private.is_area_director(area_id));
  END IF;
END $$;

-- 6. Blocker fields on sprint_tasks
ALTER TABLE public.sprint_tasks
  ADD COLUMN IF NOT EXISTS blocked_by_area_id text REFERENCES public.areas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS blocked_reason text NOT NULL DEFAULT '';

-- 7. New V3 Tables
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.sprint_tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'comment' CHECK (kind IN ('comment', 'rejection', 'blocker', 'approval')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_notification_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  discord_webhook_url text,
  telegram_bot_token text,
  telegram_chat_id text,
  auto_notify_announcements boolean NOT NULL DEFAULT false,
  auto_notify_approvals boolean NOT NULL DEFAULT false,
  auto_notify_blockers boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year integer NOT NULL DEFAULT 2026,
  kind text NOT NULL CHECK (kind IN ('income', 'expense')),
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
  category text NOT NULL,
  area_id text REFERENCES public.areas(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  transaction_date date NOT NULL DEFAULT current_date,
  receipt_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.area_budgets (
  area_id text NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  season_year integer NOT NULL DEFAULT 2026,
  planned_cents integer NOT NULL DEFAULT 0 CHECK (planned_cents >= 0),
  notes text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (area_id, season_year)
);

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year integer NOT NULL DEFAULT 2026,
  kind text NOT NULL CHECK (kind IN ('post', 'sponsor', 'event', 'media')),
  title text NOT NULL,
  partner_or_channel text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'published', 'closed')),
  due_date date,
  external_url text,
  notes text NOT NULL DEFAULT '',
  impacted_area_ids text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year integer NOT NULL DEFAULT 2026,
  quarter text NOT NULL DEFAULT 'Q1',
  area_id text REFERENCES public.areas(id) ON DELETE SET NULL,
  title text NOT NULL,
  key_result text NOT NULL DEFAULT '',
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.aircraft_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year integer NOT NULL DEFAULT 2026,
  version_tag text NOT NULL,
  title text NOT NULL,
  concept text NOT NULL DEFAULT 'monoplano' CHECK (concept IN ('monoplano', 'biplano', 'asa_voadora')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'frozen', 'competition')),
  mtow_kg numeric(6,2),
  payload_kg numeric(6,2),
  cg_percent numeric(5,2),
  external_url text,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft_revisions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.task_comments,
  public.team_notification_settings,
  public.financial_transactions,
  public.area_budgets,
  public.marketing_campaigns,
  public.team_okrs,
  public.aircraft_revisions
TO authenticated;

-- 8. Clean non-overlapping RLS Policies for all new V3 tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_comments' AND policyname = 'task_comments_select') THEN
    CREATE POLICY task_comments_select ON public.task_comments
      FOR SELECT TO authenticated USING (private.is_approved_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_comments' AND policyname = 'task_comments_insert') THEN
    CREATE POLICY task_comments_insert ON public.task_comments
      FOR INSERT TO authenticated WITH CHECK (private.is_approved_member() AND author_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_comments' AND policyname = 'task_comments_delete') THEN
    CREATE POLICY task_comments_delete ON public.task_comments
      FOR DELETE TO authenticated USING (author_id = (SELECT auth.uid()) OR private.is_top_leadership());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_notification_settings' AND policyname = 'team_notification_settings_all') THEN
    CREATE POLICY team_notification_settings_all ON public.team_notification_settings
      FOR ALL TO authenticated USING (private.is_top_leadership()) WITH CHECK (private.is_top_leadership());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'financial_transactions' AND policyname = 'financial_transactions_all') THEN
    CREATE POLICY financial_transactions_all ON public.financial_transactions
      FOR ALL TO authenticated USING (private.can_access_finance()) WITH CHECK (private.can_access_finance());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'area_budgets' AND policyname = 'area_budgets_all') THEN
    CREATE POLICY area_budgets_all ON public.area_budgets
      FOR ALL TO authenticated USING (private.can_access_finance()) WITH CHECK (private.can_access_finance());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketing_campaigns' AND policyname = 'marketing_campaigns_select') THEN
    CREATE POLICY marketing_campaigns_select ON public.marketing_campaigns
      FOR SELECT TO authenticated USING (private.is_approved_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketing_campaigns' AND policyname = 'marketing_campaigns_insert') THEN
    CREATE POLICY marketing_campaigns_insert ON public.marketing_campaigns
      FOR INSERT TO authenticated WITH CHECK (private.is_in_area('marketing'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketing_campaigns' AND policyname = 'marketing_campaigns_update') THEN
    CREATE POLICY marketing_campaigns_update ON public.marketing_campaigns
      FOR UPDATE TO authenticated USING (private.is_in_area('marketing')) WITH CHECK (private.is_in_area('marketing'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketing_campaigns' AND policyname = 'marketing_campaigns_delete') THEN
    CREATE POLICY marketing_campaigns_delete ON public.marketing_campaigns
      FOR DELETE TO authenticated USING (private.is_in_area('marketing'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_okrs' AND policyname = 'team_okrs_select') THEN
    CREATE POLICY team_okrs_select ON public.team_okrs
      FOR SELECT TO authenticated USING (private.is_approved_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_okrs' AND policyname = 'team_okrs_insert') THEN
    CREATE POLICY team_okrs_insert ON public.team_okrs
      FOR INSERT TO authenticated WITH CHECK (private.is_in_area('gestao'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_okrs' AND policyname = 'team_okrs_update') THEN
    CREATE POLICY team_okrs_update ON public.team_okrs
      FOR UPDATE TO authenticated USING (private.is_in_area('gestao')) WITH CHECK (private.is_in_area('gestao'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'team_okrs' AND policyname = 'team_okrs_delete') THEN
    CREATE POLICY team_okrs_delete ON public.team_okrs
      FOR DELETE TO authenticated USING (private.is_in_area('gestao'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'aircraft_revisions' AND policyname = 'aircraft_revisions_select') THEN
    CREATE POLICY aircraft_revisions_select ON public.aircraft_revisions
      FOR SELECT TO authenticated USING (private.is_approved_member());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'aircraft_revisions' AND policyname = 'aircraft_revisions_insert') THEN
    CREATE POLICY aircraft_revisions_insert ON public.aircraft_revisions
      FOR INSERT TO authenticated WITH CHECK (
        private.is_top_leadership()
        OR private.is_area_director('integracao')
        OR private.is_area_director('aerodinamica')
        OR private.is_area_director('estruturas')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'aircraft_revisions' AND policyname = 'aircraft_revisions_update') THEN
    CREATE POLICY aircraft_revisions_update ON public.aircraft_revisions
      FOR UPDATE TO authenticated
      USING (
        private.is_top_leadership()
        OR private.is_area_director('integracao')
        OR private.is_area_director('aerodinamica')
        OR private.is_area_director('estruturas')
      )
      WITH CHECK (
        private.is_top_leadership()
        OR private.is_area_director('integracao')
        OR private.is_area_director('aerodinamica')
        OR private.is_area_director('estruturas')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'aircraft_revisions' AND policyname = 'aircraft_revisions_delete') THEN
    CREATE POLICY aircraft_revisions_delete ON public.aircraft_revisions
      FOR DELETE TO authenticated USING (
        private.is_top_leadership()
        OR private.is_area_director('integracao')
        OR private.is_area_director('aerodinamica')
        OR private.is_area_director('estruturas')
      );
  END IF;
END $$;

-- 9. Covering indexes for all foreign keys (22 existing + new V3 FKs)
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON public.announcements (author_id);
CREATE INDEX IF NOT EXISTS idx_archive_documents_area_id ON public.archive_documents (area_id);
CREATE INDEX IF NOT EXISTS idx_archive_documents_created_by ON public.archive_documents (created_by);
CREATE INDEX IF NOT EXISTS idx_area_notes_area_id ON public.area_notes (area_id);
CREATE INDEX IF NOT EXISTS idx_area_notes_author_id ON public.area_notes (author_id);
CREATE INDEX IF NOT EXISTS idx_area_report_overrides_updated_by ON public.area_report_overrides (updated_by);
CREATE INDEX IF NOT EXISTS idx_season_report_overrides_updated_by ON public.season_report_overrides (updated_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_area_id ON public.calendar_events (area_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON public.calendar_events (created_by);
CREATE INDEX IF NOT EXISTS idx_competition_lessons_area_id ON public.competition_lessons (area_id);
CREATE INDEX IF NOT EXISTS idx_competition_lessons_created_by ON public.competition_lessons (created_by);
CREATE INDEX IF NOT EXISTS idx_flight_checklist_items_area_id ON public.flight_checklist_items (area_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_profile_id ON public.meeting_attendance (profile_id);
CREATE INDEX IF NOT EXISTS idx_meetings_area_id ON public.meetings (area_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings (created_by);
CREATE INDEX IF NOT EXISTS idx_profile_areas_area_id ON public.profile_areas (area_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_area_id ON public.report_sections (area_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_area_id ON public.sprint_tasks (area_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_assignee_id ON public.sprint_tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_created_by ON public.sprint_tasks (created_by);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_director_validated_by ON public.sprint_tasks (director_validated_by);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_meeting_approved_by ON public.sprint_tasks (meeting_approved_by);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_sprint_id ON public.sprint_tasks (sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_blocked_by_area_id ON public.sprint_tasks (blocked_by_area_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments (task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON public.task_comments (author_id);
CREATE INDEX IF NOT EXISTS idx_team_notification_settings_updated_by ON public.team_notification_settings (updated_by);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_area_id ON public.financial_transactions (area_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_by ON public.financial_transactions (created_by);
CREATE INDEX IF NOT EXISTS idx_area_budgets_updated_by ON public.area_budgets (updated_by);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON public.marketing_campaigns (created_by);
CREATE INDEX IF NOT EXISTS idx_team_okrs_area_id ON public.team_okrs (area_id);
CREATE INDEX IF NOT EXISTS idx_team_okrs_owner_id ON public.team_okrs (owner_id);
CREATE INDEX IF NOT EXISTS idx_team_okrs_created_by ON public.team_okrs (created_by);
CREATE INDEX IF NOT EXISTS idx_aircraft_revisions_created_by ON public.aircraft_revisions (created_by);

-- 10. Enable Realtime on live collaboration tables
DO $$
DECLARE
  tbl text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tbl IN ARRAY ARRAY['sprint_tasks', 'profiles', 'task_comments', 'announcements'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      END IF;
    END LOOP;
  END IF;
END $$;
