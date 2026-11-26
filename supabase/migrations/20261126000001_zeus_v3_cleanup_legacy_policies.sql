-- Optional Cleanup SQL (run manually in Supabase Dashboard SQL Editor to resolve legacy multiple_permissive_policies & public SECURITY DEFINER warnings)

-- profiles
DROP POLICY IF EXISTS leadership_manage_profiles ON public.profiles;
DROP POLICY IF EXISTS self_update_profile ON public.profiles;
CREATE POLICY profiles_update_unified ON public.profiles
  FOR UPDATE TO authenticated
  USING (private.is_top_leadership() OR id = (SELECT auth.uid()))
  WITH CHECK (
    private.is_top_leadership() OR (
      id = (SELECT auth.uid())
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
      AND account_status = (SELECT p.account_status FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
    )
  );

-- profile_areas
DROP POLICY IF EXISTS leadership_manage_profile_areas ON public.profile_areas;
CREATE POLICY profile_areas_insert ON public.profile_areas FOR INSERT TO authenticated WITH CHECK (private.is_top_leadership());
CREATE POLICY profile_areas_update ON public.profile_areas FOR UPDATE TO authenticated USING (private.is_top_leadership()) WITH CHECK (private.is_top_leadership());
CREATE POLICY profile_areas_delete ON public.profile_areas FOR DELETE TO authenticated USING (private.is_top_leadership());

-- sprints
DROP POLICY IF EXISTS leadership_manage_sprints ON public.sprints;
CREATE POLICY sprints_insert ON public.sprints FOR INSERT TO authenticated WITH CHECK (private.is_top_leadership());
CREATE POLICY sprints_update ON public.sprints FOR UPDATE TO authenticated USING (private.is_top_leadership()) WITH CHECK (private.is_top_leadership());
CREATE POLICY sprints_delete ON public.sprints FOR DELETE TO authenticated USING (private.is_top_leadership());

-- report_sections
DROP POLICY IF EXISTS director_manage_report_sections ON public.report_sections;
CREATE POLICY report_sections_insert ON public.report_sections FOR INSERT TO authenticated WITH CHECK (private.is_area_director(area_id));
CREATE POLICY report_sections_update ON public.report_sections FOR UPDATE TO authenticated USING (private.is_area_director(area_id)) WITH CHECK (private.is_area_director(area_id));
CREATE POLICY report_sections_delete ON public.report_sections FOR DELETE TO authenticated USING (private.is_area_director(area_id));

-- meetings
DROP POLICY IF EXISTS director_manage_meetings ON public.meetings;
CREATE POLICY meetings_insert ON public.meetings FOR INSERT TO authenticated WITH CHECK (private.is_top_leadership() OR (meeting_type = 'area' AND area_id IS NOT NULL AND private.is_area_director(area_id)));
CREATE POLICY meetings_update ON public.meetings FOR UPDATE TO authenticated USING (private.is_top_leadership() OR (meeting_type = 'area' AND area_id IS NOT NULL AND private.is_area_director(area_id))) WITH CHECK (private.is_top_leadership() OR (meeting_type = 'area' AND area_id IS NOT NULL AND private.is_area_director(area_id)));
CREATE POLICY meetings_delete ON public.meetings FOR DELETE TO authenticated USING (private.is_top_leadership() OR (meeting_type = 'area' AND area_id IS NOT NULL AND private.is_area_director(area_id)));

-- meeting_attendance
DROP POLICY IF EXISTS director_manage_attendance ON public.meeting_attendance;
CREATE POLICY meeting_attendance_insert ON public.meeting_attendance FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_attendance.meeting_id AND (private.is_top_leadership() OR (m.meeting_type = 'area' AND m.area_id IS NOT NULL AND private.is_area_director(m.area_id)))));
CREATE POLICY meeting_attendance_update ON public.meeting_attendance FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_attendance.meeting_id AND (private.is_top_leadership() OR (m.meeting_type = 'area' AND m.area_id IS NOT NULL AND private.is_area_director(m.area_id))))) WITH CHECK (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_attendance.meeting_id AND (private.is_top_leadership() OR (m.meeting_type = 'area' AND m.area_id IS NOT NULL AND private.is_area_director(m.area_id)))));
CREATE POLICY meeting_attendance_delete ON public.meeting_attendance FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_attendance.meeting_id AND (private.is_top_leadership() OR (m.meeting_type = 'area' AND m.area_id IS NOT NULL AND private.is_area_director(m.area_id)))));

-- announcements
DROP POLICY IF EXISTS leadership_manage_announcements ON public.announcements;
CREATE POLICY announcements_insert ON public.announcements FOR INSERT TO authenticated WITH CHECK (private.is_top_leadership());
CREATE POLICY announcements_update ON public.announcements FOR UPDATE TO authenticated USING (private.is_top_leadership()) WITH CHECK (private.is_top_leadership());
CREATE POLICY announcements_delete ON public.announcements FOR DELETE TO authenticated USING (private.is_top_leadership());

-- team_settings
DROP POLICY IF EXISTS leadership_manage_team_settings ON public.team_settings;
CREATE POLICY team_settings_insert ON public.team_settings FOR INSERT TO authenticated WITH CHECK (private.is_top_leadership());
CREATE POLICY team_settings_update ON public.team_settings FOR UPDATE TO authenticated USING (private.is_top_leadership()) WITH CHECK (private.is_top_leadership());
CREATE POLICY team_settings_delete ON public.team_settings FOR DELETE TO authenticated USING (private.is_top_leadership());

-- calendar_events
DROP POLICY IF EXISTS director_manage_calendar_events ON public.calendar_events;
CREATE POLICY calendar_events_insert ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (private.is_top_leadership() OR (area_id IS NOT NULL AND private.is_area_director(area_id)));
CREATE POLICY calendar_events_update ON public.calendar_events FOR UPDATE TO authenticated USING (private.is_top_leadership() OR (area_id IS NOT NULL AND private.is_area_director(area_id))) WITH CHECK (private.is_top_leadership() OR (area_id IS NOT NULL AND private.is_area_director(area_id)));
CREATE POLICY calendar_events_delete ON public.calendar_events FOR DELETE TO authenticated USING (private.is_top_leadership() OR (area_id IS NOT NULL AND private.is_area_director(area_id)));

-- archive_documents
DROP POLICY IF EXISTS director_manage_archive_documents ON public.archive_documents;
CREATE POLICY archive_documents_insert ON public.archive_documents FOR INSERT TO authenticated WITH CHECK (private.is_area_director(area_id));
CREATE POLICY archive_documents_update ON public.archive_documents FOR UPDATE TO authenticated USING (private.is_area_director(area_id)) WITH CHECK (private.is_area_director(area_id));
CREATE POLICY archive_documents_delete ON public.archive_documents FOR DELETE TO authenticated USING (private.is_area_director(area_id));

-- flight_checklist_items
DROP POLICY IF EXISTS director_manage_flight_checklist ON public.flight_checklist_items;
CREATE POLICY flight_checklist_insert ON public.flight_checklist_items FOR INSERT TO authenticated WITH CHECK (private.is_top_leadership() OR (area_id IS NOT NULL AND private.is_area_director(area_id)));
CREATE POLICY flight_checklist_update ON public.flight_checklist_items FOR UPDATE TO authenticated USING (private.is_top_leadership() OR (area_id IS NOT NULL AND private.is_area_director(area_id))) WITH CHECK (private.is_top_leadership() OR (area_id IS NOT NULL AND private.is_area_director(area_id)));
CREATE POLICY flight_checklist_delete ON public.flight_checklist_items FOR DELETE TO authenticated USING (private.is_top_leadership() OR (area_id IS NOT NULL AND private.is_area_director(area_id)));

-- competition_lessons
DROP POLICY IF EXISTS director_manage_competition_lessons ON public.competition_lessons;
CREATE POLICY competition_lessons_insert ON public.competition_lessons FOR INSERT TO authenticated WITH CHECK (private.is_area_director(area_id));
CREATE POLICY competition_lessons_update ON public.competition_lessons FOR UPDATE TO authenticated USING (private.is_area_director(area_id)) WITH CHECK (private.is_area_director(area_id));
CREATE POLICY competition_lessons_delete ON public.competition_lessons FOR DELETE TO authenticated USING (private.is_area_director(area_id));

-- area_report_overrides (legacy)
DROP POLICY IF EXISTS director_manage_report_overrides ON public.area_report_overrides;
CREATE POLICY area_report_overrides_insert ON public.area_report_overrides FOR INSERT TO authenticated WITH CHECK (private.is_area_director(area_id));
CREATE POLICY area_report_overrides_update ON public.area_report_overrides FOR UPDATE TO authenticated USING (private.is_area_director(area_id)) WITH CHECK (private.is_area_director(area_id));
CREATE POLICY area_report_overrides_delete ON public.area_report_overrides FOR DELETE TO authenticated USING (private.is_area_director(area_id));
