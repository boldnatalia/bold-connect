import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Building,
  Clock,
  Wifi,
  UtensilsCrossed,
  Loader2,
  DoorOpen,
  Shield,
  Globe,
  Users,
  Printer,
  Car,
  Gift,
} from 'lucide-react';
import { useMenu } from '@/hooks/useMenu';

interface ManualSubSection {
  title: string;
  content: string;
}

interface ManualSection {
  id: string;
  icon: React.ElementType;
  title: string;
  intro?: string;
  subsections?: ManualSubSection[];
  content?: string;
}

const manualSections: ManualSection[] = [
  {
    id: '0-acesso',
    icon: DoorOpen,
    title: 'Acesso ao Edifício',
    subsections: [
      {
        title: 'Visitantes e Convidados',
        content: `É imprescindível a apresentação de documento com foto para cadastro de acesso ao prédio.

A chegada de visitantes será informada via WhatsApp e a entrada liberada somente após autorização da empresa.`,
      },
      {
        title: 'Acesso de Usuários Fixos',
        content: `O cadastro de acesso deve ser solicitado pelo Membro Primário da empresa, com 1 dia útil de antecedência, via grupo de atendimento de WhatsApp, informando nome completo, CPF, e-mail, celular, possíveis restrições de horário e acesso à agenda de salas de reunião.

Para liberação, o usuário deve comparecer à portaria com documento com foto para registro da digital na catraca.

A quantidade de acessos está vinculada ao contrato. Solicitações de cancelamento de acesso devem ser enviadas pelo Membro Primário ao número de Atendimento: (47) 99128-1130.`,
      },
    ],
  },
  {
    id: '1-regras',
    icon: Shield,
    title: 'Regras do Edifício',
    subsections: [
      {
        title: 'Correspondências, Encomendas e Delivery',
        content: `É permitido receber entregas pessoais no endereço do Bold Workplace. Será avisado da chegada via WhatsApp. O campo complemento deve conter o nome do usuário e da empresa. Entregas sem identificação não são recebidas. O usuário deverá acompanhar encomendas que necessitam de pagamento na hora da entrega.`,
      },
      {
        title: 'Código de Conduta e Proibições',
        content: `É dever de todos manter um ambiente respeitoso e inclusivo.

Conforme a Lei Municipal nº 6.775/2010, é proibido fumar nos andares do Bold, incluindo cigarros, vapes e narquilés.

Relatos e sugestões podem ser encaminhados ao número de Atendimento: (47) 99128-1130.`,
      },
    ],
  },
  {
    id: '2-horarios',
    icon: Clock,
    title: 'Horários de Atendimento',
    content: `A portaria do edifício funciona em turno 24/7 com vigilantes. Durante o horário comercial (8h às 18h) temos uma pessoa da nossa equipe responsável pela recepção dos clientes e visitantes no local.

O atendimento comercial e suporte ao cliente está disponível no horário de 9h às 17h.`,
  },
  {
    id: '3-internet',
    icon: Wifi,
    title: 'Internet e VLAN',
    subsections: [
      {
        title: 'Wi-Fi',
        content: `Rede para visitantes:
• Nome da rede: BOLD - CONVIDADO
• Senha: bold2026

A senha do Wi-Fi principal será encaminhada a todos no grupo de WhatsApp criado para suporte.`,
      },
      {
        title: 'Internet Cabeada',
        content: `Todas as estações de trabalho possuem ponto de rede cabeado para acesso imediato à internet e rede principal. É através desta rede que você consegue sincronizar as transmissões nas TVs das salas de reuniões.

Não fornecemos cabos de rede e patch cords.`,
      },
      {
        title: 'Configuração de Rede VLAN Própria',
        content: `Não é permitido a instalação do seu próprio roteador ou servidor de outra operadora no nosso espaço. Antes de realizar qualquer instalação, pedimos que nos informe.

Nos informe se sua empresa necessita de rede VLAN própria. Dispomos de IP Fixo opcional também.`,
      },
    ],
  },
  {
    id: '4-salas',
    icon: Users,
    title: 'Salas de Reunião',
    subsections: [
      {
        title: '12º Andar',
        content: `O 12º andar é o nosso cartão de visitas, é lá que você poderá receber seus clientes.

São 4 salas de reuniões completas, com mobiliário de alto padrão, ar-condicionado silencioso e televisão com alta definição.

• Sala de reunião 1: Capacidade para 12 pessoas
• Sala de reunião 2: Capacidade para 4 pessoas
• Sala de reunião 3: Capacidade para 6 pessoas
• Sala de reunião 4: Capacidade para 6 pessoas

Contamos com o serviço de apoio e copa realizado pela nossa hostess, presente durante todo o horário comercial no 12º andar. Ela fará a recepção inicial de seus clientes ao sair do elevador e permanece como apoio durante todo o período de uso.

Todas as reservas das salas de reuniões incluem serviço de café completo dentro da sala para seu conforto.`,
      },
      {
        title: 'Créditos das Salas de Reunião',
        content: `Os créditos são as horas de uso das salas do 12º andar incluídas no plano contratado pela empresa.

Como funciona:
A empresa recebe um número de horas por mês conforme contrato de estações e as horas são utilizadas de acordo com as reservas efetuadas. Ao ultrapassar os créditos disponíveis, a hora adicional é cobrada.

Hora adicional:
• Sala 1: R$ 180,00/hora
• Salas 2, 3 e 4: R$ 75,00/hora

O usuário terá acesso à quantidade de crédito disponível por meio de sua conta no sistema. Os créditos são válidos por até 60 dias.`,
      },
      {
        title: 'Salas Gratuitas de Reunião',
        content: `Localizadas em outros andares, não utilizam créditos e estão sujeitas à disponibilidade.`,
      },
      {
        title: 'Regras de Uso',
        content: `• Utilização apenas mediante reserva prévia no sistema Conexa
• Tolerância de 10 minutos para início da reserva; após este período, a reserva poderá ser cancelada
• Respeite o horário reservado e verifique a agenda antes de estender o uso
• Mantenha volume adequado e confira a numeração correta da sala
• Não toque na tela da TV com os dedos ou objetos
• É permitido apenas o consumo de água, café, chá e alimentos secos`,
      },
    ],
  },
  {
    id: '5-areas-comuns',
    icon: Building,
    title: 'Áreas Comuns',
    subsections: [
      {
        title: 'Copas e Equipamentos',
        content: `As copas destinam-se ao apoio da rotina diária e não possuem estrutura para preparo e cocção de alimentos.`,
      },
      {
        title: 'Geladeiras',
        content: `São de uso coletivo e destinadas ao armazenamento temporário de lanches e bebidas.

• Não é permitido o armazenamento de alimentos por período superior a 1 dia
• A limpeza interna ocorre todas as sextas-feiras, a partir das 14h, sendo descartados alimentos perecíveis sem identificação
• Alimentos sem condições adequadas de consumo poderão ser descartados, ainda que identificados
• Embalagens fora de proporção poderão ser descartadas a qualquer momento`,
      },
      {
        title: 'Chaleiras Elétricas',
        content: `Destinam-se exclusivamente ao aquecimento de água. Não é permitido o preparo direto de alimentos ou bebidas na chaleira.`,
      },
      {
        title: 'Micro-ondas',
        content: `• O uso é individual, respeitando a capacidade do equipamento
• Deve-se evitar o aquecimento de alimentos com odores intensos ou que possam sujar o equipamento
• O descongelamento de alimentos deve ser realizado previamente`,
      },
      {
        title: 'Louças, Talheres e Utensílios',
        content: `O Bold Workplace não oferece louças (talheres e pratos) para utilização nas copas, apenas a caneca de café preta é de uso coletivo.

Cada usuário é responsável pela higienização e armazenamento de seus utensílios.

Restos de alimentos devem ser descartados no lixo antes da lavagem.`,
      },
      {
        title: 'Limpeza',
        content: `• A limpeza das áreas comuns e salas privativas segue cronograma estabelecido
• Caso a sala não esteja acessível no horário previsto, a limpeza ocorrerá no próximo ciclo
• Disponibilizam-se flanelas e álcool para limpeza de mesas — solicite para nossa equipe
• Limpeza de monitores ou mesas privadas são de responsabilidade do usuário
• Limpezas extras poderão ser solicitadas mediante pagamento de taxa de R$ 200,00, incluindo frigobar, estantes, cafeteiras, mesa e lixeira particular`,
      },
      {
        title: 'Lixeiras',
        content: `• Cada sala privada poderá contar com lixeira própria, cuja aquisição é de responsabilidade do cliente
• O descarte deverá ser realizado nas lixeiras dos corredores e copas
• As lixeiras das áreas comuns são recolhidas diariamente
• Não é permitido o descarte de líquido nas lixeiras`,
      },
      {
        title: 'Banheiros',
        content: `• Os banheiros são limpos diariamente, com reposição de insumos. Durante o período de limpeza, não é permitido o uso das instalações
• Não é permitido lavagem de louças nas pias dos banheiros
• No banheiro masculino, o vaso sanitário deve ser utilizado sentado`,
      },
    ],
  },
  {
    id: '6-impressora',
    icon: Printer,
    title: 'Impressora',
    content: `O Bold disponibiliza impressora preto e branco (A4), com funções de impressão e cópia, localizada no 12º andar, ao lado da copa.

Para configurar no computador, solicite apoio pelo grupo de atendimento de WhatsApp.

Não há limite de impressões — contamos com o uso consciente para manter o benefício para todos.

Em caso de falta de papel, há folhas disponíveis no móvel abaixo do equipamento.`,
  },
  {
    id: '7-estacionamento',
    icon: Car,
    title: 'Estacionamento',
    subsections: [
      {
        title: 'Acesso Mensal',
        content: `Vagas cobertas e descobertas estão disponíveis para contratação mensal por usuário do edifício, com acesso pela Rua São Paulo. O estacionamento está localizado em terreno anexo, com acesso interno de pedestres ao prédio.

As vagas cobertas são numeradas e de uso exclusivo.

O local possui monitoramento, controle de acesso e iluminação contínua.

Valores:
• R$ 120,00/mês — vaga descoberta
• R$ 250,00/mês — vaga coberta

A contratação deve ser solicitada pelo grupo de atendimento via WhatsApp.`,
      },
      {
        title: 'Acesso Diário',
        content: `Há disponibilidade de vagas para uso diário, com acesso pela Rua Ministro Calógeras.

O valor da diária é de R$ 20,00 por acesso, com cobrança posterior via boleto, podendo ser acumulada para faturamento.`,
      },
      {
        title: 'Visitantes',
        content: `As vagas destinadas a visitantes das empresas são gratuitas e possuem acesso pela Rua Ministro Calógeras.`,
      },
    ],
  },
  {
    id: '8-beneficios',
    icon: Gift,
    title: 'Benefícios',
    intro: 'Os usuários do edifício contam com benefícios decorrentes de convênios com parceiros.',
    subsections: [
      {
        title: 'Restaurante Zum Schlauch',
        content: `Desconto de 20% no almoço, de segunda a sexta.`,
      },
      {
        title: 'Academia Pratique',
        content: `Academia próxima ao edifício. Disponível mediante envio dos dados cadastrais no grupo de atendimento do WhatsApp: nome completo, CPF, data de nascimento, telefone, e-mail.

Após a liberação do acesso ao aplicativo da academia, o usuário finaliza seu cadastro, sendo toda a contratação, cobrança e eventual cancelamento realizados diretamente pelo aplicativo.`,
      },
    ],
  },
];

export default function Manual() {
  const { menuItems, isLoading: isMenuLoading } = useMenu();

  const menuByCategory = menuItems.reduce((acc, item) => {
    const category = item.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

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
                <AccordionTrigger className="py-4 [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    {section.intro && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.intro}
                      </p>
                    )}
                    {section.content && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {section.content}
                      </p>
                    )}
                    {section.subsections?.map((sub, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <h4 className="text-sm font-semibold text-foreground">
                          {sub.title}
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                          {sub.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}

          {/* Seção 9 - Cardápio (dinâmico do banco) */}
          <AccordionItem
            value="9-cardapio"
            className="border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="py-4 [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Cardápio</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {isMenuLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : Object.keys(menuByCategory).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum item disponível no momento.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(menuByCategory).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {items.filter(item => item.is_available).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-2 py-2 border-b border-border last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              {formatPrice(item.price)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </AppLayout>
  );
}
