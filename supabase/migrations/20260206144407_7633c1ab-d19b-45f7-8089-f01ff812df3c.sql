-- Allow admins and central_atendimento to update any profile (e.g. deactivate users)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_admin() OR has_role(auth.uid(), 'central_atendimento'::app_role))
WITH CHECK (is_admin() OR has_role(auth.uid(), 'central_atendimento'::app_role));
