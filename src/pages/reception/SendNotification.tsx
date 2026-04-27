import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReceptionMessages } from '@/hooks/useReceptionMessages';
import { useReceptionNotifications } from '@/hooks/useReceptionNotifications';
import { useProfiles } from '@/hooks/useProfiles';
import { useToast } from '@/hooks/use-toast';
import {
  Send, User, Loader2, Search, Check, X,
  Users, Package, UtensilsCrossed, Bell, Car, Coffee,
  Mail, AlertCircle, MessageSquare, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Map category/title keywords to icons
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

export default function SendNotification() {
  const navigate = useNavigate();
  const { messages, isLoading: messagesLoading } = useReceptionMessages();
  const { sendNotification, isSending } = useReceptionNotifications();
  const { profiles, isLoading: profilesLoading } = useProfiles();
  const { toast } = useToast();

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
        (p.company || '').toLowerCase().includes(q) ||
        (p.room || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [recipientQuery, activeClients]);

  const handleSend = async () => {
    if (!selectedRecipient || !selectedMessage) {
      toast({ title: 'Erro', description: 'Selecione o destinatário e o tipo de aviso', variant: 'destructive' });
      return;
    }

    const requiresClientResponse = selectedMessageData?.has_input_field && selectedMessageData.category === 'Códigos';

    if (selectedMessageData?.has_input_field && !requiresClientResponse && !inputValue.trim()) {
      toast({ title: 'Erro', description: `Preencha: ${selectedMessageData.input_field_label}`, variant: 'destructive' });
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
      toast({ title: '✓ Aviso enviado!', description: `Notificação entregue a ${selectedRecipientData?.full_name}.` });

      setTimeout(() => {
        navigate('/recepcao');
      }, 900);
    } catch {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente', variant: 'destructive' });
    }
  };

  if (messagesLoading || profilesLoading) {
    return (
      <AppLayout title="Enviar Aviso" showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Enviar Aviso" showBack>
      <div className="p-4 space-y-4 pb-32">
        {/* Recipient — autocomplete search */}
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
                    {selectedRecipientData.company} · {selectedRecipientData.floor?.name || ''} Sala {selectedRecipientData.room}
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
                            {p.company} · {p.floor?.name || ''} Sala {p.room}
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

        {/* Message type — grid 2 columns */}
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
                const isSelected = selectedMessage === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => { setSelectedMessage(msg.id); setInputValue(''); }}
                    className={cn(
                      'relative aspect-square flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border text-center transition-all duration-200 active:scale-95',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/60 bg-card hover:bg-muted/40'
                    )}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                    <span className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      isSelected ? 'bg-primary/20' : 'bg-primary/10'
                    )}>
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <span className="text-xs font-medium leading-tight line-clamp-2">
                      {msg.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Input field (reception input) */}
        {selectedMessageData?.has_input_field && selectedMessageData.category !== 'Códigos' && (
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{selectedMessageData.input_field_label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={selectedMessageData.input_field_placeholder || ''}
                className="min-h-[44px] rounded-xl"
              />
            </CardContent>
          </Card>
        )}

        {selectedMessageData?.has_input_field && selectedMessageData.category === 'Códigos' && (
          <Card className="rounded-2xl border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                ℹ️ O cliente receberá este aviso e poderá responder com o código direto pelo app.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {selectedMessageData && selectedRecipientData && (
          <Card className="rounded-2xl border-border/60 bg-muted/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Prévia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {selectedMessageData.content}
                {inputValue && <span className="font-semibold"> {inputValue}</span>}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky send button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-background/95 backdrop-blur border-t border-border/60">
        <Button
          onClick={handleSend}
          disabled={!selectedRecipient || !selectedMessage || isSending || justSent}
          className="w-full min-h-[52px] rounded-xl text-base font-medium shadow-md"
          size="lg"
        >
          {justSent ? (
            <><Check className="h-5 w-5 mr-2" />Enviado!</>
          ) : isSending ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" />Enviando...</>
          ) : (
            <><Send className="h-5 w-5 mr-2" />Enviar Aviso</>
          )}
        </Button>
      </div>
    </AppLayout>
  );
}
