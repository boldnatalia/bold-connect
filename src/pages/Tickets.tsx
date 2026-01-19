import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TICKET_STATUS_LABELS, TicketStatus } from '@/types';
import { cn } from '@/lib/utils';

export default function Tickets() {
  const { tickets, isLoading } = useTickets();
  const [filter, setFilter] = useState<TicketStatus | 'all'>('all');

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter((t) => t.status === filter);

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

  return (
    <AppLayout
      title="Chamados"
      rightAction={
        <Link to="/tickets/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Novo
          </Button>
        </Link>
      }
    >
      <div className="p-4 space-y-4 max-w-lg mx-auto animate-fade-in">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as TicketStatus | 'all')}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pendentes</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs">Em andamento</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">Resolvidos</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`}>
                <Card className="card-premium hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={cn('text-[10px] shrink-0', getStatusClass(ticket.status))}
                          >
                            {TICKET_STATUS_LABELS[ticket.status]}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {ticket.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {ticket.status === 'pending' ? 'Pendente há ' : 'Aberto há '}
                          {formatDistanceToNow(new Date(ticket.created_at), {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="card-premium">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="font-medium mb-1">Nenhum chamado encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                {filter === 'all'
                  ? 'Você ainda não abriu nenhum chamado'
                  : `Nenhum chamado ${TICKET_STATUS_LABELS[filter as TicketStatus].toLowerCase()}`}
              </p>
              <Link to="/tickets/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Abrir Chamado
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
