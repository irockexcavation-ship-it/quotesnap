CREATE OR REPLACE FUNCTION public.get_customer_approvals()
RETURNS TABLE (
  quote_id uuid,
  accepted_name text,
  accepted_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT ON (l.quote_id)
    l.quote_id,
    l.accepted_name,
    l.accepted_at
  FROM public.quote_share_links AS l
  JOIN public.quotes AS q
    ON q.id = l.quote_id
  JOIN public.workspace_members AS wm
    ON wm.workspace_id = q.workspace_id
  WHERE wm.user_id = (SELECT auth.uid())
    AND l.accepted_at IS NOT NULL
  ORDER BY l.quote_id, l.accepted_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_customer_approvals()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_customer_approvals()
TO authenticated;
