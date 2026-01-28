-- Part 1: Add new roles to enum only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recepcao';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'central_atendimento';