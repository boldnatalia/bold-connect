-- Insert floors for Bold Workplace
INSERT INTO public.floors (floor_number, name, description, is_available, is_premium, features)
VALUES 
  (3, '3º andar', 'Andar comercial padrão', true, false, ARRAY['Wi-Fi', 'Ar-condicionado']),
  (5, '5º andar', 'Andar comercial padrão', true, false, ARRAY['Wi-Fi', 'Ar-condicionado']),
  (6, '6º andar', 'Andar comercial padrão', true, false, ARRAY['Wi-Fi', 'Ar-condicionado']),
  (9, '9º andar', 'Andar comercial padrão', true, false, ARRAY['Wi-Fi', 'Ar-condicionado']),
  (11, '11º andar', 'Andar comercial padrão', true, false, ARRAY['Wi-Fi', 'Ar-condicionado']),
  (12, '12º andar', 'Andar premium com copa', true, true, ARRAY['Wi-Fi', 'Ar-condicionado', 'Copa', 'Varanda']),
  (2, '2º andar (em reforma)', 'Andar em reforma temporariamente', false, false, NULL)
ON CONFLICT DO NOTHING;

-- Insert initial menu items for 12th floor
INSERT INTO public.menu_items (name, description, price, category, is_available)
VALUES 
  ('Água com gás', 'Água mineral com gás 500ml', 6.00, 'Bebidas', true),
  ('Nuts', 'Mix de castanhas 50g', 12.00, 'Snacks', true),
  ('Bolachas', 'Pacote de bolachas sortidas', 8.00, 'Snacks', true),
  ('Bolo Bauducco', 'Fatia de bolo Bauducco', 10.00, 'Doces', true)
ON CONFLICT DO NOTHING;