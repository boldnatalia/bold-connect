-- Allow recepcao to also create announcements (mass notifications)
DROP POLICY IF EXISTS "Only admins can manage announcements" ON public.announcements;

CREATE POLICY "Staff can manage announcements" 
ON public.announcements 
FOR ALL 
USING (
  is_admin() 
  OR has_role(auth.uid(), 'central_atendimento')
  OR has_role(auth.uid(), 'recepcao')
)
WITH CHECK (
  is_admin() 
  OR has_role(auth.uid(), 'central_atendimento')
  OR has_role(auth.uid(), 'recepcao')
);