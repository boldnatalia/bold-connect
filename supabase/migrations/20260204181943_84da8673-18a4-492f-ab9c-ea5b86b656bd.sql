-- Create a function to mask CPF based on user role
CREATE OR REPLACE FUNCTION public.get_masked_cpf(profile_user_id uuid, original_cpf text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- User viewing their own CPF - show full
    WHEN auth.uid() = profile_user_id THEN original_cpf
    -- Admin can see full CPF
    WHEN public.has_role(auth.uid(), 'admin') THEN original_cpf
    -- Central de atendimento can see full CPF (they manage users)
    WHEN public.has_role(auth.uid(), 'central_atendimento') THEN original_cpf
    -- Recepcao only sees masked CPF (last 2 digits visible)
    WHEN public.has_role(auth.uid(), 'recepcao') THEN 
      '***.***.***-' || RIGHT(original_cpf, 2)
    -- Anyone else gets fully masked
    ELSE '***.***.***-**'
  END
$$;

-- Create a secure view that masks CPF for recepcao users
CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id,
  user_id,
  full_name,
  public.get_masked_cpf(user_id, cpf) as cpf,
  company,
  room,
  floor_id,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_secure TO authenticated;