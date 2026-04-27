ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS conexa_person_id uuid REFERENCES public.persons(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_conexa_person_id ON public.profiles(conexa_person_id);
CREATE INDEX IF NOT EXISTS idx_persons_customer_id ON public.persons(customer_id);
CREATE INDEX IF NOT EXISTS idx_persons_name ON public.persons(name);