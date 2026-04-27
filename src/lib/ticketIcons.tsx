import {
  Hammer,
  Lightbulb,
  Wind,
  Plug,
  Frame,
  Wrench,
  Wifi,
  Droplets,
  Sparkles,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export interface ServiceTypeMeta {
  Icon: LucideIcon;
  label: string;
}

const RULES: Array<{ test: RegExp; meta: ServiceTypeMeta }> = [
  { test: /tomada|elétric|eletric|fio|energia/i, meta: { Icon: Plug, label: 'Elétrica' } },
  { test: /lâmpada|lampada|luz/i, meta: { Icon: Lightbulb, label: 'Iluminação' } },
  { test: /ar.?condicionado|ar cond|climatiza/i, meta: { Icon: Wind, label: 'Climatização' } },
  { test: /quadro|pendurar|fixar/i, meta: { Icon: Frame, label: 'Fixação' } },
  { test: /wifi|wi.?fi|internet|rede/i, meta: { Icon: Wifi, label: 'Rede' } },
  { test: /água|agua|vazamento|cano|hidráulic/i, meta: { Icon: Droplets, label: 'Hidráulica' } },
  { test: /limpeza|faxina/i, meta: { Icon: Sparkles, label: 'Limpeza' } },
  { test: /manuten|reparo|conserto/i, meta: { Icon: Wrench, label: 'Manutenção' } },
];

export function getServiceTypeMeta(title: string): ServiceTypeMeta {
  for (const r of RULES) if (r.test.test(title)) return r.meta;
  return { Icon: Hammer, label: 'Serviço' };
}

export { MessageSquare };
