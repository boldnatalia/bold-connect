import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReceptionMessages } from '@/hooks/useReceptionMessages';
import { useReceptionNotifications } from '@/hooks/useReceptionNotifications';
import { useProfiles } from '@/hooks/useProfiles';
import { useCustomers } from '@/hooks/useCustomers';
import { usePersons } from '@/hooks/usePersons';
import { useToast } from '@/hooks/use-toast';
import {
  Send, User, Loader2, Search, Check, X, ArrowLeft,
  Users, Package, UtensilsCrossed, Bell, Car, Coffee,
  Mail, AlertCircle, MessageSquare, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function getMessageIcon(msg: { title: string; category: string | null }) {
  const t = `${msg.title} ${msg.category ?? ''}`.toLowerCase();
  if (t.includes('visit')) return Users;
  if (t.includes('entrega') || t.includes('encomenda')) return Package;
  if (t.includes('ifood') || t.includes('lanche') || t.includes('comida') || t.includes('código')) return UtensilsCrossed;
  if (t.includes('café') || t.includes('cafe')) return Coffee;
  if (t.includes('carro') || t.includes('estaciona') || t.includes('vaga')) return Car;
  if (t.includes('correio') || t.includes('carta')) return Mail;
  if (t.includes('urgente') || t.includes('alerta')) return AlertCircle;
  if (t.includes('reunião') || t.includes('sala')) return Building2;
  if (t.includes('aviso')) return Bell;
  return MessageSquare;
}

function buildPreview(content: string, recipientName: string, inputValue?: string) {
  let text = content
    .replace(/\[nome\]/gi, recipientName.split(' ')[0])
    .replace(/\{nome\}/gi, recipientName.split(' ')[0]);
  if (inputValue) {
    text = text.replace(/\[valor\]|\{valor\}|\[codigo\]|\{codigo\}/gi, inputValue);
    if (!/\[valor\]|\{valor\}|\[codigo\]|\{codigo\}/i.test(content)) {
      text = `${text} ${inputValue}`;
    }
  }
  return text;
}

export default function SendNotification() {
  const navigate = useNavigate();
  const { messages, isLoading: messagesLoading } = useReceptionMessages();
  const { sendNotification, isSending } = useReceptionNotifications();
  const { profiles, isLoading: profilesLoading } = useProfiles();
  const { customers } = useCustomers();
  const { persons, isLoading: personsLoading } = usePersons();
  const { toast } = useToast();

  const customerById = useMemo(() => {
    const m = new Map<string, { name: string; trade_name: string | null }>();
    customers.forEach(c => m.set(c.id, { name: c.name, trade_name: c.trade_name }));
    return m;
  }, [customers]);

  const companyOf = (p: any): string => {
    const cid = p?.conexa_customer_id;
    const c = cid ? customerById.get(cid) : null;
    return c?.trade_name || c?.name || p?.company || '';
  };

  // Map of profiles keyed by conexa_person_id for instant lookup
  const profileByPersonId = useMemo(() => {
    const m = new Map<string, any>();
    profiles.forEach(p => {
      const pid = (p as any).conexa_person_id;
      if (pid && p.is_active) m.set(pid, p);
    });
    return m;
  }, [profiles]);

  // Searchable list: only Conexa persons that have a linked active profile (app user)
  const searchablePersons = useMemo(() => {
    return persons
      .filter(person => profileByPersonId.has(person.id))
      .map(person => {
        const profile = profileByPersonId.get(person.id);
        const customer = person.customer_id ? customerById.get(person.customer_id) : null;
        return {
          person,
          profile,
          companyName: customer?.trade_name || customer?.name || profile?.company || '',
        };
      });
  }, [persons, profileByPersonId, customerById]);

  const [step, setStep] = useState<1 | 2>(1);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [justSent, setJustSent] = useState(false);

  const selectedMessageData = messages.find(m => m.id === selectedMessage);
  const activeClients = profiles.filter(p => p.is_active);
  const selectedRecipientData = activeClients.find(p => p.user_id === selectedRecipient);

  const filteredClients = useMemo(() => {
    if (!recipientQuery.trim()) return [];
    const q = recipientQuery.toLowerCase();
    return activeClients
      .filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        companyOf(p).toLowerCase().includes(q) ||
        (p.room || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [recipientQuery, activeClients, customerById]);

  const requiresClientResponse = selectedMessageData?.has_input_field && selectedMessageData.category === 'Códigos';
  const needsReceptionInput = selectedMessageData?.has_input_field && !requiresClientResponse;

  const handlePickMessage = (id: string) => {
    if (!selectedRecipient) {
      toast({ title: 'Selecione um destinatário', description: 'Busque pelo nome do cliente primeiro.', variant: 'destructive' });
      return;
    }
    setSelectedMessage(id);
    setInputValue('');
    // Auto-advance to confirmation
    setStep(2);
  };

  const handleSend = async () => {
    if (!selectedRecipient || !selectedMessage) return;

    if (needsReceptionInput && !inputValue.trim()) {
      toast({ title: 'Preencha o campo', description: selectedMessageData?.input_field_label || '', variant: 'destructive' });
      return;
    }

    try {
      await sendNotification({
        recipientId: selectedRecipient,
        messageId: selectedMessage,
        inputValue: requiresClientResponse ? undefined : (inputValue.trim() || undefined),
        requiresResponse: requiresClientResponse,
      });

      setJustSent(true);
      toast({ title: '✓ Notificação enviada!', description: `Entregue a ${selectedRecipientData?.full_name}.` });

      setTimeout(() => navigate('/recepcao'), 900);
    } catch {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente', variant: 'destructive' });
    }
  };

  if (messagesLoading || profilesLoading) {
    return (
      <AppLayout title="Nova Notificação" showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // ============ STEP 2: Confirmation ============
  if (step === 2 && selectedMessageData && selectedRecipientData) {
    const Icon = getMessageIcon(selectedMessageData);
    const previewText = buildPreview(
      selectedMessageData.content,
      selectedRecipientData.full_name,
      inputValue
    );

    return (
      <AppLayout title="Confirmar Envio">
        <div className="min-h-[calc(100dvh-56px)] bg-[#F8F9FA] dark:bg-muted/30">
          <div className="p-4 pb-[180px] space-y-4">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground min-h-[44px] -ml-1 px-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar e editar
            </button>

            <Card className="rounded-2xl border-border/60 shadow-sm bg-card">
              <CardContent className="p-5 space-y-5">
                {/* Recipient highlight */}
                <div className="text-center space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                    Notificar
                  </p>
                  <p className="text-xl font-bold leading-tight">
                    {selectedRecipientData.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {companyOf(selectedRecipientData)} · {selectedRecipientData.floor?.name || ''} Sala {selectedRecipientData.room}
                  </p>
                </div>

                <div className="h-px bg-border/60" />

                {/* Message icon + title */}
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-center">
                    {selectedMessageData.title}
                  </p>
                </div>

                {/* Optional reception input on confirmation */}
                {needsReceptionInput && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      {selectedMessageData.input_field_label}
                    </label>
                    <Input
                      autoFocus
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={selectedMessageData.input_field_placeholder || ''}
                      className="min-h-[44px] rounded-xl"
                    />
                  </div>
                )}

                {/* Full message */}
                <div className="rounded-xl bg-muted/60 dark:bg-muted/40 p-4 border border-border/40">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                    Mensagem que será enviada
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {previewText}
                  </p>
                </div>

                {requiresClientResponse && (
                  <p className="text-xs text-muted-foreground text-center">
                    ℹ️ O cliente poderá responder com o código pelo app.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sticky confirm button — sits above the 56px BottomNav */}
          <div className="fixed bottom-[56px] left-0 right-0 max-w-lg mx-auto p-4 bg-[#F8F9FA]/95 dark:bg-background/95 backdrop-blur border-t border-border/60 z-40">
            <Button
              onClick={handleSend}
              disabled={isSending || justSent}
              className="w-full min-h-[56px] rounded-2xl text-base font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {justSent ? (
                <><Check className="h-5 w-5 mr-2" />Enviado!</>
              ) : isSending ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" />Enviando...</>
              ) : (
                <><Send className="h-5 w-5 mr-2" />Confirmar e Enviar Notificação</>
              )}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ============ STEP 1: Pick recipient + message ============
  return (
    <AppLayout title="Nova Notificação" showBack>
      <div className="p-4 space-y-4 pb-[120px]">
        {/* Recipient */}
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Destinatário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedRecipientData ? (
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-primary/10 border border-primary/30">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{selectedRecipientData.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {companyOf(selectedRecipientData)} · {selectedRecipientData.floor?.name || ''} Sala {selectedRecipientData.room}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => { setSelectedRecipient(''); setRecipientQuery(''); }}
                  aria-label="Trocar destinatário"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={recipientQuery}
                    onChange={(e) => setRecipientQuery(e.target.value)}
                    placeholder="Digite o nome do cliente..."
                    className="pl-10 min-h-[44px] rounded-xl"
                  />
                </div>
                {recipientQuery.trim() && (
                  <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/60">
                    {filteredClients.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        Nenhum cliente encontrado
                      </div>
                    ) : (
                      filteredClients.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedRecipient(p.user_id); setRecipientQuery(''); }}
                          className="w-full text-left p-3 hover:bg-muted/50 active:bg-muted transition-colors min-h-[44px]"
                        >
                          <p className="font-medium text-sm">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {companyOf(p)} · {p.floor?.name || ''} Sala {p.room}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Message type — grid, click to advance */}
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Tipo de Aviso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2.5">
              {messages.map((msg) => {
                const Icon = getMessageIcon(msg);
                return (
                  <button
                    key={msg.id}
                    onClick={() => handlePickMessage(msg.id)}
                    disabled={!selectedRecipient}
                    className={cn(
                      'relative aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 text-center transition-all duration-200 active:scale-95',
                      'border-border/60 bg-card',
                      'hover:bg-primary/5 hover:border-primary/40',
                      'focus-visible:bg-primary/10 focus-visible:border-primary',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-card disabled:hover:border-border/60'
                    )}
                  >
                    <span className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <span className="text-xs font-medium leading-tight line-clamp-2">
                      {msg.title}
                    </span>
                  </button>
                );
              })}
            </div>
            {!selectedRecipient && (
              <p className="text-[11px] text-muted-foreground text-center mt-3">
                Selecione um destinatário acima para continuar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
