-- Add unique constraint on profiles.user_id if not exists
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add foreign keys from reception_notifications to profiles
ALTER TABLE public.reception_notifications
ADD CONSTRAINT reception_notifications_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.reception_notifications
ADD CONSTRAINT reception_notifications_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update profiles RLS to allow recepcao to view tenant profiles (active clients)
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;

CREATE POLICY "Users can view own profile or staff can view all" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR is_admin() 
  OR has_role(auth.uid(), 'central_atendimento')
  OR has_role(auth.uid(), 'recepcao')
);