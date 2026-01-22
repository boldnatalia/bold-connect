import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useTickets } from '@/hooks/useTickets';
import { useTicketComments } from '@/hooks/useTicketComments';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Send, Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TICKET_STATUS_LABELS, TicketStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tickets, isLoading: ticketsLoading } = useTickets();
  const { comments, isLoading: commentsLoading, addComment, isAdding } = useTicketComments(id || '');
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const ticket = tickets.find(t => t.id === id);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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
    
    addComment(newComment.trim(), {
      onSuccess: () => setNewComment(''),
    });
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

  return (
    <AppLayout title="Detalhes" showBack>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Ticket Info - Fixed at top */}
        <div className="p-4 space-y-3 border-b bg-background">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-xs', getStatusClass(ticket.status))}>
              {TICKET_STATUS_LABELS[ticket.status]}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(ticket.created_at), {
                locale: ptBR,
                addSuffix: true,
              })}
            </span>
          </div>

          <h2 className="font-semibold text-lg">{ticket.title}</h2>
          
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <p className="text-sm">{ticket.description}</p>
            </CardContent>
          </Card>
        </div>

        {/* Comments Section - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MessageCircle className="h-4 w-4" />
            <span>Atualizações</span>
          </div>

          {commentsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Nenhuma atualização ainda
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  'p-3 rounded-xl max-w-[85%]',
                  comment.is_admin
                    ? 'bg-primary/10 border border-primary/20 ml-auto'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm">{comment.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {comment.is_admin ? 'Administrador • ' : ''}
                  {format(new Date(comment.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input - Fixed at bottom */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Adicionar comentário..."
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
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
