-- Part 2: Create tables and functions for reception system

-- 1. Create table for reception pre-defined messages
CREATE TABLE public.reception_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  has_input_field boolean DEFAULT false,
  input_field_label text,
  input_field_placeholder text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reception_messages ENABLE ROW LEVEL SECURITY;

-- Policies for reception_messages
CREATE POLICY "Admin and Central can manage reception messages"
  ON public.reception_messages FOR ALL
  USING (public.has_role(auth.uid(), 'central_atendimento') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'central_atendimento') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reception can view active messages"
  ON public.reception_messages FOR SELECT
  USING (is_active = true AND public.has_role(auth.uid(), 'recepcao'));

-- 2. Create table for reception notifications sent to clients
CREATE TABLE public.reception_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  message_id uuid REFERENCES public.reception_messages(id),
  custom_content text,
  input_value text,
  requires_response boolean DEFAULT false,
  response_value text,
  responded_at timestamptz,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reception_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for reception_notifications
CREATE POLICY "Reception and staff can create notifications"
  ON public.reception_notifications FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND 
    (public.has_role(auth.uid(), 'recepcao') OR public.has_role(auth.uid(), 'central_atendimento') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Staff can view all notifications, clients see their own"
  ON public.reception_notifications FOR SELECT
  USING (
    public.has_role(auth.uid(), 'recepcao') OR 
    public.has_role(auth.uid(), 'central_atendimento') OR 
    public.has_role(auth.uid(), 'admin') OR
    recipient_id = auth.uid()
  );

CREATE POLICY "Recipients can update their notifications to respond"
  ON public.reception_notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- 3. Insert default reception messages
INSERT INTO public.reception_messages (title, content, category, has_input_field, input_field_label, input_field_placeholder, sort_order) VALUES
('Visitante na portaria', 'Olá! Chegou visitante para você na portaria.', 'Visitantes', true, 'Nome do visitante', 'Digite o nome do visitante', 1),
('Entrega na portaria', 'Olá! Chegou entrega para você na portaria.', 'Entregas', false, null, null, 2),
('Entrega de lanche', 'Olá! Chegou entrega de lanche para você na portaria.', 'Entregas', false, null, null, 3),
('Entregador aguardando', 'Olá! Chegou lanche para você na portaria e o entregador está aguardando.', 'Entregas', false, null, null, 4),
('Retirada de encomenda', 'Olá! Pedimos sua atenção para retirada da encomenda recebida.', 'Entregas', false, null, null, 5),
('Solicitar código iFood', 'Olá! Precisamos do código de entrega do iFood para liberar seu pedido.', 'Códigos', true, 'Código de entrega', 'O cliente irá informar o código', 6);

-- 4. Add trigger for updated_at
CREATE TRIGGER update_reception_messages_updated_at
  BEFORE UPDATE ON public.reception_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create helper functions for role checks
CREATE OR REPLACE FUNCTION public.is_central_atendimento()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'central_atendimento') OR public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_recepcao()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'recepcao')
$$;