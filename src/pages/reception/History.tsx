import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useReceptionNotifications } from '@/hooks/useReceptionNotifications';
import { Loader2, CheckCircle2, Clock, Eye, MessageSquare, Quote, RotateCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type StatusKind = 'responded' | 'pending' | 'unread' | 'read';

function getStatus(n: { requires_response: boolean; response_value: string | null; is_read: boolean }): StatusKind {
  if (n.requires_response && n.response_value) return 'responded';
  if (n.requires_response && !n.response_value) return 'pending';
  if (!n.is_read) return 'unread';
  return 'read';
}

const STATUS_STYLES: Record<StatusKind, { label: string; className: string; Icon: typeof Clock }> = {
  responded: {
    label: 'Respondido',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
    Icon: CheckCircle2,
  },
  pending: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
    Icon: Clock,
  },
  unread: {
    label: 'Não visualizado',
    className: 'bg-muted text-muted-foreground border-border',
    Icon: Eye,
  },
  read: {
    label: 'Visualizado',
    className: 'bg-muted/60 text-muted-foreground border-border/60',
    Icon: CheckCircle2,
  },
};

export default function ReceptionHistory() {
  const { notifications, isLoading, sendNotification } = useReceptionNotifications();
  const { toast } = useToast();
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResend = async (n: typeof notifications[number]) => {
    if (!n.message_id) {
      toast({ title: 'Não é possível reenviar', description: 'Mensagem original indisponível.', variant: 'destructive' });
      return;
    }
    try {
      setResendingId(n.id);
      await sendNotification({
        recipientId: n.recipient_id,
        messageId: n.message_id,
        inputValue: n.input_value || undefined,
        requiresResponse: n.requires_response,
      });
      toast({ title: '✓ Reenviado!', description: `Notificação enviada novamente a ${n.recipient?.full_name || 'cliente'}.` });
    } catch {
      toast({ title: 'Erro ao reenviar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setResendingId(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Histórico" showBack>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <AppLayout title="Histórico" showBack>
      <div className="p-4 space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum aviso enviado ainda</p>
          </div>
        ) : (
          sorted.map((n) => {
            const status = getStatus(n);
            const { label, className, Icon } = STATUS_STYLES[status];
            return (
              <Card key={n.id} className="rounded-2xl border-border/60 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {n.recipient?.full_name || 'Cliente'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {n.message?.title || 'Aviso personalizado'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium',
                        className
                      )}>
                        <Icon className="h-3 w-3" />
                        {label}
                      </span>
                      {status === 'unread' && (
                        <button
                          onClick={() => handleResend(n)}
                          disabled={resendingId === n.id}
                          aria-label="Reenviar notificação"
                          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {resendingId === n.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCw className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {n.input_value && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Info:</span> {n.input_value}
                    </div>
                  )}

                  {/* Highlighted client response */}
                  {n.response_value && (
                    <div className="rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-green-700 dark:text-green-300 font-semibold mb-1">
                        <Quote className="h-3 w-3" />
                        Resposta do cliente
                      </div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        {n.response_value}
                      </p>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
