-- ==========================================
-- BOLD WORKPLACE DATABASE SCHEMA
-- ==========================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'tenant');
CREATE TYPE public.ticket_status AS ENUM ('pending', 'in_progress', 'resolved');

-- 2. FLOORS TABLE (Andares do prédio)
CREATE TABLE public.floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    features TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default floors
INSERT INTO public.floors (floor_number, name, description, is_available, is_premium, features) VALUES
(2, '2º Andar', 'Em reforma/construção', false, false, ARRAY['Em obras']),
(3, '3º Andar', 'Escritórios privativos', true, false, ARRAY['Escritórios privativos', 'Sala de reunião gratuita']),
(5, '5º Andar', 'Escritórios privativos', true, false, ARRAY['Escritórios privativos', 'Sala de reunião gratuita']),
(6, '6º Andar', 'Escritórios privativos', true, false, ARRAY['Escritórios privativos', 'Sala de reunião gratuita']),
(9, '9º Andar', 'Escritórios privativos', true, false, ARRAY['Escritórios privativos', 'Sala de reunião gratuita']),
(11, '11º Andar', 'Escritórios privativos', true, false, ARRAY['Escritórios privativos', 'Sala de reunião gratuita']),
(12, '12º Andar', 'Andar premium com salas de reunião e serviços extras', true, true, ARRAY['Salas de reunião premium', 'Serviços extras', 'Cardápio exclusivo']);

-- 3. USER ROLES TABLE (Roles separados conforme requisitos de segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'tenant',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 4. PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    company TEXT NOT NULL,
    floor_id UUID REFERENCES public.floors(id),
    room TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TICKETS TABLE (Chamados)
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL CHECK (char_length(description) <= 150),
    status ticket_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ANNOUNCEMENTS TABLE (Avisos)
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. MENU ITEMS TABLE (Cardápio 12º andar)
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default menu items
INSERT INTO public.menu_items (name, description, price, is_available, category) VALUES
('Água com gás', 'Garrafa individual gelada', 6.00, true, 'Bebidas'),
('Nuts', 'Mix de castanhas premium', 12.00, true, 'Snacks'),
('Bolachas amanteigadas', 'Porção individual', 8.00, true, 'Snacks'),
('Bolo Bauducco', 'Unidade individual', 10.00, true, 'Snacks');

-- 8. MESSAGE TEMPLATES TABLE (Templates de mensagens)
CREATE TABLE public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default templates
INSERT INTO public.message_templates (title, content, category) VALUES
('Impressora indisponível', 'A impressora do andar X encontra-se temporariamente indisponível. Nossa equipe já está atuando para normalizar o serviço.', 'Manutenção'),
('Instabilidade elétrica', 'Identificamos uma instabilidade no fornecimento de energia elétrica. Técnicos já foram acionados.', 'Energia'),
('Água interrompida', 'O fornecimento de água está temporariamente interrompido para manutenção emergencial.', 'Água'),
('Manutenção programada', 'Manutenção programada nas dependências do prédio. Contamos com a compreensão de todos.', 'Manutenção'),
('Interrupção de energia', 'Comunicamos que houve uma interrupção no fornecimento de energia elétrica no prédio. Nossa equipe já acionou os responsáveis e manteremos todos informados.', 'Energia'),
('Manutenção áreas comuns', 'Manutenção programada nas áreas comuns hoje. Eventuais ruídos podem ocorrer.', 'Manutenção');

-- ==========================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ==========================================

-- Check if user has admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- FLOORS: Everyone can read
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view floors"
ON public.floors FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage floors"
ON public.floors FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- USER ROLES: Restricted access
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- PROFILES: Users see own, admins see all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile or admin can view all"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- TICKETS: Users manage own, admins manage all
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets or admin can view all"
ON public.tickets FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create own tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tickets or admin can update all"
ON public.tickets FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Only admins can delete tickets"
ON public.tickets FOR DELETE
TO authenticated
USING (public.is_admin());

-- ANNOUNCEMENTS: Everyone reads, admins manage
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
ON public.announcements FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- MENU ITEMS: Everyone reads, admins manage
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available menu items"
ON public.menu_items FOR SELECT
USING (is_available = true OR public.is_admin());

CREATE POLICY "Only admins can manage menu items"
ON public.menu_items FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- MESSAGE TEMPLATES: Admins only
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view templates"
ON public.message_templates FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can manage templates"
ON public.message_templates FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==========================================
-- AUTO-CREATE PROFILE & ROLE ON SIGNUP
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default tenant role for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'tenant');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_floors_updated_at
  BEFORE UPDATE ON public.floors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();