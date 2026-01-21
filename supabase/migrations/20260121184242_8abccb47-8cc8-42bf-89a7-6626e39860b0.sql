-- Create meeting_rooms table for the new feature
CREATE TABLE public.meeting_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  floor TEXT NOT NULL,
  capacity INTEGER DEFAULT 10,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone can view meeting rooms
CREATE POLICY "Anyone can view meeting rooms"
ON public.meeting_rooms
FOR SELECT
USING (true);

-- Only admins can manage meeting rooms
CREATE POLICY "Only admins can manage meeting rooms"
ON public.meeting_rooms
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Insert the meeting rooms data
INSERT INTO public.meeting_rooms (name, floor) VALUES
('Sala de Reunião 1', '12º Andar'),
('Sala de Reunião 2', '12º Andar'),
('Sala de Reunião 3', '12º Andar'),
('Sala de Reunião 4', '12º Andar'),
('Sala de Reunião 5', '11º Andar'),
('Sala Privativa 310', '3º Andar'),
('Sala Privativa 311', '3º Andar');