import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useTickets } from '@/hooks/useTickets';
import { useTicketComments } from '@/hooks/useTicketComments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Send, Loader2, Settings2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TICKET_STATUS_LABELS, TicketStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { getServiceTypeMeta } from '@/lib/ticketIcons';
import { markTicketSeen } from '@/lib/ticketSeen';

function isSystemMessage(content: string) {
  return /^\s*(status alterado|sistema:|status:)/i.test(content);
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tickets, isLoading: ticketsLoading } = useTickets();
  const { comments, isLoading: commentsLoading, addComment, isAdding } = useTicketComments(id || '');
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const ticket = tickets.find(t => t.id === id);

  // Mark as seen whenever this ticket page is open
  useEffect(() => {
    if (id) markTicketSeen(id);
  }, [id, comments.length]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const getStatusClass = (status: TicketStatus) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'in_progress':
        return 'status-in-progress';
      case 'resolved':
        return 'status-resolved';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.length > 50) return;
    addComment(newComment.trim(), { onSuccess: () => setNewComment('') });
  };

  if (ticketsLoading) {
    return (
      <AppLayout title="Detalhes do Chamado" showBack>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout title="Chamado não encontrado" showBack>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Este chamado não foi encontrado.</p>
          <Button className="mt-4" onClick={() => navigate('/tickets')}>
            Ver meus chamados
          </Button>
        </div>
      </AppLayout>
    );
  }

  const { Icon: ServiceIcon, label: serviceLabel } = getServiceTypeMeta(ticket.title);

  return (
    <AppLayout title="Detalhes" showBack>
      <div className="flex flex-col h-[calc(100dvh-8rem)]">
        {/* Problema reportado - topo */}
        <div className="px-4 pt-4 pb-3 border-b bg-background space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-xs', getStatusClass(ticket.status))}>
              {TICKET_STATUS_LABELS[ticket.status]}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(ticket.created_at), { locale: ptBR, addSuffix: true })}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"
              aria-label={serviceLabel}
              title={serviceLabel}
            >
              <ServiceIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {serviceLabel}
              </p>
              <h2 className="font-semibold text-base leading-snug">{ticket.title}</h2>
            </div>
          </div>

          {ticket.description?.trim() && (
            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-muted-foreground/20 pl-3">
              {ticket.description}
            </p>
          )}
        </div>

        {/* Histórico de Atendimento - Timeline */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Histórico de Atendimento
          </h3>

          {commentsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Aguardando atualização da administração
              </p>
            </div>
          ) : (
            <ol className="relative border-l border-muted pl-5 space-y-4">
              {comments.map((comment) => {
                const system = comment.is_admin && isSystemMessage(comment.content);
                const adminChat = comment.is_admin && !system;
                const isClient = !comment.is_admin;

                return (
                  <li key={comment.id} className="relative">
                    {/* Timeline dot */}
                    <span
                      className={cn(
                        'absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background',
                        system && 'bg-muted-foreground/40',
                        adminChat && 'bg-primary',
                        isClient && 'bg-secondary-foreground/40'
                      )}
                    />

                    {system && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 italic">
                        <Settings2 className="h-3 w-3" />
                        <span>{comment.content}</span>
                        <span className="text-muted-foreground/70">
                          • {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    )}

                    {adminChat && (
                      <div className="max-w-[90%]">
                        <p className="text-[10px] font-medium text-primary mb-1">Administração</p>
                        <div className="relative bg-primary/10 border border-primary/15 text-foreground rounded-2xl rounded-tl-sm px-3 py-2">
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    )}

                    {isClient && (
                      <div className="max-w-[90%] ml-auto text-right">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Você</p>
                        <div className="inline-block bg-muted text-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-left">
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input - Fixed at bottom */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Responder à administração..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value.slice(0, 50))}
                maxLength={50}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {newComment.length}/50
              </span>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!newComment.trim() || isAdding}
              className="shrink-0 h-10 w-10"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
