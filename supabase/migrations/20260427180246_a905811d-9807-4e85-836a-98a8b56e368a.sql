
-- =========================================
-- CUSTOMERS (Empresas vindas do Conexa)
-- =========================================
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conexa_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  trade_name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  raw JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_active ON public.customers(is_active);
CREATE INDEX idx_customers_name ON public.customers(name);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Central can manage customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (is_admin() OR has_role(auth.uid(), 'central_atendimento'::app_role))
  WITH CHECK (is_admin() OR has_role(auth.uid(), 'central_atendimento'::app_role));

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PERSONS (Pessoas vindas do Conexa)
-- =========================================
CREATE TABLE public.persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conexa_id BIGINT NOT NULL UNIQUE,
  customer_conexa_id BIGINT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  emails TEXT[] DEFAULT '{}',
  phone TEXT,
  document TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  raw JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_persons_active ON public.persons(is_active);
CREATE INDEX idx_persons_customer ON public.persons(customer_id);
CREATE INDEX idx_persons_name ON public.persons(name);
CREATE INDEX idx_persons_emails ON public.persons USING GIN(emails);

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view persons"
  ON public.persons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Central can manage persons"
  ON public.persons FOR ALL
  TO authenticated
  USING (is_admin() OR has_role(auth.uid(), 'central_atendimento'::app_role))
  WITH CHECK (is_admin() OR has_role(auth.uid(), 'central_atendimento'::app_role));

CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PROFILES: vínculo com Customer do Conexa
-- =========================================
ALTER TABLE public.profiles
  ADD COLUMN conexa_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_conexa_customer ON public.profiles(conexa_customer_id);
