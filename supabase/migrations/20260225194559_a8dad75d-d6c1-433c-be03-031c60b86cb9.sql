-- Allow admins and central_atendimento to insert profiles for any user (e.g. when creating users)
CREATE POLICY "Admins can insert any profile"
ON public.profiles
FOR INSERT
WITH CHECK (is_admin() OR has_role(auth.uid(), 'central_atendimento'::app_role));