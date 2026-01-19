import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Building, Clock, Users, Shield, Wifi } from 'lucide-react';

const manualSections = [
  {
    id: 'regras',
    icon: Shield,
    title: 'Regras do Edifício',
    content: `• O horário de funcionamento do edifício é de segunda a sexta, das 7h às 22h, e aos sábados das 8h às 14h.
• É proibido fumar em todas as áreas internas do edifício.
• Animais de estimação não são permitidos nas dependências do prédio.
• O volume de músicas e conversas deve ser mantido em níveis adequados para não incomodar os demais ocupantes.
• É obrigatório o uso de crachá de identificação nas áreas comuns.`,
  },
  {
    id: 'areas-comuns',
    icon: Building,
    title: 'Áreas Comuns',
    content: `• As salas de reunião podem ser reservadas pelo app ou recepção.
• A copa é de uso coletivo e deve ser mantida limpa após o uso.
• O rooftop está disponível para eventos mediante agendamento prévio.
• Estacionamento: cada sala tem direito a vagas conforme contrato.`,
  },
  {
    id: 'servicos',
    icon: Users,
    title: 'Serviços Disponíveis',
    content: `• Recepção e portaria 24 horas
• Manutenção predial
• Serviço de correspondência
• Wi-Fi nas áreas comuns
• Limpeza diária das áreas comuns`,
  },
  {
    id: 'horarios',
    icon: Clock,
    title: 'Horários de Funcionamento',
    content: `• Recepção: Segunda a Sexta, 7h às 22h
• Portaria: 24 horas
• Limpeza áreas comuns: 6h às 10h e 18h às 21h
• Manutenção: Segunda a Sexta, 8h às 18h`,
  },
  {
    id: 'wifi',
    icon: Wifi,
    title: 'Internet e Conectividade',
    content: `• Rede de visitantes disponível nas áreas comuns
• Cada sala possui infraestrutura para internet dedicada
• Suporte técnico disponível em horário comercial`,
  },
];

export default function Manual() {
  return (
    <AppLayout title="Manual do Usuário">
      <div className="p-4 space-y-4 max-w-lg mx-auto animate-fade-in">
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Bold Workplace</p>
                <p className="text-sm text-muted-foreground">
                  Guia completo de uso do edifício
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-2">
          {manualSections.map((section) => {
            const Icon = section.icon;
            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </AppLayout>
  );
}
