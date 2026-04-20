
UPDATE public.floors SET description = 'Espaço em reforma. Estamos preparando novos escritórios para você.', features = ARRAY['Expansão','Em Obras'] WHERE floor_number = 2;
UPDATE public.floors SET description = 'Escritórios privativos prontos para uso com salas de reunião próximas.', features = ARRAY['Escritórios','Reunião','Copa'] WHERE floor_number = 3;
UPDATE public.floors SET description = 'Escritórios corporativos com uma copa completa, ideal para almoços.', features = ARRAY['Escritórios','Copa','Refeitório'] WHERE floor_number = 5;
UPDATE public.floors SET description = 'Pavimento com nossa copa principal, área de convivência e varanda.', features = ARRAY['Varanda','Convivência','Copa'] WHERE floor_number = 6;
UPDATE public.floors SET description = 'Salas privativas com área de descanso e uma vista incrível da cidade.', features = ARRAY['Lounge','Vista','Copa'] WHERE floor_number = 9;
UPDATE public.floors SET description = 'Laje exclusiva para operação única de grande porte.', features = ARRAY['Privativo','Operação Única'] WHERE floor_number = 11;
UPDATE public.floors SET description = 'Andar de reuniões e recepção social. O cartão de visitas do Bold.', features = ARRAY['Recepção','Reunião','Premium'] WHERE floor_number = 12;
