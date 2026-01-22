-- Create ticket_comments table for tracking updates visible to both admin and client
CREATE TABLE public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 50),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on their own tickets, admins can view all
CREATE POLICY "Users can view comments on own tickets"
  ON public.ticket_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id 
      AND (t.user_id = auth.uid() OR is_admin())
    )
  );

-- Users can add comments to their own tickets
CREATE POLICY "Users can add comments to own tickets"
  ON public.ticket_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tickets t 
      WHERE t.id = ticket_id 
      AND (t.user_id = auth.uid() OR is_admin())
    )
  );

-- Only admins can delete comments
CREATE POLICY "Only admins can delete comments"
  ON public.ticket_comments
  FOR DELETE
  USING (is_admin());

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_comments;